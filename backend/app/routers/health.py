"""Liveness and dependency checks.

`/api/health` is what the navigation badge polls, so it must answer even when
the database is unreachable - it reports the failure rather than raising.

The `/api` prefix is load-bearing: the frontend calls `${API_BASE}/health`, which
resolves to `/api/health`. Without it the route lands on `/health` and the badge
reports the API as down forever.
"""

from __future__ import annotations

from fastapi import APIRouter

from .. import __version__, db
from ..config import get_settings
from ..schemas import HealthOut

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthOut)
async def health() -> HealthOut:
    settings = get_settings()

    missing = settings.missing()
    if missing:
        return HealthOut(
            status="misconfigured",
            database="unknown",
            version=__version__,
            detail=f"Missing environment variables: {', '.join(missing)}",
        )

    try:
        client = db.get_anon_client()
        client.from_("feedback").select("id").limit(1).execute()
    except Exception as exc:  # noqa: BLE001
        return HealthOut(
            status="degraded",
            database="unreachable",
            version=__version__,
            detail=str(exc)[:300],
        )

    return HealthOut(status="ok", database="connected", version=__version__)
