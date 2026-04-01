import { getLevelInfo } from '../hooks/useGameState';

export default function ProgressBar({ xp }) {
  const level = getLevelInfo(xp);
  const percent = level.xpForLevel > 0
    ? Math.min(100, Math.round((level.xpInLevel / level.xpForLevel) * 100))
    : 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-text-secondary font-medium">{level.title}</span>
        <span className="text-xs text-gold">{xp} XP</span>
      </div>
      <div className="w-full h-3 bg-surface-lighter rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gold-dark to-gold rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      {level.nextLevel && (
        <div className="text-[10px] text-text-muted mt-0.5 text-right">
          {level.nextLevel.min - xp} XP to {level.nextLevel.title}
        </div>
      )}
    </div>
  );
}
