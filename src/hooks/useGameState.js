import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'plo-game-state';
const LEADERBOARD_KEY = 'plo-leaderboard';
const CONFIG_KEY = 'plo-config';

const LEVEL_THRESHOLDS = [
  { min: 0, max: 99, title: 'Rookie Dealer', badge: 'RD' },
  { min: 100, max: 299, title: 'Floor Dealer', badge: 'FD' },
  { min: 300, max: 599, title: 'Shift Supervisor', badge: 'SS' },
  { min: 600, max: 999, title: 'Pit Boss', badge: 'PB' },
  { min: 1000, max: Infinity, title: 'Casino Pro', badge: 'CP' },
];

export const BLIND_LEVELS = [
  { sb: 1, bb: 2, label: '$1/$2' },
  { sb: 2, bb: 5, label: '$2/$5' },
  { sb: 5, bb: 10, label: '$5/$10' },
  { sb: 10, bb: 25, label: '$10/$25' },
  { sb: 25, bb: 50, label: '$25/$50' },
];

function getDefaultState() {
  return {
    playerName: '',
    xp: 0,
    streak: 0,
    bestStreak: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    unlockedLevel: 1,
    levelProgress: { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 }, 4: { correct: 0, total: 0 }, 5: { correct: 0, total: 0 }, 6: { correct: 0, total: 0 } },
    lastMode: 'training',
  };
}

function getDefaultConfig() {
  return {
    blindLevels: BLIND_LEVELS.map(b => ({ ...b, enabled: true })),
    customBlind: null,
    difficultyLevel: 0, // 0 = all random
    streetLock: null,
    questionCount: 20,
  };
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...getDefaultState(), ...JSON.parse(stored) };
  } catch {}
  return getDefaultState();
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadConfig() {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) return { ...getDefaultConfig(), ...JSON.parse(stored) };
  } catch {}
  return getDefaultConfig();
}

function saveConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function loadLeaderboard() {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { exam: [], speed: [] };
}

function saveLeaderboard(lb) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(lb));
}

export function getLevelInfo(xp) {
  const level = LEVEL_THRESHOLDS.find(l => xp >= l.min && xp <= l.max) || LEVEL_THRESHOLDS[0];
  const nextLevel = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.indexOf(level) + 1];
  const xpInLevel = xp - level.min;
  const xpForLevel = (nextLevel ? nextLevel.min : level.max + 1) - level.min;
  return { ...level, xpInLevel, xpForLevel, nextLevel };
}

export function getStreakMultiplier(streak) {
  if (streak >= 10) return 3;
  if (streak >= 5) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

export default function useGameState() {
  const [state, setState] = useState(loadState);
  const [config, setConfigState] = useState(loadConfig);
  const [leaderboard, setLeaderboard] = useState(loadLeaderboard);

  // Session-only state
  const [sessionStreak, setSessionStreak] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [xpPopup, setXpPopup] = useState(null);

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => { saveConfig(config); }, [config]);
  useEffect(() => { saveLeaderboard(leaderboard); }, [leaderboard]);

  const setPlayerName = useCallback((name) => {
    setState(s => ({ ...s, playerName: name }));
  }, []);

  const setConfig = useCallback((updates) => {
    setConfigState(c => ({ ...c, ...updates }));
  }, []);

  const setLastMode = useCallback((mode) => {
    setState(s => ({ ...s, lastMode: mode }));
  }, []);

  const recordAnswer = useCallback((correct, mode, level, timeRemaining = 0) => {
    let xpGained = 0;

    if (correct) {
      // Base XP
      if (mode === 'exam') xpGained = 10;
      else if (mode === 'training') xpGained = 7;
      else if (mode === 'speed') xpGained = 10;
      else if (mode === 'memorization') xpGained = 5;

      // Time bonus (exam mode)
      if (mode === 'exam') {
        if (timeRemaining >= 10) xpGained += 5;
        else if (timeRemaining >= 5) xpGained += 3;
      }

      // Streak multiplier
      const newStreak = sessionStreak + 1;
      const mult = getStreakMultiplier(newStreak);
      xpGained = Math.round(xpGained * mult);

      setSessionStreak(newStreak);
      setSessionCorrect(c => c + 1);

      // Show XP popup
      setXpPopup({ amount: xpGained, key: Date.now() });
      setTimeout(() => setXpPopup(null), 1000);

      setState(s => {
        const newXP = s.xp + xpGained;
        const newState = {
          ...s,
          xp: newXP,
          streak: newStreak,
          bestStreak: Math.max(s.bestStreak, newStreak),
          totalCorrect: s.totalCorrect + 1,
          totalQuestions: s.totalQuestions + 1,
        };

        // Track level progress for unlocking
        if (level && s.levelProgress[level]) {
          newState.levelProgress = {
            ...s.levelProgress,
            [level]: {
              correct: s.levelProgress[level].correct + 1,
              total: s.levelProgress[level].total + 1,
            },
          };

          // Check unlock: 80% accuracy across 20 questions at current level
          const lp = newState.levelProgress[level];
          if (lp.total >= 20 && (lp.correct / lp.total) >= 0.8 && level === s.unlockedLevel && level < 6) {
            newState.unlockedLevel = level + 1;
          }
        }

        return newState;
      });
    } else {
      setSessionStreak(0);

      setState(s => {
        const newState = {
          ...s,
          streak: 0,
          totalQuestions: s.totalQuestions + 1,
        };
        if (level && s.levelProgress[level]) {
          newState.levelProgress = {
            ...s.levelProgress,
            [level]: {
              correct: s.levelProgress[level].correct,
              total: s.levelProgress[level].total + 1,
            },
          };
        }
        return newState;
      });
    }

    setSessionTotal(t => t + 1);
    setSessionXP(x => x + xpGained);
    return xpGained;
  }, [sessionStreak]);

  const resetSession = useCallback(() => {
    setSessionStreak(0);
    setSessionCorrect(0);
    setSessionTotal(0);
    setSessionXP(0);
  }, []);

  const addLeaderboardEntry = useCallback((mode, entry) => {
    setLeaderboard(lb => {
      const list = [...(lb[mode] || []), entry]
        .sort((a, b) => mode === 'speed' ? a.score - b.score : b.score - a.score)
        .slice(0, 10);
      return { ...lb, [mode]: list };
    });
  }, []);

  const resetProgress = useCallback(() => {
    const fresh = getDefaultState();
    fresh.playerName = state.playerName;
    setState(fresh);
    resetSession();
  }, [state.playerName, resetSession]);

  const getActiveBlinds = useCallback(() => {
    const active = config.blindLevels.filter(b => b.enabled);
    if (config.customBlind) active.push(config.customBlind);
    return active.length > 0 ? active : [BLIND_LEVELS[0]];
  }, [config]);

  return {
    state,
    config,
    leaderboard,
    sessionStreak,
    sessionCorrect,
    sessionTotal,
    sessionXP,
    xpPopup,
    setPlayerName,
    setConfig,
    setLastMode,
    recordAnswer,
    resetSession,
    addLeaderboardEntry,
    resetProgress,
    getActiveBlinds,
  };
}
