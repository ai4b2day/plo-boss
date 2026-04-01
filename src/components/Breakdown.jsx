import { generateBreakdown } from '../utils/potCalc';

export default function Breakdown({ scenario, isCorrect }) {
  const steps = generateBreakdown(scenario);

  return (
    <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter animate-slide-up">
      <div className={`text-sm font-bold mb-3 ${isCorrect ? 'text-success' : 'text-danger'}`}>
        {isCorrect ? 'Correct!' : 'Incorrect'} — Here's the breakdown:
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 text-sm ${step.final ? 'text-gold font-bold text-base mt-2 pt-2 border-t border-surface-lighter' : 'text-text-secondary'}`}
          >
            <span className="text-text-muted shrink-0 w-5 text-right">{i + 1}.</span>
            <span>{step.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
