import { useState } from 'react';

export default function Settings({ gameState, onBack }) {
  const { state, setPlayerName, resetProgress } = gameState;
  const [name, setName] = useState(state.playerName);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleSaveName() {
    if (name.trim()) setPlayerName(name.trim());
  }

  function handleReset() {
    resetProgress();
    setShowConfirm(false);
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-text-secondary hover:text-text-primary text-sm">&larr; Back</button>
        <h2 className="text-gold font-bold text-lg">Settings</h2>
        <div className="w-12" />
      </div>

      <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter space-y-4">
        <div>
          <label className="text-text-secondary text-sm block mb-1">Player Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
              className="flex-1 bg-surface border border-surface-lighter rounded-lg px-3 py-2 text-text-primary outline-none focus:border-gold"
            />
            <button
              onClick={handleSaveName}
              className="px-4 py-2 bg-gold text-surface rounded-lg font-bold text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter space-y-3">
        <h3 className="text-text-primary font-bold">Stats</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-surface rounded-lg p-3">
            <div className="text-text-muted text-xs">Total XP</div>
            <div className="text-gold font-bold text-lg">{state.xp}</div>
          </div>
          <div className="bg-surface rounded-lg p-3">
            <div className="text-text-muted text-xs">Best Streak</div>
            <div className="text-gold font-bold text-lg">{state.bestStreak}</div>
          </div>
          <div className="bg-surface rounded-lg p-3">
            <div className="text-text-muted text-xs">Total Questions</div>
            <div className="text-text-primary font-bold text-lg">{state.totalQuestions}</div>
          </div>
          <div className="bg-surface rounded-lg p-3">
            <div className="text-text-muted text-xs">Accuracy</div>
            <div className="text-text-primary font-bold text-lg">
              {state.totalQuestions > 0 ? Math.round((state.totalCorrect / state.totalQuestions) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-light rounded-xl p-4 border border-danger/30">
        <h3 className="text-danger font-bold mb-2">Danger Zone</h3>
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-2 bg-danger/10 text-danger border border-danger/30 rounded-lg text-sm font-medium hover:bg-danger/20"
          >
            Reset All Progress
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-text-secondary text-sm">This will reset your XP, levels, and streaks. Leaderboard entries are kept.</p>
            <div className="flex gap-2">
              <button onClick={handleReset} className="flex-1 py-2 bg-danger text-white rounded-lg font-bold text-sm">
                Confirm Reset
              </button>
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 bg-surface-lighter text-text-secondary rounded-lg text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
