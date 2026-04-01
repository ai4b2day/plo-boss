import { getLevelInfo } from '../hooks/useGameState';

export default function Leaderboard({ leaderboard, activeTab = 'exam' }) {
  const tabs = [
    { key: 'exam', label: 'Exam Mode (XP)' },
    { key: 'speed', label: 'Speed Round (Time)' },
  ];

  const entries = leaderboard[activeTab] || [];

  return (
    <div className="bg-surface-light rounded-xl border border-surface-lighter overflow-hidden">
      <div className="p-4 border-b border-surface-lighter">
        <h3 className="text-gold font-bold text-lg text-center">Leaderboard</h3>
      </div>

      <div className="flex border-b border-surface-lighter">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-gold border-b-2 border-gold bg-surface-lighter/50'
                : 'text-text-muted hover:text-text-secondary'
            }`}
            disabled
          >
            {tab.label}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="p-8 text-center text-text-muted text-sm">
          No entries yet. Complete a session to get on the board!
        </div>
      ) : (
        <div className="divide-y divide-surface-lighter">
          {entries.map((entry, i) => {
            const level = getLevelInfo(entry.xp || 0);
            return (
              <div key={i} className="flex items-center px-4 py-3 gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  i === 0 ? 'bg-gold text-surface' :
                  i === 1 ? 'bg-gray-300 text-surface' :
                  i === 2 ? 'bg-amber-700 text-text-primary' :
                  'bg-surface-lighter text-text-muted'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-text-primary font-medium text-sm truncate">{entry.name}</div>
                  <div className="text-text-muted text-xs">{level.title}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-gold font-bold text-sm">
                    {activeTab === 'speed' ? `${entry.score}s` : `${entry.score} XP`}
                  </div>
                  <div className="text-text-muted text-[10px]">{entry.date}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
