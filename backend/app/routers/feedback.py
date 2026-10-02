"""Feedback submission and retrieval.

This is the write path that used to live in the browser, where a failed insert
was downgraded to a `console.warn` and the user was still shown a success
modal. Nothing here swallows an error: if the row did not land, the caller
gets a 5xx and the UI says so.

Reads and writes both use `db.admin_client()` rather than forwarding the
caller's token. This API is the authorisation boundary: it verifies the
Supabase session and the `profiles.role` claim itself, then talks to Postgres
with a key the browser never sees.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from .. import db
from ..analysis import analyze_sentiment, extract_themes
from ..schemas import FeedbackCreate, FeedbackListOut, FeedbackOut, ThemeListOut, ThemeOut
from ..security import require_admin, throttle

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

# PostgREST caps rows per request; corpora above this are paged with `offset`.
MAX_ROWS = 2000


def _enrich(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Attach each row's themes in a single extra query, not one per row."""
    if not rows:
        return []

    ids = [row["id"] for row in rows if row.get("id")]
    if not ids:
        return [{**row, "themes": []} for row in rows]

    try:
        theme_result = (
            db.admin_client()
            .from_("feedback_themes")
            .select("feedback_id, theme, theme_type")
            .in_("feedback_id", ids)
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        # The corpus is still readable without themes. Logged, and the caller's
        # envelope is still honest about how many rows it got.
        log.warning("Theme lookup failed: %s", exc)
        return [{**row, "themes": []} for row in rows]

    grouped: dict[str, list[dict[str, Any]]] = {}
    for theme in db.rows(theme_result):
        grouped.setdefault(theme.get("feedback_id"), []).append(
            {"theme": theme.get("theme"), "theme_type": theme.get("theme_type")}
        )

    return [{**row, "themes": grouped.get(row.get("id"), [])} for row in rows]


def _missing_course_code(exc: Exception) -> bool:
    """True when PostgREST refused the insert purely because `course_code` is absent.

    Projects that have not yet run `supabase_migration_02_analysis_ownership.sql`
    have no such column, and PostgREST rejects the whole row. Dropping the one
    field and retrying keeps submissions working before the migration is run,
    without hiding any other insert failure.
    """
    text = str(exc)
    return "course_code" in text and "PGRST204" in text


def _insert_row(client: Any, record: dict[str, Any]) -> list[dict[str, Any]]:
    try:
        return db.rows(client.from_("feedback").insert([record]).execute())
    except Exception as exc:  # noqa: BLE001
        if not _missing_course_code(exc):
            raise
        log.warning(
            "feedback.course_code is missing from the database; retrying without it. "
            "Run supabase_migration_02_analysis_ownership.sql to restore the column."
        )
        reduced = {key: value for key, value in record.items() if key != "course_code"}
        return db.rows(client.from_("feedback").insert([reduced]).execute())


@router.post(
    "",
    response_model=FeedbackOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(throttle)],
)
async def create_feedback(payload: FeedbackCreate) -> dict[str, Any]:
    """Accept a public submission, analyse it server-side, persist it.

    Sentiment and themes are computed here rather than by a database trigger,
    so the label on a record has exactly one possible origin.
    """
    # The service-role client, not the anon one. The browser no longer speaks to
    # Supabase at all (no SDK ships in the bundle), so a public insert policy
    # protects nothing here - and on a project that has not run migration 02 it
    # actively blocks the write with a 42501 RLS violation. This API is the only
    # writer, it validates every field in Pydantic first, and anonymity is
    # structural below.
    client = db.admin_client()
    analysis = analyze_sentiment(payload.comment)

    record = {
        "student_name": None,  # anonymity is structural, not a request
        "course_code": payload.course_code,
        "course_name": payload.course_name,
        "department": payload.department,
        "faculty_name": payload.faculty_name,
        "category": payload.category,
        "rating": payload.rating,
        "comment": payload.comment,
        "is_anonymous": payload.is_anonymous,
        "sentiment_label": analysis["sentiment_label"],
        "sentiment_score": analysis["sentiment_score"],
    }

    try:
        inserted = _insert_row(client, record)
    except Exception as exc:  # noqa: BLE001
        log.exception("Feedback insert failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The feedback store rejected this submission. Nothing was saved - please try again.",
        ) from exc

    if not inserted:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The submission was accepted but no record was returned. Please try again.",
        )

    stored = inserted[0]
    feedback_id = stored.get("id")

    themes = extract_themes(payload.comment)
    if feedback_id and themes:
        theme_rows = [
            {"feedback_id": feedback_id, "theme": theme.theme, "theme_type": theme.theme_type}
            for theme in themes
        ]
        try:
            # Service role, not the anon client: the submission above is a public
            # insert by design, but `feedback_themes` has no anon policy because
            # only the API may classify a record. Using `client` here would raise
            # an RLS violation and silently strip themes from the dashboard.
            db.admin_client().from_("feedback_themes").insert(theme_rows).execute()
        except Exception:  # noqa: BLE001
            # The feedback itself is safe. A missing theme only costs the
            # dashboard one bar, so report it without failing the submission.
            log.exception("Theme insert failed for feedback %s", feedback_id)

    stored.setdefault("created_at", datetime.now(timezone.utc).isoformat())
    return {**stored, "themes": [{"theme": t.theme, "theme_type": t.theme_type} for t in themes]}


