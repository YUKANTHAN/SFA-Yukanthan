"""Admin authentication.

Credentials are verified by Supabase Auth; this router only brokers the
exchange and reports the caller's role. No password is ever stored, logged,
or compared in application code, and there is no bypass account - the
`admin@college.edu / admin123` shortcut that lived in the browser bundle is
gone.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from .. import db
from ..config import get_settings
from ..schemas import LoginRequest, LoginResponse, UserOut
from ..security import maybe_admin, resolve_principal

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _session_of(response: Any) -> Any:
    """The `gotrue` session carried by an Auth response.

    `supabase-py` 2.x returns an `AuthResponse` whose fields are `user` and
    `session` only - `access_token` is NOT on the top level. Older and newer
    builds differ here, so read through `session` and fall back.
    """
    return getattr(response, "session", None) or response


@router.post(
    "/login",
    response_model=LoginResponse,
)
async def login(payload: LoginRequest) -> LoginResponse:
    settings = get_settings()
    if not settings.is_supabase_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The API is not configured to reach Supabase.",
        )

    client = db.get_anon_client()
    try:
        response = client.auth.sign_in_with_password(
            {"email": payload.email.lower(), "password": payload.password}
        )
    except Exception as exc:  # noqa: BLE001 - never leak the provider's error text
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        ) from exc

    session = _session_of(response)
    access_token = getattr(session, "access_token", None)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Re-check the role against `profiles` before handing the token over.
    # Supabase `user_metadata` is user-writable, so it cannot be trusted here.
    # A valid non-admin account gets a 403 from this call and never receives a
    # token, instead of being redirected into a dashboard that rejects it.
    principal = await resolve_principal(access_token)

    return LoginResponse(
        access_token=access_token,
        expires_in=getattr(session, "expires_in", None),
        user=UserOut(**principal).model_dump(),
    )


@router.get("/me", response_model=UserOut)
async def me(admin: dict | None = Depends(maybe_admin)) -> UserOut:
    """Return the caller's principal, or 401 when no usable token is present."""
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No active session.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return UserOut(**admin)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    # Explicit: a `-> None` annotation alone is inferred as a response model,
    # which FastAPI rejects for 204 at import time.
    response_model=None,
)
async def logout() -> None:
    """Stateless by design - the client discards its token.

    Supabase sessions are server-side revokable; a true logout that revokes
    the refresh token needs the user's credentials to call `sign_out`, which
    this endpoint deliberately does not handle.
    """
    return None
