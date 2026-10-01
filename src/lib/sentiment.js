// Rule-based Sentiment & Theme Analysis Helper
//
// NOTE: this engine is mirrored in PL/pgSQL inside supabase_schema.sql
// (analyze_feedback_sentiment / extract_feedback_themes). Any change here must
// be applied there too — the two are independently deployed.

const POSITIVE_WORDS = [
  'good', 'great', 'excellent', 'helpful', 'clear',
  'amazing', 'friendly', 'interesting', 'supportive',
  'useful', 'best', 'explains', 'explained', 'understandable',
  'awesome', 'loved', 'superb', 'prompt', 'interactive',
  'engaging', 'structured', 'organized', 'patient', 'brilliant'
];

const NEGATIVE_WORDS = [
  'bad', 'poor', 'boring', 'difficult', 'late',
  'unclear', 'rude', 'slow', 'unfair', 'worst',
  'confusing', 'insufficient', 'noisy', 'outdated',
  'problem', 'delay', 'delayed', 'postponed', 'hard',
  'stuck', 'crash', 'crashes', 'crashed', 'freezes', 'nightmare'
];

export function analyzeSentiment(comment) {
  if (!comment) return { sentiment_score: 0, sentiment_label: 'neutral' };

  const tokens = comment
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z]/g, ''))
    .filter(Boolean);

  let positiveCount = 0;
  let negativeCount = 0;

  tokens.forEach((word) => {
    if (POSITIVE_WORDS.includes(word)) positiveCount++;
    if (NEGATIVE_WORDS.includes(word)) negativeCount++;
  });

  const score = positiveCount - negativeCount;
  let label = 'neutral';
  if (score > 0) label = 'positive';
  else if (score < 0) label = 'negative';

  return {
    sentiment_score: score,
    sentiment_label: label,
    positiveCount,
    negativeCount,
  };
}

/**
 * Every alternative below is \b-anchored. Bare substrings previously caused
 * runaway false positives: `ac` matched faculty/practical/each/headache and
 * `lag` matched village/flag, so every submission was tagged as a facilities
 * issue regardless of tone.
 */
export function extractThemes(comment) {
  if (!comment) return [];

  const text = comment.toLowerCase();
  const themes = [];

  const ISSUE_RULES = [
    {
      theme: 'Delayed classes',
      test: /\b(late|delay(ed|s)?|delaying|postpon(e|ed|es|ing)|reschedul\w*|cancell?ed|cancell?ation|overtime|short notice)\b/,
    },
    {
      theme: 'Wi-Fi problems',
      // `wi-?fi` is required so the common hyphenated spelling is matched.
      test: /\b(wi-?fi|internet|network|networking|connectivity|connection|connections|router|modem|broadband|ethernet|hotspot|bandwidth)\b/,
    },
    {
      theme: 'Slow lab systems',
      test: /\b(slow|slower|computers?|systems?|pcs?|laptops?|outdated|hardware|software|crash(es|ed|ing)?|freez(e|es|ing)|froze|lag(s|ging|ged)?|frozen|bootloop\w*)\b/,
    },
    {
      // Deliberately does NOT match the neutral verbs "explain"/"understand":
      // that made "Clear explanations" register as an issue as well as praise.
      theme: 'Unclear explanations',
      test: /\b(unclear|unclear(ed|ly)?|confus(ing|ed|ion)?|difficult|difficulty|hard to (follow|understand)|vague|ambiguous|ambiguity|too fast|fast pace|rushed|incomprehensible|weak)\b/,
    },
    {
      theme: 'Noisy / Bad Facilities',
      test: /\b(noisy|noise|loud|loudly|air conditioning|a\/c|disturbance|disruption|projector|broken|cracked|uncomfortable|dirty|leaking|unusable|broken down)\b/,
    },
  ];

  const PRAISE_RULES = [
    {
      theme: 'Helpful faculty',
      test: /\b(helpful|supportive|kind|approachable|friendly|available|responsive|encourag(ing|ed)|willing to help|goes out of (the|their) way)\b/,
    },
    {
      // Negative lookbehind stops "unclear"/"un-clearly" from scoring as praise.
      theme: 'Clear teaching',
      test: /(?<![un])\b(clear(ly)?|understandable|well explained|well structured|good teaching|patient|organised|organized|articulate)\b/,
    },
    {
      theme: 'Interactive classes',
      test: /\b(interactive|interesting|engaging|enjoyed|fun|participat(e|ed|ion|ing)|hands-on|discussion|group work|debate)\b/,
    },
  ];

  ISSUE_RULES.forEach(({ theme, test }) => {
    if (test.test(text)) themes.push({ theme, theme_type: 'issue' });
  });

  PRAISE_RULES.forEach(({ theme, test }) => {
    if (test.test(text)) themes.push({ theme, theme_type: 'praise' });
  });

  return themes;
}