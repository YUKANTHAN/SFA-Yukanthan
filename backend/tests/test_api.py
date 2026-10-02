"""Route-level tests against a fake PostgREST client.

No database and no network: `app.db` is monkeypatched, so these assert the
contract the React app depends on - envelope shape, status codes, and above all
that a failed insert surfaces as an error instead of a silent success.
"""

from __future__ import annotations

import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

pytest.importorskip("fastapi")
pytest.importorskip("supabase")

from fastapi.testclient import TestClient  # noqa: E402

from app import config, db, security  # noqa: E402
from app.main import app  # noqa: E402
from app.routers import auth as auth_router  # noqa: E402
from app.routers import health as health_router  # noqa: E402


class FakeQuery:
    """Records the PostgREST call chain and returns canned rows."""

    def __init__(self, table: str, store: dict) -> None:
        self.table = table
        self.store = store
        self.calls: list[str] = []
        self._filters: list[tuple[str, object]] = []
        self._data: list[dict] | None = None
        self.fail_with: Exception | None = store.get("__fail__")

    def select(self, *_a, **_k):
        self.calls.append("select")
        return self

    def insert(self, rows):
        self.calls.append("insert")
        self._data = rows
        return self

    def update(self, rows):
        self.calls.append("update")
        self._data = rows
        return self

    def delete(self):
        self.calls.append("delete")
        return self

    def order(self, *_a, **_k):
        self.calls.append("order")
        return self

    def range(self, _start, _end):
        self.calls.append("range")
        return self

    def limit(self, _n):
        self.calls.append("limit")
        return self

    def eq(self, column, value):
        self.calls.append(f"eq:{column}")
        self._filters.append((column, value))
        return self

    def in_(self, column, values):
        self.calls.append(f"in:{column}")
        self._filters.append((column, values))
        return self

    def execute(self):
        self.calls.append("execute")
        if self.fail_with:
            raise self.fail_with

        if self.table == "feedback_themes":
            if "insert" in self.calls:
                created = [
                    {**row, "id": f"t-{len(self.store['feedback_themes'])}"}
                    for row in self._data
                ]
                self.store["feedback_themes"].extend(created)
                return SimpleNamespace(data=created)
            return SimpleNamespace(data=list(self.store["feedback_themes"]))

        if self.table == "profiles":
            selected = list(self.store.get("profiles", []))
            for column, value in self._filters:
                selected = [row for row in selected if row.get(column) == value]
            return SimpleNamespace(data=selected)

        if "insert" in self.calls:
            created = [
                {**row, "id": "fb-new", "created_at": "2026-01-01T00:00:00+00:00"}
                for row in self._data
            ]
            self.store["feedback"].extend(created)
            return SimpleNamespace(data=created)

        selected = list(self.store["feedback"])
        for column, value in self._filters:
            selected = [row for row in selected if row.get(column) == value]

        if "delete" in self.calls:
            return SimpleNamespace(data=selected)

        if "order" in self.calls:
            selected.sort(key=lambda row: row.get("created_at") or "", reverse=True)

        return SimpleNamespace(data=selected)


class FakeAuth:
    """Stands in for `client.auth` so the login route can be exercised.

    Deliberately mirrors the real `gotrue` shape: `sign_in_with_password`
    returns an `AuthResponse` carrying `user` and `session`, with the token on
    `session` and NOT at the top level. An earlier version of this double put
    `access_token` on the response root, which let a broken login route pass all
    41 tests - it only failed against a real project.
    """

    def __init__(self, user) -> None:
        self._user = user

    def sign_in_with_password(self, _credentials):
        return SimpleNamespace(
            user=self._user,
            session=SimpleNamespace(
                access_token="jwt-token",
                refresh_token="refresh-token",
                expires_in=3600,
                token_type="bearer",
            ),
        )

    def get_user(self, _token):
        return SimpleNamespace(user=self._user)


class FakeClient:
    def __init__(self, store: dict, user=None) -> None:
        self.store = store
        self.auth = FakeAuth(user) if user is not None else None

    def from_(self, table: str) -> FakeQuery:
        return FakeQuery(table, self.store)


@pytest.fixture(autouse=True)
def configured_app(monkeypatch):
    """Every route under test assumes a correctly configured API.

    Without this, `/api/health` answers `misconfigured` on a machine with no
    `backend/.env`, which is true but not what these tests are measuring.
    """
    settings = config.Settings(
        supabase_url="https://example.supabase.co",
        supabase_anon_key="anon-test-key",
    )
    for module in (auth_router, health_router):
        monkeypatch.setattr(module, "get_settings", lambda s=settings: s)


