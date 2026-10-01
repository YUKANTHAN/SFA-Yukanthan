// Rule-based Sentiment & Theme Analysis Helper

const POSITIVE_WORDS = [
  'good', 'great', 'excellent', 'helpful', 'clear',
  'amazing', 'friendly', 'interesting', 'supportive',
  'useful', 'best', 'well explained', 'understandable',
  'awesome', 'loved', 'superb', 'prompt', 'interactive'
];

const NEGATIVE_WORDS = [
  'bad', 'poor', 'boring', 'difficult', 'late',
  'unclear', 'rude', 'slow', 'unfair', 'worst',
  'confusing', 'insufficient', 'noisy', 'outdated',
  'problem', 'delay', 'postponed', 'hard', 'stuck'
];

export function analyzeSentiment(comment) {
  if (!comment) return { sentiment_score: 0, sentiment_label: 'neutral' };

  const cleanText = comment.toLowerCase();
  const tokens = cleanText.split(/\s+/).map(word => word.replace(/[^a-z]/g, '')).filter(Boolean);

  let positiveCount = 0;
  let negativeCount = 0;

  tokens.forEach(word => {
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
    negativeCount
  };
}

export function extractThemes(comment) {
  if (!comment) return [];

  const text = comment.toLowerCase();
  const themes = [];

  // Issue Theme Mappings
  if (/(late|delay|postponed|overtime)/.test(text)) {
    themes.push({ theme: 'Delayed classes', theme_type: 'issue' });
  }
  if (/(wifi|internet|network|connection|router)/.test(text)) {
    themes.push({ theme: 'Wi-Fi problems', theme_type: 'issue' });
  }
  if (/(slow|computer|system|pc|outdated|hardware|lag)/.test(text)) {
    themes.push({ theme: 'Slow lab systems', theme_type: 'issue' });
  }
  if (/(unclear|confusing|fast|difficult|understand|explain)/.test(text)) {
    themes.push({ theme: 'Unclear explanations', theme_type: 'issue' });
  }
  if (/(noisy|noise|loud|disturbance|ac|projector)/.test(text)) {
    themes.push({ theme: 'Noisy / Bad Facilities', theme_type: 'issue' });
  }

  // Praise Theme Mappings
  if (/(helpful|supportive|kind|approachable|friendly)/.test(text)) {
    themes.push({ theme: 'Helpful faculty', theme_type: 'praise' });
  }
  if (/(clear|understandable|well explained|good teaching)/.test(text)) {
    themes.push({ theme: 'Clear teaching', theme_type: 'praise' });
  }
  if (/(interactive|interesting|engaging|amazing|enjoyed)/.test(text)) {
    themes.push({ theme: 'Interactive classes', theme_type: 'praise' });
  }

  return themes;
}
