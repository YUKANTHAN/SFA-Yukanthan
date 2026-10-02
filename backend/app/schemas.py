"""Request and response models.

Column names mirror `supabase_schema.sql` so rows can be handed to PostgREST
without a translation layer; anything the UI needs that is not a column
(`sentiment_hits`, `theme_count`) is added here instead.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator

COMMENT_MAX_LENGTH = 1000
MIN_COMMENT_LENGTH = 10


class FeedbackCreate(BaseModel):
    """Inbound submission from the public form."""

    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    course_name: str = Field(min_length=2, max_length=200)
    course_code: str | None = Field(default=None, max_length=32)
    department: str | None = Field(default=None, max_length=120)
    faculty_name: str = Field(min_length=2, max_length=120)
    category: str = Field(min_length=2, max_length=80)
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=MIN_COMMENT_LENGTH, max_length=COMMENT_MAX_LENGTH)
    is_anonymous: bool = True
    # Accepted so a client that still sends a name is not rejected, then
    # discarded by the handler. Anonymity is enforced by the write path, not
    # by the absence of a field.
    student_name: str | None = Field(default=None, max_length=200, description="Ignored. Never persisted.")

    @field_validator("comment")
    @classmethod
    def comment_must_be_substantive(cls, value: str) -> str:
        if len(value.split()) < 3:
            raise ValueError("Comment must be at least a short sentence.")
        return value


class FeedbackOut(BaseModel):
    """A stored submission, enriched with derived analysis."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    student_name: str | None = None
    course_code: str | None = None
    course_name: str
    department: str | None = None
    faculty_name: str | None = None
    category: str
    rating: int
    comment: str
    is_anonymous: bool = True
    sentiment_label: str
    sentiment_score: int = 0
    created_at: str
    themes: list[dict] = Field(default_factory=list)


class ThemeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str | None = None
    feedback_id: str | None = None
    theme: str
    theme_type: str


class FeedbackListOut(BaseModel):
    """Envelope for collection reads.

    Declared as a model on purpose. The bug this replaces was a reader
    returning a bare array while the page destructured `.items`, which
    produced `undefined` and an all-zero dashboard with no error anywhere.
    A declared envelope makes that mismatch a loud 500 at the boundary.
    """

    items: list[FeedbackOut]
    total: int
    degraded: bool = False
    notice: str | None = None


class ThemeListOut(BaseModel):
    items: list[ThemeOut]
    total: int
    degraded: bool = False
    notice: str | None = None


class LoginRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=1, max_length=200)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int | None = None
    user: dict


class UserOut(BaseModel):
    id: str
    email: str | None = None
    role: str = "student"
    full_name: str | None = None


class HealthOut(BaseModel):
    status: str
    database: str
    version: str
    detail: str | None = None
