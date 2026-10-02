"""EduPulse Analytics API.

A backend-for-frontend. The React app holds no database credentials and no
data-fallback logic: it either gets authoritative data from here or it shows an
error. That single rule is what fixes the class of bug where a submission
"succeeded", the dashboard showed zeros, and nothing anywhere reported why.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import __version__
from .config import get_settings
from .db import SupabaseNotConfigured
from .routers import auth, feedback, health

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
)
log = logging.getLogger("edupulse")


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    missing = settings.missing()

    if missing:
        log.warning("Starting MISCONFIGURED - missing: %s", ", ".join(missing))
    else:
        if settings.require_auth_on_reads:
            log.info("Admin reads are protected (REQUIRE_AUTH_ON_READS=true).")
        else:
            log.warning(
                "REQUIRE_AUTH_ON_READS=false - the raw feedback corpus is readable "
                "without authentication. Do not deploy in this mode."
            )
        if not settings.supabase_service_role_key:
            log.warning(
                "SUPABASE_SERVICE_ROLE_KEY unset - admin reads fall back to the anon "
                "key and depend on database RLS."
            )

    yield


app = FastAPI(
    title="EduPulse Analytics API",
    version=__version__,
    description=(
        "Institutional student-feedback analytics. Students post a submission "
        "anonymously; administrators read an aggregated corpus."
    ),
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(feedback.router)


@app.exception_handler(SupabaseNotConfigured)
async def supabase_not_configured(_request: Request, exc: SupabaseNotConfigured) -> JSONResponse:
    """A missing credential is an operator error, not a client error."""
    log.error("%s", exc)
    return JSONResponse(
        status_code=503,
        content={
            "detail": "The API is not configured to reach the feedback database.",
            "hint": "See backend/.env.example and set SUPABASE_URL and SUPABASE_ANON_KEY.",
        },
    )
