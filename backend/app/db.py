"""Supabase access.

Two client shapes are exposed on purpose:

`service_client`  - server key, bypasses RLS. Used only where the request is
                    already authorised by this API's own admin check.
`anon_client`     - anon key, subject to RLS. Used for the public write path
                    and, with a user JWT attached, for admin reads.

The browser never receives any of these keys. `get_anon_client(token=...)`
forwards the caller's own access token so PostgREST evaluates RLS as
`authenticated` instead of `anon` - which is what makes the tightened
"admins can read" policy meaningful.
"""

from __future__ import annotations

import logging
from typing import Any

from supabase import Client, create_client
from supabase.lib.client_options import SyncClientOptions

from .config import Settings, get_settings

log = logging.getLogger(__name__)


class SupabaseNotConfigured(RuntimeError):
    """Raised when the process is missing credentials it cannot invent."""


def _require(settings: Settings) -> None:
    missing = settings.missing()
    if missing:
        raise SupabaseNotConfigured(
            f"Missing required environment variables: {', '.join(missing)}. "
            "Copy backend/.env.example to backend/.env and fill them in."
        )


def service_client(settings: Settings | None = None) -> Client:
    settings = settings or get_settings()
    _require(settings)
    if not settings.supabase_service_role_key:
        raise SupabaseNotConfigured("SUPABASE_SERVICE_ROLE_KEY is not set.")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_anon_client(token: str | None = None) -> Client:
    """Anon-key client, optionally impersonating an authenticated user."""
    settings = get_settings()
    _require(settings)

    if not token:
        return create_client(settings.supabase_url, settings.supabase_anon_key)

    # `options` must be a SyncClientOptions instance in supabase-py 2.x. Passing
    # the documented-looking dict ({"global": {"headers": ...}}) raises
    # "AttributeError: 'dict' object has no attribute 'headers'" the moment the
    # client is built, which surfaces as a bogus 401 on every protected read.
    options = SyncClientOptions(headers={"Authorization": f"Bearer {token}"})
    return create_client(settings.supabase_url, settings.supabase_anon_key, options)


_admin_client: Client | None = None


def admin_client() -> Client:
    """Privileged client for reads that this API has already authorised.

    Prefers the service-role key, which bypasses RLS - correct here because
    authorisation already happened in `security.require_admin`. Falls back to
    the anon key so local development works before RLS has been tightened;
    that fallback is logged, because it means Postgres is the only gate.
    """
    global _admin_client

    settings = get_settings()
    _require(settings)

    if settings.supabase_service_role_key:
        if _admin_client is None:
            _admin_client = create_client(settings.supabase_url, settings.supabase_service_role_key)
        return _admin_client

    log.warning(
        "SUPABASE_SERVICE_ROLE_KEY is unset; admin reads fall back to the anon key "
        "and rely on database RLS. Set the service key before deploying."
    )
    return get_anon_client()


def rows(response: Any) -> list[dict[str, Any]]:
    """PostgREST returns a `RESTResponse`; normalise `.data` to a plain list."""
    data = getattr(response, "data", None)
    return list(data) if data else []
