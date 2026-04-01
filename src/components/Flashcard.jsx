import { useState, useEffect } from 'react';
import { generateMemorizationQuestion } from '../utils/questionGenerator';
import { loadMastery, recordDrillResult, getMasterySummary } from '../utils/multiplesDrill';
import { generateBreakdown } from '../utils/potCalc';
import ScoreDisplay from './ScoreDisplay';

export default function Flashcard({ gameState, onBack }) {
  const { state, sessionStreak, sessionCorrect, sessionTotal, xpPopup, recordAnswer } = gameState;
  const [mastery, setMastery] = useState(loadMastery);
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    nextQuestion();
  }, []);

  function nextQuestion() {
    setSelectedAnswer(null);
    setShowResult(false);
    setIsFlipping(true);
    setTimeout(() => {
      setQuestion(generateMemorizationQuestion());
      setIsFlipping(false);
    }, 300);
  }

  function handleChoice(choice) {
    if (showResult) return;
    setSelectedAnswer(choice.value);
    const correct = choice.value === question.answer;

    const updated = recordDrillResult(mastery, question.drillType, correct);
    setMastery({ ...updated });
    recordAnswer(correct, 'memorization', null, 0);
    setShowResult(true);
  }

  const summary = getMasterySummary(mastery);

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="text-text-secondary hover:text-text-primary text-sm">
          &larr; Back
        </button>
        <h2 className="text-gold font-bold text-lg">Memorization Drill</h2>
        <div className="w-16" />
      </div>

      <ScoreDisplay
        xp={state.xp}
        streak={sessionStreak}
        sessionCorrect={sessionCorrect}
        sessionTotal={sessionTotal}
        xpPopup={xpPopup}
      />

      {/* Mastery Indicators */}
      <div className="grid grid-cols-3 gap-2">
        {summary.map(s => (
          <div key={s.type} className={`rounded-lg p-2 text-center text-xs border ${s.mastered ? 'border-success bg-success/10' : 'border-surface-lighter bg-surface-light'}`}>
            <div className={`font-bold ${s.mastered ? 'text-success' : 'text-text-secondary'}`}>{s.label}</div>
            <div className="text-text-muted">{s.percent}% ({s.attempts})</div>
            {s.mastered && <div className="text-success text-[10px]">MASTERED</div>}
          </div>
        ))}
      </div>

      {/* Flashcard */}
      {question && (
        <div className={`bg-felt rounded-2xl p-6 border-2 border-felt-light shadow-lg ${isFlipping ? 'animate-card-flip' : ''}`}>
          <div className="text-center mb-6">
            <div className="text-text-muted text-xs uppercase mb-2">What multiple is the pot-sized raise?</div>
            <div className="text-3xl font-bold text-gold mb-1">Pot: ${question.potSize}</div>
            <div className="text-2xl text-text-primary">Bet: ${question.betSize}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {question.choices.map((choice, i) => {
              let btnClass = 'bg-surface-light border-surface-lighter hover:border-gold text-text-primary';
              if (showResult) {
                if (choice.value === question.answer) {
                  btnClass = 'bg-success/20 border-success text-success';
                } else if (choice.value === selectedAnswer) {
                  btnClass = 'bg-danger/20 border-danger text-danger';
                } else {
                  btnClass = 'bg-surface-light border-surface-lighter text-text-muted opacity-50';
                }
              }
              return (
                <button
                  key={i}
                  onClick={() => handleChoice(choice)}
                  disabled={showResult}
                  className={`p-3 rounded-xl border-2 font-bold text-lg transition-all ${btnClass}`}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="mt-4 space-y-3 animate-slide-up">
              <div className={`text-center font-bold ${selectedAnswer === question.answer ? 'text-success' : 'text-danger'}`}>
                {selectedAnswer === question.answer ? 'Correct!' : `Wrong! Answer: ${question.multipleLabel}`}
              </div>
              <div className="bg-surface/60 rounded-lg p-3 text-sm text-text-secondary">
                <div>Raise = (3 x ${question.betSize}) + ${question.potSize} = ${question.raiseAmount}</div>
                <div className="text-gold mt-1">That's {question.multipleLabel} the original pot</div>
              </div>
              <button
                onClick={nextQuestion}
                className="w-full py-3 bg-gold hover:bg-gold-light text-surface font-bold rounded-xl transition-colors"
              >
                Next Card
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
