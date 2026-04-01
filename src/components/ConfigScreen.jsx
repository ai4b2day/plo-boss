import { useState } from 'react';
import { BLIND_LEVELS } from '../hooks/useGameState';

export default function ConfigScreen({ config, setConfig, onStart, unlockedLevel }) {
  const [customSB, setCustomSB] = useState('');
  const [customBB, setCustomBB] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  function toggleBlind(index) {
    const updated = config.blindLevels.map((b, i) =>
      i === index ? { ...b, enabled: !b.enabled } : b
    );
    // Ensure at least one is selected
    if (updated.some(b => b.enabled) || config.customBlind) {
      setConfig({ blindLevels: updated });
    }
  }

  function addCustomBlind() {
    const sb = parseInt(customSB);
    const bb = parseInt(customBB);
    if (sb > 0 && bb > sb) {
      setConfig({ customBlind: { sb, bb, label: `$${sb}/$${bb}`, enabled: true } });
      setShowCustom(false);
    }
  }

  function removeCustomBlind() {
    setConfig({ customBlind: null });
  }

  const levelOptions = [
    { value: 0, label: 'All (Random)' },
    ...Array.from({ length: 6 }, (_, i) => ({
      value: i + 1,
      label: `Level ${i + 1}${i + 1 > unlockedLevel ? ' (Locked)' : ''}`,
      disabled: i + 1 > unlockedLevel,
    })),
  ];

  const countOptions = [10, 20, 50, 0];

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6 animate-slide-up">
      <h2 className="text-gold font-bold text-2xl text-center">Session Setup</h2>

      {/* Blind Levels */}
      <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
        <h3 className="text-text-primary font-bold mb-3">Blind Levels</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {config.blindLevels.map((blind, i) => (
            <button
              key={i}
              onClick={() => toggleBlind(i)}
              className={`p-3 rounded-lg border-2 text-sm font-bold transition-all ${
                blind.enabled
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-surface-lighter bg-surface text-text-muted hover:border-text-muted'
              }`}
            >
              {blind.label}
            </button>
          ))}

          {config.customBlind ? (
            <button
              onClick={removeCustomBlind}
              className="p-3 rounded-lg border-2 border-gold bg-gold/10 text-gold text-sm font-bold relative"
            >
              {config.customBlind.label}
              <span className="absolute -top-1 -right-1 bg-danger text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">x</span>
            </button>
          ) : (
            <button
              onClick={() => setShowCustom(!showCustom)}
              className="p-3 rounded-lg border-2 border-dashed border-surface-lighter text-text-muted hover:border-gold hover:text-gold text-sm transition-colors"
            >
              + Custom
            </button>
          )}
        </div>

        {showCustom && (
          <div className="flex gap-2 mt-3 items-center animate-slide-up">
            <span className="text-text-secondary text-sm">$</span>
            <input
              type="number"
              placeholder="SB"
              value={customSB}
              onChange={e => setCustomSB(e.target.value)}
              className="w-20 bg-surface border border-surface-lighter rounded-lg px-3 py-2 text-text-primary text-sm"
            />
            <span className="text-text-secondary">/</span>
            <span className="text-text-secondary text-sm">$</span>
            <input
              type="number"
              placeholder="BB"
              value={customBB}
              onChange={e => setCustomBB(e.target.value)}
              className="w-20 bg-surface border border-surface-lighter rounded-lg px-3 py-2 text-text-primary text-sm"
            />
            <button
              onClick={addCustomBlind}
              className="px-3 py-2 bg-gold text-surface rounded-lg text-sm font-bold hover:bg-gold-light"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Difficulty */}
      <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
        <h3 className="text-text-primary font-bold mb-3">Difficulty Level</h3>
        <select
          value={config.difficultyLevel}
          onChange={e => setConfig({ difficultyLevel: parseInt(e.target.value) })}
          className="w-full bg-surface border border-surface-lighter rounded-lg px-3 py-2.5 text-text-primary"
        >
          {levelOptions.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        <h3 className="text-text-primary font-bold mb-2 mt-4">Street Lock</h3>
        <select
          value={config.streetLock || ''}
          onChange={e => setConfig({ streetLock: e.target.value || null })}
          className="w-full bg-surface border border-surface-lighter rounded-lg px-3 py-2.5 text-text-primary"
        >
          <option value="">All Streets</option>
          <option value="preflop">Preflop Only</option>
          <option value="flop">Flop Only</option>
          <option value="turn">Turn Only</option>
          <option value="river">River Only</option>
        </select>
      </div>

      {/* Question Count */}
      <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
        <h3 className="text-text-primary font-bold mb-3">Questions Per Session</h3>
        <div className="flex gap-2">
          {countOptions.map(count => (
            <button
              key={count}
              onClick={() => setConfig({ questionCount: count })}
              className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-bold transition-all ${
                config.questionCount === count
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-surface-lighter text-text-muted hover:border-text-muted'
              }`}
            >
              {count === 0 ? '\u221e' : count}
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={onStart}
        className="w-full py-4 bg-gradient-to-r from-gold-dark to-gold hover:from-gold to-gold-light text-surface font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-gold/20"
      >
        Start Session
      </button>
    </div>
  );
}
