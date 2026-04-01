/**
 * Memorization Drill: Spaced Repetition Tracker
 * Tracks dealer mastery of core pot-size multiples and adjusts drill frequency.
 */

const STORAGE_KEY = 'plo-multiples-mastery';

const DRILL_TYPES = ['full', 'half', 'twothirds'];

function getDefaultMastery() {
  return {
    full: { correct: 0, total: 0, lastSeen: 0, interval: 1 },
    half: { correct: 0, total: 0, lastSeen: 0, interval: 1 },
    twothirds: { correct: 0, total: 0, lastSeen: 0, interval: 1 },
  };
}

export function loadMastery() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return getDefaultMastery();
}

export function saveMastery(mastery) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mastery));
}

// Record a drill result and update spaced repetition intervals
export function recordDrillResult(mastery, drillType, correct) {
  const entry = mastery[drillType];
  entry.total += 1;
  if (correct) {
    entry.correct += 1;
    // Increase interval on correct (show less frequently)
    entry.interval = Math.min(entry.interval * 2, 16);
  } else {
    // Reset interval on wrong (show more frequently)
    entry.interval = 1;
  }
  entry.lastSeen = Date.now();
  saveMastery(mastery);
  return mastery;
}

// Pick the next drill type using spaced repetition weighting
// Types with lower intervals (weaker) are shown more frequently
export function pickNextDrillType(mastery) {
  const weights = DRILL_TYPES.map(type => {
    const entry = mastery[type];
    // Weight is inverse of interval — weaker multiples get higher weight
    const weight = 1 / entry.interval;
    // Boost weight if never seen or seen long ago
    const timeSince = Date.now() - entry.lastSeen;
    const timeBoost = timeSince > 60000 ? 1.5 : 1; // Boost if >1min since last seen
    return { type, weight: weight * timeBoost };
  });

  // Weighted random selection
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let r = Math.random() * totalWeight;
  for (const w of weights) {
    r -= w.weight;
    if (r <= 0) return w.type;
  }
  return weights[weights.length - 1].type;
}

// Get mastery level for display (0-100%)
export function getMasteryPercent(mastery, drillType) {
  const entry = mastery[drillType];
  if (entry.total === 0) return 0;
  return Math.round((entry.correct / entry.total) * 100);
}

// Check if a multiple is "mastered" (>80% accuracy with 5+ attempts)
export function isMastered(mastery, drillType) {
  const entry = mastery[drillType];
  return entry.total >= 5 && (entry.correct / entry.total) >= 0.8;
}

// Get overall mastery summary
export function getMasterySummary(mastery) {
  return DRILL_TYPES.map(type => ({
    type,
    label: type === 'full' ? 'Full Pot (4×)' : type === 'half' ? 'Half Pot (2.5×)' : 'Two-Thirds (3×)',
    percent: getMasteryPercent(mastery, type),
    mastered: isMastered(mastery, type),
    attempts: mastery[type].total,
  }));
}

export function resetMastery() {
  const fresh = getDefaultMastery();
  saveMastery(fresh);
  return fresh;
}
