#!/usr/bin/env python
"""Seed the demo corpus by posting through the API.

Posting via HTTP rather than INSERT is deliberate: the analyser lives in the
API, so a direct SQL insert would leave every row labelled 'neutral' and the
sentiment chart would disagree with real submissions.

    python backend/scripts/seed_demo.py
    python backend/scripts/seed_demo.py --api http://127.0.0.1:8000 --count 2
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request

DEFAULT_API = "http://127.0.0.1:8000/api"

# Mirrors src/lib/design.js so seeded rows share the taxonomy with the form.
COURSES = [
    {
        "course_code": "CS-301",
        "course_name": "CS-301: Advanced Data Structures & Algorithms",
        "department": "Computer Science & Engineering",
        "faculty_name": "Dr. Alan Turing",
    },
    {
        "course_code": "ENG-204",
        "course_name": "ENG-204: Technical Writing & Research Ethics",
        "department": "Humanities & Social Sciences",
        "faculty_name": "Prof. Elena Rostova",
    },
    {
        "course_code": "PHYS-102",
        "course_name": "PHYS-102: Electromagnetism & Statistical Mechanics",
        "department": "Mathematics & Physics",
        "faculty_name": "Dr. Richard Feynman",
    },
    {
        "course_code": "ME-410",
        "course_name": "ME-410: Finite Element Analysis & Dynamics",
        "department": "Mechanical Engineering",
        "faculty_name": "Prof. Nikola Tesla",
    },
]

SAMPLES = [
    (
        5,
        "Teaching Quality",
        "The faculty explains tricky algorithm concepts clearly and is extremely helpful with labs!",
    ),
    (
        2,
        "Lab Facilities",
        "The lab computers are very slow and outdated, causing frequent crashes during SQL practice.",
    ),
    (
        5,
        "Course Content",
        "Interactive classes and great practical coding sessions. Loved the project assignments.",
    ),
    (
        1,
        "Teaching Quality",
        "Unclear explanations and very fast pace. Hard to follow mathematical proofs.",
    ),
    (
        2,
        "Classroom Facilities",
        "Severe Wi-Fi problems in the block and noisy classroom air conditioning.",
    ),
    (
        4,
        "Faculty Interaction",
        "Very supportive and approachable faculty during office hours.",
    ),
    (
        3,
        "Assessment & Exams",
        "Exams were difficult and the results were delayed for weeks.",
    ),
    (
        5,
        "Teaching Quality",
        "Best professor ever! Clear explanations and supportive throughout project submissions.",
    ),
    (
        2,
        "Lab Facilities",
        "Computer systems lag constantly. Need upgraded RAM in Lab 3.",
    ),
]


def post(api: str, payload: dict) -> dict:
    request = urllib.request.Request(
        f"{api.rstrip('/')}/feedback",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api", default=DEFAULT_API, help=f"API base URL (default {DEFAULT_API})")
    parser.add_argument("--count", type=int, default=len(SAMPLES), help="How many samples to post")
    args = parser.parse_args()

    created = 0
    for index, (rating, category, comment) in enumerate(SAMPLES[: args.count]):
        course = COURSES[index % len(COURSES)]
        payload = {
            **course,
            "category": category,
            "rating": rating,
            "comment": comment,
            "is_anonymous": index % 2 == 0,
        }

        try:
            saved = post(args.api, payload)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:200]
            print(f"FAILED {course['course_code']}: {exc.code} {detail}", file=sys.stderr)
            return 1
        except urllib.error.URLError as exc:
            print(f"Cannot reach {args.api}: {exc.reason}", file=sys.stderr)
            print("Start the backend first: cd backend && uvicorn app.main:app --reload", file=sys.stderr)
            return 1

        created += 1
        print(f"  ok  {saved['id'][:8]}  {saved['sentiment_label']:>8}  {course['course_code']}")

    print(f"\nSeeded {created} submissions.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
