"""Unit tests for the analysis layer.

These run with no database and no network - the analyser is deliberately pure,
so this file is the fast regression net for every sentiment or theme change.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.analysis import analyze_sentiment, extract_themes  # noqa: E402


class TestSentiment:
    def test_praise_is_positive(self):
        result = analyze_sentiment("Great lectures, very helpful and clear.")
        assert result["sentiment_label"] == "positive"
        assert result["sentiment_score"] > 0

    def test_complaint_is_negative(self):
        result = analyze_sentiment("The lab systems are slow and outdated.")
        assert result["sentiment_label"] == "negative"
        assert result["sentiment_score"] < 0

    def test_praise_and_complaint_cancels_to_neutral(self):
        # One positive hit against one negative hit. The old fixture stacked two
        # positives ("helpful and clear") against a single complaint, which
        # scores +1 and is correctly positive - it never tested cancellation.
        result = analyze_sentiment("Helpful faculty, but the room is noisy.")
        assert result["positive_hits"] == 1
        assert result["negative_hits"] == 1
        assert result["sentiment_score"] == 0
        assert result["sentiment_label"] == "neutral"

    def test_comment_without_lexicon_hits_is_neutral_not_positive(self):
        # A regression guard: an all-zero score must never default to positive.
        assert analyze_sentiment("The syllabus mentions twelve weekly topics.")["sentiment_label"] == "neutral"

    @pytest.mark.parametrize("comment", [None, "", "   "])
    def test_empty_input_is_neutral(self, comment):
        assert analyze_sentiment(comment) == {
            "sentiment_score": 0,
            "sentiment_label": "neutral",
            "positive_hits": 0,
            "negative_hits": 0,
        }

    def test_multi_word_phrase_is_matched(self):
        # The old JS tokeniser stripped each whitespace token independently, so
        # "well explained" could never match. Phrases are matched as bigrams now.
        assert analyze_sentiment("The material was well explained throughout.")["positive_hits"] >= 1

    def test_punctuation_does_not_break_matching(self):
        assert analyze_sentiment("Excellent!!! Great, clear... helpful??")["positive_hits"] == 4

    def test_score_is_the_difference_of_hits(self):
        result = analyze_sentiment("good good bad")
        assert result["positive_hits"] == 2
        assert result["negative_hits"] == 1
        assert result["sentiment_score"] == 1

    def test_is_case_insensitive(self):
        assert analyze_sentiment("EXCELLENT")["sentiment_label"] == analyze_sentiment("excellent")["sentiment_label"]


class TestThemes:
    def test_issue_themes_detected(self):
        themes = {t.theme for t in extract_themes("Severe wifi problems and slow computers.")}
        assert "Wi-Fi problems" in themes
        assert "Slow lab systems" in themes

    def test_praise_themes_detected(self):
        themes = {t.theme for t in extract_themes("Supportive and friendly during office hours.")}
        assert "Helpful faculty" in themes
        assert "Faculty availability" in themes

    def test_theme_type_is_classified(self):
        for theme in extract_themes("Late classes and a friendly professor."):
            assert theme.theme_type in {"praise", "issue"}

    def test_no_themes_for_unrelated_text(self):
        assert extract_themes("The syllabus mentions twelve weekly topics.") == []

    @pytest.mark.parametrize("comment", [None, ""])
    def test_empty_input_has_no_themes(self, comment):
        assert extract_themes(comment) == []

    def test_results_are_deduplicated(self):
        # "wifi" appears three times but must yield one theme row.
        themes = extract_themes("wifi wifi wifi")
        assert len(themes) == len({t.theme for t in themes})

    def test_extraction_is_idempotent(self):
        comment = "Slow lab systems, unclear explanations and a friendly professor."
        assert extract_themes(comment) == extract_themes(comment)
