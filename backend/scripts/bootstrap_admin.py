#!/usr/bin/env python
"""Create an admin login and promote it, without opening the SQL editor.

Two steps, because Supabase Auth and Postgres are separate: the Auth user is
created through the Admin API, and the role is then flipped on the `profiles`
row the signup trigger made for it. New signups are deliberately `student`, so
the second step is never optional.

    python backend/scripts/bootstrap_admin.py you@college.edu
    python backend/scripts/bootstrap_admin.py you@college.edu --password 'choose-me'

Without `--password` a strong one is generated and printed once.
"""

from __future__ import annotations

import argparse
import secrets
import string
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import db  # noqa: E402
from app.config import get_settings  # noqa: E402

PASSWORD_ALPHABET = string.ascii_letters + string.digits + "!@#$%^&*-_"


def generate_password(length: int = 20) -> str:
    # Keep at least one of each character class so the result satisfies the
    # same complexity rules the dashboard's own password hint describes.
    while True:
        candidate = "".join(secrets.choice(PASSWORD_ALPHABET) for _ in range(length))
        if (
            any(c.islower() for c in candidate)
            and any(c.isupper() for c in candidate)
            and any(c.isdigit() for c in candidate)
            and any(c in "!@#$%^&*-_" for c in candidate)
        ):
            return candidate


def find_auth_user_id(client, email: str) -> str | None:
    """Look up the Auth user id.

    `profiles` has no email column - it is keyed by the Auth user id - so the
    id has to come from the Auth side rather than by querying the profile.
    Note the Admin API shape in supabase-py 2.x: there is no `get_user_by_email`,
    and `list_users()` returns a plain list rather than a paginated object.
    """
    for user in client.auth.admin.list_users() or []:
        if (getattr(user, "email", "") or "").lower() == email.lower():
            return user.id
    return None


def promote(client, user_id: str) -> bool:
    """Set role='admin' on the profile row for `user_id`."""
    result = client.from_("profiles").select("id, role").eq("id", user_id).limit(1).execute()
    if not db.rows(result):
        return False

    client.from_("profiles").update({"role": "admin"}).eq("id", user_id).execute()
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("email")
    parser.add_argument("--password", help="Omit to generate one")
    parser.add_argument(
        "--reset-password",
        action="store_true",
        help="Set the password even if the Auth user already exists",
    )
    args = parser.parse_args()

    settings = get_settings()
    if not settings.supabase_service_role_key:
        print("SUPABASE_SERVICE_ROLE_KEY is required for this script.", file=sys.stderr)
        return 1

    password = args.password or generate_password()
    created_user = False
    user_id = None

    client = db.service_client()
    try:
        response = client.auth.admin.create_user(
            {
                "email": args.email,
                "password": password,
                "email_confirm": True,
            }
        )
        created_user = True
        user = getattr(response, "user", None)
        user_id = getattr(user, "id", None)
        print(f"Created Auth user {args.email}")
    except Exception as exc:  # noqa: BLE001
        # "already registered" is not a failure here - promoting the existing
        # account is usually exactly what the operator wanted.
        if "already" not in str(exc).lower() and "registered" not in str(exc).lower():
            print(f"Could not create the Auth user: {exc}", file=sys.stderr)
            return 1
        print(f"Auth user {args.email} already exists; reusing it.")

        if args.reset_password:
            user_id = find_auth_user_id(client, args.email)
            if user_id is None:
                print(f"Could not resolve an Auth id for {args.email}.", file=sys.stderr)
                return 1
            client.auth.admin.update_user_by_id(user_id, {"password": password})
            print("Password reset.")

    if user_id is None:
        user_id = find_auth_user_id(client, args.email)

    if user_id is None:
        print(
            f"No Auth user found for {args.email}. If the list is long, pass an "
            "address that already exists or promote the account by SQL instead.",
            file=sys.stderr,
        )
        return 1

    if not promote(client, user_id):
        print(
            f"No profiles row exists for Auth user {user_id}.\n"
            "The handle_new_user trigger did not fire. Create it with:\n"
            f"  insert into public.profiles (id, full_name, role) "
            f"values ('{user_id}', 'Administrator', 'admin');",
            file=sys.stderr,
        )
        return 1

    print(f"Promoted profile {user_id} to admin.")
    if not (created_user or args.reset_password):
        return 0

    print("\nSign in at /admin-login with:")
    print(f"  email:    {args.email}")
    print(f"  password: {password}")
    print("\nChange that password after the first login.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())