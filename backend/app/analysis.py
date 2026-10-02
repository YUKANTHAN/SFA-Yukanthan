"""Sentiment scoring and theme extraction.

This module is the single authority for text analysis in the system. The
database triggers that previously duplicated this logic were dropped so a
record can never carry two different verdicts; see
`supabase_migration_02_analysis_ownership.sql`.

Rules of the house:
  * Pure functions, no I/O, no globals mutated at runtime.
  * Every lexicon lives in exactly one place and is exported for tests.
  * Score is `positive_hits - negative_hits`; label is derived from the sign.
    A comment with no lexicon hits is neutral, never positive by default.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

WORD_RE = re.compile(r"[a-z']+")

POSITIVE_LEXICON: frozenset[str] = frozenset(
    {
        "good",
        "great",
        "excellent",
        "helpful",
        "clear",
        "amazing",
        "friendly",
        "interesting",
        "supportive",
        "useful",
        "best",
        "understandable",
        "awesome",
        "loved",
        "superb",
        "prompt",
        "interactive",
        "engaging",
        "enjoyed",
    }
)

NEGATIVE_LEXICON: frozenset[str] = frozenset(
    {
        "bad",
        "poor",
        "boring",
        "difficult",
        "late",
        "unclear",
        "rude",
        "slow",
        "unfair",
        "worst",
        "confusing",
        "insufficient",
        "noisy",
        "outdated",
        "problem",
        "delay",
        "postponed",
        "hard",
        "stuck",
    }
)

# Multi-word cues. The previous JavaScript analyser stripped punctuation from
# each whitespace token, so "well explained" could never match; phrases are
# matched here as a consecutive bigram instead.
POSITIVE_PHRASES: frozenset[tuple[str, ...]] = frozenset(
    {
        ("well", "explained"),
        ("well", "structured"),
        ("good", "teaching"),
        ("very", "helpful"),
    }
)

NEGATIVE_PHRASES: frozenset[tuple[str, ...]] = frozenset(
    {
        ("not", "clear"),
        ("not", "helpful"),
        ("waste", "of", "time"),
        ("hard", "to", "follow"),
        ("no", "lab"),
    }
)


@dataclass(frozen=True)
class Theme:
    theme: str
    theme_type: str  # "praise" | "issue"


THEME_RULES: tuple[tuple[re.Pattern[str], Theme], ...] = (
    (re.compile(r"\b(late|delay|delayed|postponed|overtime)\b"), Theme("Delayed classes", "issue")),
    (re.compile(r"\b(wi-?fi|internet|network|connection|router|bandwidth)\b"), Theme("Wi-Fi problems", "issue")),
    (re.compile(r"\b(slow|computer|computers|system|systems|pc|pcs|outdated|hardware|lag|ram)\b"), Theme("Slow lab systems", "issue")),
    (re.compile(r"\b(unclear|confusing|fast|difficult|understand|explains?)\b"), Theme("Unclear explanations", "issue")),
    (re.compile(r"\b(noisy|noise|loud|disturbance|ac|air conditioning|projector)\b"), Theme("Noisy / Bad Facilities", "issue")),
    (re.compile(r"\b(exams?|tests?|quiz|quizzes|grading|marks?)\b"), Theme("Assessment clarity", "issue")),
    (re.compile(r"\b(helpful|supportive|kind|approachable|friendly)\b"), Theme("Helpful faculty", "praise")),
    (re.compile(r"\b(clear|understandable|well explained|good teaching|explains? well)\b"), Theme("Clear teaching", "praise")),
    (re.compile(r"\b(interactive|interesting|engaging|amazing|enjoyed)\b"), Theme("Interactive classes", "praise")),
    (re.compile(r"\b(office hours|availability|responsive|replies)\b"), Theme("Faculty availability", "praise")),
)


def _tokens(text: str) -> list[str]:
    return WORD_RE.findall(text.lower())


def analyze_sentiment(comment: str | None) -> dict[str, object]:
    """Score a comment on a -N..+N lexicon scale and label the sign.

    A lexicon hit is counted at most once per occurrence, and a word that
    appears in both lexicons (none currently, but the code must not assume
    that) counts toward each independently rather than cancelling out.
    """
    if not comment:
        return {
            "sentiment_score": 0,
            "sentiment_label": "neutral",
            "positive_hits": 0,
            "negative_hits": 0,
        }

    words = _tokens(comment)
    bigrams = [tuple(words[i : i + 2]) for i in range(len(words) - 1)]
    trigrams = [tuple(words[i : i + 3]) for i in range(len(words) - 2)]

    positive_hits = sum(1 for word in words if word in POSITIVE_LEXICON)
    positive_hits += sum(1 for phrase in bigrams if phrase in POSITIVE_PHRASES)
    positive_hits += sum(1 for phrase in trigrams if phrase in POSITIVE_PHRASES)

    negative_hits = sum(1 for word in words if word in NEGATIVE_LEXICON)
    negative_hits += sum(1 for phrase in bigrams if phrase in NEGATIVE_PHRASES)
    negative_hits += sum(1 for phrase in trigrams if phrase in NEGATIVE_PHRASES)

    score = positive_hits - negative_hits
    label = "positive" if score > 0 else "negative" if score < 0 else "neutral"

    return {
        "sentiment_score": score,
        "sentiment_label": label,
        "positive_hits": positive_hits,
        "negative_hits": negative_hits,
    }


def extract_themes(comment: str | None) -> list[Theme]:
    """Ordered, de-duplicated theme hits for a comment."""
    if not comment:
        return []

    seen: set[tuple[str, str]] = set()
    hits: list[Theme] = []
    for pattern, theme in THEME_RULES:
        key = (theme.theme, theme.theme_type)
        if key in seen:
            continue
        if pattern.search(comment.lower()):
            seen.add(key)
            hits.append(theme)
    return hits
