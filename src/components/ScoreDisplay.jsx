import { getLevelInfo, getStreakMultiplier } from '../hooks/useGameState';
import ProgressBar from './ProgressBar';

export default function ScoreDisplay({ xp, streak, sessionCorrect, sessionTotal, xpPopup }) {
  const level = getLevelInfo(xp);
  const mult = getStreakMultiplier(streak);

  return (
    <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter relative">
      {/* XP Popup */}
      {xpPopup && (
        <div key={xpPopup.key} className="absolute -top-2 right-4 text-gold font-bold text-lg animate-xp-pop">
          +{xpPopup.amount} XP
        </div>
      )}

      <div className="flex items-center gap-4 mb-3">
        {/* Level Badge */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-dark to-gold flex items-center justify-center shrink-0">
          <span className="text-surface font-bold text-sm">{level.badge}</span>
        </div>

        <div className="flex-1 min-w-0">
          <ProgressBar xp={xp} />
        </div>
      </div>

      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-text-muted">Streak:</span>
          <span className={`font-bold ${streak >= 5 ? 'text-gold animate-streak-fire' : streak >= 3 ? 'text-warning' : 'text-text-primary'}`}>
            {streak}{streak >= 3 ? ' \u{1F525}' : ''}
          </span>
          {mult > 1 && (
            <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded">
              {mult}x XP
            </span>
          )}
        </div>

        <div className="text-text-secondary text-xs">
          {sessionCorrect}/{sessionTotal} correct
        </div>
      </div>
    </div>
  );
}