@pytest.fixture
def store():
    return {
        "feedback": [
            {
                "id": "fb-1",
                "student_name": None,
                "course_code": "CS-301",
                "course_name": "CS-301: Advanced Data Structures & Algorithms",
                "department": "Computer Science & Engineering",
                "faculty_name": "Dr. Alan Turing",
                "category": "Teaching Quality",
                "rating": 5,
                "comment": "Great lectures, very clear and helpful.",
                "is_anonymous": True,
                "sentiment_label": "positive",
                "sentiment_score": 3,
                "created_at": "2026-01-02T00:00:00+00:00",
            }
        ],
        "feedback_themes": [
            {"id": "t-1", "feedback_id": "fb-1", "theme": "Clear teaching", "theme_type": "praise"}
        ],
    }


@pytest.fixture
def client(store, monkeypatch):
    monkeypatch.setattr(db, "get_anon_client", lambda token=None: FakeClient(store))
    monkeypatch.setattr(db, "admin_client", lambda: FakeClient(store))

    async def fake_authenticate(_credentials):
        return {"id": "u-1", "email": "admin@college.edu", "role": "admin", "full_name": "Admin"}

    monkeypatch.setattr(security, "_authenticate", fake_authenticate)
    return TestClient(app)


@pytest.fixture
def anon_client(store, monkeypatch):
    """Client with auth disabled, for exercising the 401 path."""
    monkeypatch.setattr(db, "get_anon_client", lambda token=None: FakeClient(store))
    monkeypatch.setattr(db, "admin_client", lambda: FakeClient(store))

    async def no_credentials(_credentials):
        return None

    monkeypatch.setattr(security, "_authenticate", no_credentials)
    return TestClient(app)


@pytest.fixture
def login_client(store, monkeypatch):
    """Build a client where Supabase Auth succeeds, for a given `profiles` role.

    The fake user always carries `user_metadata.role = 'admin'`, because
    Supabase metadata is user-writable. The role in `profiles` is the only
    thing that should decide the outcome.
    """

    def build(role: str) -> TestClient:
        store["profiles"] = [{"id": "u-9", "role": role, "full_name": "Sam Rivera"}]
        user = SimpleNamespace(
            id="u-9",
            email="sam@college.edu",
            user_metadata={"role": "admin", "full_name": "Forged Name"},
        )
        monkeypatch.setattr(db, "get_anon_client", lambda token=None: FakeClient(store, user=user))
        monkeypatch.setattr(db, "admin_client", lambda: FakeClient(store))
        return TestClient(app)

    return build


VALID_PAYLOAD = {
    "course_name": "CS-301: Advanced Data Structures & Algorithms",
    "course_code": "CS-301",
    "department": "Computer Science & Engineering",
    "faculty_name": "Dr. Alan Turing",
    "category": "Teaching Quality",
    "rating": 5,
    "comment": "Excellent lectures, very helpful and clear explanations.",
    "is_anonymous": True,
}


class TestSubmission:
    def test_creates_record_and_returns_receipt(self, client):
        response = client.post("/api/feedback", json=VALID_PAYLOAD)
        assert response.status_code == 201

        body = response.json()
        assert body["id"]
        assert body["sentiment_label"] == "positive"
        assert body["rating"] == 5

    def test_anonymity_is_structural_not_requested(self, client):
        body = client.post("/api/feedback", json={**VALID_PAYLOAD, "student_name": "Alex Rivers"}).json()
        assert body["student_name"] is None

    def test_a_submitted_record_is_readable_by_the_dashboard(self, client):
        """The regression this rewrite exists for.

        Previously the writer and the reader disagreed about the response
        shape, so a real submission produced an all-zero dashboard.
        """
        created = client.post("/api/feedback", json=VALID_PAYLOAD)
        assert created.status_code == 201

        listed = client.get("/api/feedback")
        assert listed.status_code == 200

        body = listed.json()
        assert set(body) >= {"items", "total", "degraded", "notice"}
        assert body["total"] == 2

        ids = [row["id"] for row in body["items"]]
        assert created.json()["id"] in ids
        assert all(row["rating"] is not None for row in body["items"])

    def test_theme_rows_are_written(self, client, store):
        client.post("/api/feedback", json=VALID_PAYLOAD)
        assert any(t["feedback_id"] == "fb-new" for t in store["feedback_themes"])
    @pytest.mark.parametrize(
        "override",
        [
            {"rating": 0},
            {"rating": 6},
            {"comment": "too short"},
            {"faculty_name": ""},
            {"course_name": ""},
        ],
    )
    def test_invalid_payloads_are_rejected(self, client, override):
        response = client.post("/api/feedback", json={**VALID_PAYLOAD, **override})
        assert response.status_code == 422

    def test_a_failing_insert_surfaces_as_an_error(self, client, store):
        """The old code logged a warning and still showed 'thank you'."""
        store["__fail__"] = RuntimeError("connection reset")
        response = client.post("/api/feedback", json=VALID_PAYLOAD)
        assert response.status_code == 502
        assert "Nothing was saved" in response.json()["detail"]


