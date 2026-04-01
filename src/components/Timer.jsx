export default function Timer({ timeLeft, isRunning, color, pulsing }) {
  if (!isRunning && timeLeft <= 0) return null;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - timeLeft / 15);

  return (
    <div className={`flex items-center justify-center ${pulsing ? 'animate-pulse-red' : ''}`}>
      <div className="relative w-20 h-20">
        {/* Glow effect when urgent */}
        {timeLeft <= 5 && isRunning && (
          <div className="absolute inset-0 rounded-full bg-danger/20 animate-ping" />
        )}

        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
          {/* Background track */}
          <circle
            cx="32" cy="32" r={radius}
            fill="none" stroke="currentColor"
            className="text-surface-lighter"
            strokeWidth="5"
          />
          {/* Progress arc */}
          <circle
            cx="32" cy="32" r={radius}
            fill="none" stroke="currentColor"
            className={color}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        {/* Center number */}
        <div className={`absolute inset-0 flex items-center justify-center font-bold ${color} ${
          timeLeft <= 5 ? 'text-2xl' : 'text-xl'
        } ${timeLeft <= 3 && isRunning ? 'animate-bounce' : ''}`}>
          {timeLeft}
        </div>

        {/* Urgency label */}
        {timeLeft <= 5 && isRunning && (
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-danger text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
            Hurry!
          </div>
        )}
      </div>
    </div>
  );
}
