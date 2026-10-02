"""Authentication guards and abuse controls.

Admin identity is delegated to Supabase Auth. This API adds one thing on top:
the `profiles.role = 'admin'` check, so an ordinary authenticated student
account cannot read the corpus even if it somehow obtains a valid token.
"""

from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Any

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from . import db
from .config import Settings, get_settings

bearer_scheme = HTTPBearer(auto_error=False)

ADMIN_ROLE = "admin"


def _unauthorised() -> HTTPException:
    # RFC 6750 wants a WWW-Authenticate challenge on a 401.
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Administrator credentials required.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def resolve_principal(token: str) -> dict[str, Any]:
    """Resolve a raw bearer token into an admin principal.

    Raises 401 when the token is unusable and 403 when the account is not an
    administrator. This is the single place the role decision is made, shared by
    the read guards and by `POST /api/auth/login` - so a student account is
    turned away at sign-in instead of being handed a token that fails on the
    first dashboard request.
    """
    try:
        client = db.get_anon_client(token=token)
        user_response = client.auth.get_user(token)
    except Exception as exc:  # noqa: BLE001 - an auth failure is a 401, never a 500
        raise _unauthorised() from exc

    user = getattr(user_response, "user", None)
    if user is None:
        raise _unauthorised()

    role, full_name = await _resolve_profile(client, user.id)

    if role != ADMIN_ROLE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not registered as an administrator.",
        )

    return {"id": user.id, "email": user.email, "role": role, "full_name": full_name}


async def _authenticate(credentials: HTTPAuthorizationCredentials | None) -> dict[str, Any] | None:
    """Resolve a bearer token into an admin principal.

    Returns None when no token was presented at all. A token that *is*
    presented but unusable raises - so a caller can never downgrade to
    anonymous access by sending a deliberately malformed header.
    """
    if credentials is None:
        return None

    return await resolve_principal(credentials.credentials)


async def maybe_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any] | None:
    """Principal when a usable admin token is present, otherwise None."""
    return await _authenticate(credentials)


async def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any] | None:
    """Principal for protected reads.

    Honours REQUIRE_AUTH_ON_READS: when false, an anonymous read is allowed
    (local UI work only - it exposes the raw corpus). When true, the absence
    of a token is a 401.
    """
    admin = await _authenticate(credentials)
    if admin is None and settings.require_auth_on_reads:
        raise _unauthorised()
    return admin


async def _resolve_profile(client: Any, user_id: str) -> tuple[str, str | None]:
    """Look up the role in `profiles`; default to least privilege on error."""
    try:
        result = client.from_("profiles").select("role, full_name").eq("id", user_id).limit(1).execute()
        records = db.rows(result)
    except Exception:  # noqa: BLE001
        return "student", None

    if not records:
        return "student", None

    profile = records[0]
    return profile.get("role") or "student", profile.get("full_name")


class RateLimiter:
    """Sliding-window limiter, per process.

    Adequate for a single-instance campus deployment. Behind multiple workers
    or instances this needs a shared store; see docs/ARCHITECTURE.md.
    """

    def __init__(self, limit: int, window_seconds: int = 3600) -> None:
        self.limit = max(1, limit)
        self.window = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str) -> tuple[bool, int]:
        now = time.monotonic()
        bucket = self._hits[key]

        while bucket and now - bucket[0] > self.window:
            bucket.popleft()

        if len(bucket) >= self.limit:
            return False, 0

        bucket.append(now)
        return True, self.limit - len(bucket)

    def reset(self) -> None:
        self._hits.clear()


_submission_limiter = RateLimiter(limit=30)


def throttle(request: Request) -> None:
    settings = get_settings()
    limiter = _submission_limiter
    if settings.submissions_per_hour != limiter.limit:
        limiter.limit = max(1, settings.submissions_per_hour)

    key = request.client.host if request.client else "unknown"
    allowed, remaining = limiter.check(key)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many submissions from this network. Please try again later.",
            headers={"Retry-After": str(limiter.window), "X-RateLimit-Remaining": str(remaining)},
        )