class TestReads:
    def test_list_returns_a_declared_envelope(self, client):
        body = client.get("/api/feedback").json()
        assert isinstance(body["items"], list)
        assert body["total"] == len(body["items"])
        assert body["degraded"] is False

    def test_list_attaches_themes_per_row(self, client):
        row = client.get("/api/feedback").json()["items"][0]
        assert row["themes"] == [{"theme": "Clear teaching", "theme_type": "praise"}]

    def test_themes_endpoint_returns_the_envelope_too(self, client):
        body = client.get("/api/feedback/themes").json()
        assert set(body) >= {"items", "total", "degraded", "notice"}
        assert body["total"] == 1

    def test_unauthenticated_read_is_rejected(self, anon_client):
        assert anon_client.get("/api/feedback").status_code == 401

    def test_missing_record_is_404(self, client):
        assert client.get("/api/feedback/does-not-exist").status_code == 404


class MissingCourseCodeQuery(FakeQuery):
    """Rejects the insert the way PostgREST does before migration 02 exists."""

    def __init__(self, table: str, store: dict) -> None:
        super().__init__(table, store)
        self.store.setdefault("__rejected__", [])

    def execute(self):
        if "insert" in self.calls and self._data and "course_code" in self._data[0]:
            self.store["__rejected__"].append(dict(self._data[0]))
            raise RuntimeError(
                "{'code': 'PGRST204', 'message': \"Could not find the 'course_code' "
                "column of 'feedback' in the schema cache\"}"
            )
        return super().execute()


class MissingCourseCodeClient(FakeClient):
    def from_(self, table: str):
        return MissingCourseCodeQuery(table, self.store)


class TestUnmigratedProject:
    """Behaviour against a project that has not run migration 02."""

    @pytest.fixture
    def legacy_client(self, store, monkeypatch):
        monkeypatch.setattr(db, "get_anon_client", lambda token=None: MissingCourseCodeClient(store))
        monkeypatch.setattr(db, "admin_client", lambda: MissingCourseCodeClient(store))

        async def fake_authenticate(_credentials):
            return {"id": "u-1", "email": "admin@college.edu", "role": "admin", "full_name": None}

        monkeypatch.setattr(security, "_authenticate", fake_authenticate)
        return TestClient(app)

    def test_submission_succeeds_without_the_course_code_column(self, legacy_client):
        response = legacy_client.post("/api/feedback", json=VALID_PAYLOAD)
        assert response.status_code == 201
        assert response.json()["id"]

    def test_the_rejected_attempt_is_dropped_not_stored_twice(self, legacy_client, store):
        legacy_client.post("/api/feedback", json=VALID_PAYLOAD)
        assert len(store["__rejected__"]) == 1
        # Exactly one row landed, and it has no course_code.
        assert len(store["feedback"]) == 2
        assert "course_code" not in store["feedback"][-1]

    def test_other_insert_failures_are_not_swallowed(self, legacy_client, store):
        store["__fail__"] = RuntimeError("connection reset")
        response = legacy_client.post("/api/feedback", json=VALID_PAYLOAD)
        assert response.status_code == 502


class TestHealth:
    def test_health_reports_ok_when_the_database_answers(self, client):
        body = client.get("/api/health").json()
        assert body["status"] == "ok"
        assert body["database"] == "connected"

    def test_health_reports_degraded_instead_of_raising(self, client, store):
        store["__fail__"] = RuntimeError("supabase unreachable")
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "degraded"


class TestAdminLogin:
    def test_login_rejects_a_valid_non_admin_account(self, login_client):
        """A correct password is not enough; the role must also be admin."""
        response = login_client("student").post(
            "/api/auth/login",
            json={"email": "sam@college.edu", "password": "correct-horse"},
        )
        assert response.status_code == 403
        assert "access_token" not in response.json()

    def test_login_ignores_a_forged_role_in_user_metadata(self, login_client):
        # The fake user claims `user_metadata.role == 'admin'` for every case;
        # `profiles` is the authority, so a student must still be refused.
        assert login_client("student").post(
            "/api/auth/login",
            json={"email": "sam@college.edu", "password": "correct-horse"},
        ).status_code == 403

    def test_login_returns_the_authoritative_role(self, login_client):
        response = login_client("admin").post(
            "/api/auth/login",
            json={"email": "sam@college.edu", "password": "correct-horse"},
        )
        assert response.status_code == 200

        body = response.json()
        assert body["access_token"] == "jwt-token"
        assert body["expires_in"] == 3600
        assert body["user"]["role"] == "admin"
        # The profile name, not the user-writable metadata name.
        assert body["user"]["full_name"] == "Sam Rivera"


class TestValidation:
    def test_login_requires_a_password(self, client):
        assert client.post("/api/auth/login", json={"email": "a@b.edu"}).status_code == 422

    def test_me_without_a_session_is_401(self, anon_client):
        assert anon_client.get("/api/auth/me").status_code == 401