@router.get("", response_model=FeedbackListOut)
async def list_feedback(
    limit: int = MAX_ROWS,
    offset: int = 0,
    _admin: dict | None = Depends(require_admin),
) -> FeedbackListOut:
    """Newest first. Protected: the corpus contains verbatim comments."""
    limit = max(1, min(limit, MAX_ROWS))
    offset = max(0, offset)

    try:
        result = (
            db.admin_client()
            .from_("feedback")
            .select("*")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        log.exception("Feedback read failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not read the feedback corpus.",
        ) from exc

    rows = db.rows(result)
    return FeedbackListOut(items=_enrich(rows), total=len(rows))


@router.get("/themes", response_model=ThemeListOut)
async def list_themes(
    limit: int = 10000,
    _admin: dict | None = Depends(require_admin),
) -> ThemeListOut:
    """Flat theme rows, used by the inspector's ranked praise/issue lists."""
    try:
        result = (
            db.admin_client()
            .from_("feedback_themes")
            .select("id, feedback_id, theme, theme_type")
            .limit(max(1, min(limit, 20000)))
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        log.warning("Theme read failed: %s", exc)
        return ThemeListOut(
            items=[],
            total=0,
            degraded=True,
            notice="The theme index is unavailable, so the corpus is shown without ranked themes.",
        )

    rows = db.rows(result)
    return ThemeListOut(items=[ThemeOut(**row) for row in rows], total=len(rows))


@router.get("/{feedback_id}", response_model=FeedbackOut)
async def get_feedback(feedback_id: str, _admin: dict | None = Depends(require_admin)) -> FeedbackOut:
    try:
        result = db.admin_client().from_("feedback").select("*").eq("id", feedback_id).limit(1).execute()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Could not read that record.") from exc

    rows = db.rows(result)
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No such feedback record.")

    return FeedbackOut(**_enrich(rows)[0])


@router.delete(
    "/{feedback_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    # See the note on `/api/auth/logout`: 204 forbids a body, so the inferred
    # response model has to be switched off explicitly.
    response_model=None,
)
async def delete_feedback(feedback_id: str, _admin: dict | None = Depends(require_admin)) -> None:
    """Deletes the row; `feedback_themes` cascades via the FK."""
    try:
        result = db.admin_client().from_("feedback").delete().eq("id", feedback_id).execute()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Could not delete that record.") from exc

    if not db.rows(result):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No such feedback record.")

    return None
