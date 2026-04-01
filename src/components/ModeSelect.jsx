import { useState } from 'react';
import { getLevelInfo } from '../hooks/useGameState';
import Leaderboard from './Leaderboard';
import EmailSubscribe from './EmailSubscribe';

const MODES = [
  {
    key: 'training',
    title: 'Training Mode',
    icon: '\u{1F4DA}',
    description: 'Multiple choice with step-by-step breakdowns. No time pressure. Learn at your own pace.',
    detail: 'Hints available (costs 5 XP). Includes Memorization Drill sub-mode.',
    color: 'from-chip-green to-green-700',
    border: 'border-chip-green',
  },
  {
    key: 'exam',
    title: 'Exam Mode',
    icon: '\u{1F3AF}',
    description: 'Free numeric input. 15-second timer. Full XP rewards with streak multipliers.',
    detail: 'No hints. No multiple choice. Timer expiry = wrong answer.',
    color: 'from-chip-red to-red-700',
    border: 'border-chip-red',
  },
  {
    key: 'speed',
    title: 'Speed Round',
    icon: '\u26A1',
    description: '10 questions, fastest time wins. Wrong answers add 10-second penalty.',
    detail: 'Leaderboard based on total time + accuracy. No per-question timer.',
    color: 'from-chip-blue to-blue-700',
    border: 'border-chip-blue',
  },
];

export default function ModeSelect({ gameState, onSelectMode, onSettings }) {
  const { state, leaderboard } = gameState;
  const [showNameInput, setShowNameInput] = useState(!state.playerName);
  const [name, setName] = useState(state.playerName || '');
  const [lbTab, setLbTab] = useState('exam');
  const level = getLevelInfo(state.xp);

  function handleNameSubmit(e) {
    e.preventDefault();
    if (name.trim()) {
      gameState.setPlayerName(name.trim());
      setShowNameInput(false);
    }
  }

  if (showNameInput) {
    return (
      <div className="max-w-md mx-auto p-6 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-6xl mb-4">{'\u{1F3B0}'}</div>
        <h1 className="text-3xl font-bold text-gold mb-2">PLO Boss</h1>
        <p className="text-text-secondary mb-8 text-center">Dealer Math Trainer</p>

        <form onSubmit={handleNameSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-text-secondary text-sm mb-1">Enter your name or initials</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Mike D"
              maxLength={20}
              autoFocus
              className="w-full bg-surface-light border-2 border-surface-lighter focus:border-gold rounded-xl px-4 py-3 text-text-primary text-lg outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 bg-gradient-to-r from-gold-dark to-gold hover:from-gold to-gold-light text-surface font-bold rounded-xl transition-all disabled:opacity-40"
          >
            Let's Deal
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center pt-4">
        <div className="text-4xl mb-1">{'\u{1F3B0}'}</div>
        <h1 className="text-2xl font-bold text-gold">PLO Boss</h1>
        <p className="text-text-muted text-sm">Dealer Math Trainer</p>
      </div>

      {/* Player Info */}
      <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-dark to-gold flex items-center justify-center shrink-0">
          <span className="text-surface font-bold text-xs">{level.badge}</span>
        </div>
        <div className="flex-1">
          <div className="text-text-primary font-medium">{state.playerName}</div>
          <div className="text-text-muted text-xs">{level.title} &middot; {state.xp} XP &middot; Best Streak: {state.bestStreak}</div>
        </div>
        <button onClick={onSettings} className="text-text-muted hover:text-gold text-sm">
          \u2699
        </button>
      </div>

      {/* Mode Cards */}
      <div className="space-y-3">
        {MODES.map(mode => (
          <button
            key={mode.key}
            onClick={() => onSelectMode(mode.key)}
            className={`w-full text-left bg-surface-light rounded-xl p-5 border-2 border-surface-lighter hover:${mode.border} transition-all group`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center text-2xl shrink-0`}>
                {mode.icon}
              </div>
              <div>
                <h3 className="text-text-primary font-bold group-hover:text-gold transition-colors">
                  {mode.title}
                </h3>
                <p className="text-text-secondary text-sm mt-0.5">{mode.description}</p>
                <p className="text-text-muted text-xs mt-1">{mode.detail}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Start */}
      <button
        onClick={() => onSelectMode(state.lastMode || 'training', true)}
        className="w-full py-3 bg-surface-lighter hover:bg-surface-light text-text-secondary hover:text-gold border border-surface-lighter rounded-xl text-sm font-medium transition-all"
      >
        Jump In &rarr; {state.lastMode === 'speed' ? 'Speed Round' : state.lastMode === 'exam' ? 'Exam Mode' : 'Training Mode'} (last config)
      </button>

      {/* Email Subscribe */}
      <EmailSubscribe />

      {/* Leaderboard */}
      <div>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setLbTab('exam')}
            className={`text-xs px-3 py-1 rounded-full ${lbTab === 'exam' ? 'bg-gold text-surface' : 'bg-surface-lighter text-text-muted'}`}
          >
            Exam
          </button>
          <button
            onClick={() => setLbTab('speed')}
            className={`text-xs px-3 py-1 rounded-full ${lbTab === 'speed' ? 'bg-gold text-surface' : 'bg-surface-lighter text-text-muted'}`}
          >
            Speed
          </button>
        </div>
        <Leaderboard leaderboard={leaderboard} activeTab={lbTab} />
      </div>

      {/* Level Progress */}
      <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
        <h3 className="text-text-primary font-bold mb-3">Training Levels</h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map(lvl => {
            const unlocked = lvl <= state.unlockedLevel;
            const lp = state.levelProgress[lvl];
            const pct = lp.total > 0 ? Math.round((lp.correct / lp.total) * 100) : 0;
            return (
              <div
                key={lvl}
                className={`rounded-lg p-2 text-center text-xs border ${
                  unlocked ? 'border-gold/30 bg-gold/5' : 'border-surface-lighter bg-surface opacity-50'
                }`}
              >
                <div className={`font-bold text-lg ${unlocked ? 'text-gold' : 'text-text-muted'}`}>
                  {unlocked ? lvl : '\u{1F512}'}
                </div>
                <div className="text-text-muted">
                  {unlocked ? `${pct}%` : 'Locked'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
