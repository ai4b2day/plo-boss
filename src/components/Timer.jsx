export default function Timer({ timeLeft, isRunning, color, pulsing }) {
  if (!isRunning && timeLeft <= 0) return null;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - timeLeft / 15);

  return (
    <div className={`flex items-center justify-center ${pulsing ? 'animate-pulse-red' : ''}`}>
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32" cy="32" r={radius}
            fill="none" stroke="currentColor"
            className="text-surface-lighter"
            strokeWidth="4"
          />
          <circle
            cx="32" cy="32" r={radius}
            fill="none" stroke="currentColor"
            className={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center font-bold text-lg ${color}`}>
          {timeLeft}
        </div>
      </div>
    </div>
  );
}
