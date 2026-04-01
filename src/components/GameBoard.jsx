import { useState, useEffect, useCallback, useRef } from 'react';
import { generateQuestion, generateRandomLevel } from '../utils/questionGenerator';
import { generateBreakdown } from '../utils/potCalc';
import Timer from './Timer';
import ScoreDisplay from './ScoreDisplay';
import Breakdown from './Breakdown';
import { ConfettiExplosion, StreakCelebration, CorrectFlash, WrongFlash, SessionComplete } from './Celebration';
import useTimer from '../hooks/useTimer';

const POSITION_COLORS = {
  SB: 'bg-chip-red',
  BB: 'bg-chip-blue',
  UTG: 'bg-chip-green',
  BTN: 'bg-gold',
  default: 'bg-chip-black',
};

function TableVisual({ positions, streetLabel }) {
  return (
    <div className="relative bg-felt rounded-[40px] border-4 border-felt-light p-6 mx-auto max-w-sm h-32 flex items-center justify-center overflow-hidden">
      {/* Felt texture overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.3)_100%)]" />

      {/* Street label */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-gold/60 text-xs font-bold uppercase tracking-widest">
        {streetLabel}
      </div>

      {/* Positions around the table */}
      <div className="flex gap-3 flex-wrap justify-center">
        {positions.map((pos, i) => (
          <div
            key={pos + i}
            className={`w-9 h-9 rounded-full ${POSITION_COLORS[pos] || POSITION_COLORS.default} flex items-center justify-center text-[10px] font-bold text-white shadow-md`}
          >
            {pos}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GameBoard({ mode, gameState, config, onEnd, onBack }) {
  const { state, sessionStreak, sessionCorrect, sessionTotal, sessionXP, xpPopup, recordAnswer, addLeaderboardEntry } = gameState;

  const [question, setQuestion] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [questionNum, setQuestionNum] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [sessionResults, setSessionResults] = useState([]);
  const inputRef = useRef(null);

  // Celebration state
  const [showCorrectFlash, setShowCorrectFlash] = useState(false);
  const [showWrongFlash, setShowWrongFlash] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(null);

  // Speed round tracking
  const [speedStartTime, setSpeedStartTime] = useState(null);
  const [speedQuestionTimes, setSpeedQuestionTimes] = useState([]);
  const [speedPenalties, setSpeedPenalties] = useState(0);
  const speedQuestionStart = useRef(null);

  const totalQuestions = mode === 'speed' ? 10 : (config.questionCount || Infinity);

  const handleExpire = useCallback(() => {
    if (mode === 'exam' && question && !showResult) {
      handleAnswer(null, true);
    }
  }, [question, showResult, mode]);

  const timer = useTimer(15, handleExpire);

  const activeBlinds = gameState.getActiveBlinds();

  function getLevel() {
    if (config.difficultyLevel > 0) return Math.min(config.difficultyLevel, state.unlockedLevel);
    return Math.min(1 + Math.floor(Math.random() * state.unlockedLevel), state.unlockedLevel);
  }

  function nextQuestion() {
    const level = getLevel();
    const q = generateQuestion(level, activeBlinds);
    setQuestion(q);
    setInputValue('');
    setShowResult(false);
    setLastCorrect(null);
    setHintUsed(false);
    setQuestionNum(n => n + 1);

    if (mode === 'exam') {
      timer.start(15);
    }
    if (mode === 'speed') {
      speedQuestionStart.current = Date.now();
    }

    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  }

  useEffect(() => {
    if (mode === 'speed') {
      setSpeedStartTime(Date.now());
    }
    nextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAnswer(selected, expired = false) {
    if (showResult && mode !== 'training') return;

    timer.stop();

    let userAnswer;
    let correct;

    if (question.type === 'allin-check') {
      userAnswer = selected;
      correct = userAnswer === question.answer;
    } else if (mode === 'training') {
      userAnswer = selected;
      correct = userAnswer === question.answer;
    } else {
      if (expired) {
        userAnswer = null;
        correct = false;
      } else {
        userAnswer = parseInt(inputValue);
        correct = Math.abs(userAnswer - question.answer) <= 1;
      }
    }

    setLastCorrect(correct);
    setShowResult(true);

    // Trigger visual celebrations
    if (correct) {
      setShowCorrectFlash(true);
      setTimeout(() => setShowCorrectFlash(false), 500);

      // Check for streak milestones (streak hasn't updated yet, so +1)
      const newStreak = gameState.sessionStreak + 1;
      if ([3, 5, 10, 25].includes(newStreak)) {
        setShowStreakCelebration(newStreak);
        setTimeout(() => setShowStreakCelebration(null), 1800);
      }
    } else {
      setShowWrongFlash(true);
      setTimeout(() => setShowWrongFlash(false), 500);
    }

    const xp = recordAnswer(correct, mode, question.level, timer.timeLeft);

    // Speed round time tracking
    if (mode === 'speed') {
      const qTime = (Date.now() - speedQuestionStart.current) / 1000;
      setSpeedQuestionTimes(t => [...t, { time: qTime, correct }]);
      if (!correct) setSpeedPenalties(p => p + 10);
    }

    setSessionResults(r => [...r, {
      question: question.prompt,
      answer: question.answer,
      userAnswer,
      correct,
      xp,
      level: question.level,
    }]);
  }

  function handleNext() {
    if (questionNum >= totalQuestions) {
      finishSession();
      return;
    }
    nextQuestion();
  }

  function finishSession() {
    timer.stop();
    setSessionDone(true);

    if (mode === 'exam') {
      addLeaderboardEntry('exam', {
        name: state.playerName || 'Anon',
        score: sessionXP,
        xp: state.xp,
        date: new Date().toLocaleDateString(),
      });
    } else if (mode === 'speed') {
      const totalTime = Math.round((Date.now() - speedStartTime) / 1000) + speedPenalties;
      addLeaderboardEntry('speed', {
        name: state.playerName || 'Anon',
        score: totalTime,
        xp: state.xp,
        date: new Date().toLocaleDateString(),
      });
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !showResult && inputValue) {
      handleAnswer();
    } else if (e.key === 'Enter' && showResult) {
      handleNext();
    }
  }

  function useHint() {
    if (hintUsed) return;
    setHintUsed(true);
    recordAnswer(false, mode, question.level, 0); // costs XP indirectly (we'll just deduct)
  }

  // Session complete screen
  if (sessionDone) {
    const totalTime = mode === 'speed' ? Math.round((Date.now() - speedStartTime) / 1000) : null;
    const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;

    return (
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <SessionComplete accuracy={accuracy} xp={sessionXP} />

        <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter space-y-3 animate-slide-up">
          <div className="flex justify-between">
            <span className="text-text-secondary">Score</span>
            <span className="text-gold font-bold">{sessionCorrect}/{sessionTotal} ({accuracy}%)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">XP Earned</span>
            <span className="text-gold font-bold animate-bounce-in">+{sessionXP}</span>
          </div>
          {mode === 'speed' && (
            <>
              <div className="flex justify-between">
                <span className="text-text-secondary">Total Time</span>
                <span className="text-text-primary font-bold">{totalTime}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Penalties</span>
                <span className="text-danger font-bold">+{speedPenalties}s</span>
              </div>
              <div className="flex justify-between border-t border-surface-lighter pt-2">
                <span className="text-text-secondary">Final Score</span>
                <span className="text-gold font-bold text-lg">{totalTime + speedPenalties}s</span>
              </div>
            </>
          )}
        </div>

        {/* Question breakdown (show in training/exam, speed summary) */}
        {mode !== 'speed' && sessionResults.length > 0 && (
          <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter animate-slide-up">
            <h3 className="text-text-primary font-bold mb-3">Question Review</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sessionResults.map((r, i) => (
                <div key={i} className={`text-sm p-2 rounded-lg ${r.correct ? 'bg-success/10' : 'bg-danger/10'}`}>
                  <div className="text-text-secondary text-xs">Q{i + 1} (Level {r.level})</div>
                  <div className="text-text-primary text-xs">{r.question}</div>
                  <div className="flex justify-between mt-1">
                    <span className={r.correct ? 'text-success' : 'text-danger'}>
                      Your answer: {r.userAnswer !== null && r.userAnswer !== undefined ? `$${r.userAnswer}` : 'Expired'}
                    </span>
                    {!r.correct && <span className="text-gold">Correct: ${r.answer}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === 'speed' && (
          <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter animate-slide-up">
            <h3 className="text-text-primary font-bold mb-3">Time Breakdown</h3>
            <div className="space-y-1">
              {speedQuestionTimes.map((qt, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className={`${qt.correct ? 'text-success' : 'text-danger'}`}>
                    Q{i + 1} {qt.correct ? '\u2713' : '\u2717'}
                  </span>
                  <span className="text-text-secondary">{qt.time.toFixed(1)}s{!qt.correct ? ' (+10s)' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onEnd}
          className="w-full py-3 bg-gradient-to-r from-gold-dark to-gold text-surface font-bold rounded-xl animate-slide-up"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  if (!question) return null;

  const isMultipleChoice = mode === 'training' || question.type === 'allin-check';

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Celebration overlays */}
      {showCorrectFlash && <CorrectFlash />}
      {showWrongFlash && <WrongFlash />}
      {showStreakCelebration && <StreakCelebration streak={showStreakCelebration} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-text-secondary hover:text-text-primary text-sm">&larr; Quit</button>
        <div className="text-text-muted text-sm">
          Q{questionNum}{totalQuestions < Infinity ? `/${totalQuestions}` : ''} &middot; Level {question.level}
        </div>
        {mode === 'exam' && (
          <Timer timeLeft={timer.timeLeft} isRunning={timer.isRunning} color={timer.color} pulsing={timer.pulsing} />
        )}
        {mode === 'speed' && speedStartTime && (
          <div className="text-text-secondary text-sm font-mono">
            {Math.round((Date.now() - speedStartTime) / 1000)}s
          </div>
        )}
        {mode === 'training' && <div className="w-16" />}
      </div>

      {/* Score */}
      <ScoreDisplay
        xp={state.xp}
        streak={sessionStreak}
        sessionCorrect={sessionCorrect}
        sessionTotal={sessionTotal}
        xpPopup={xpPopup}
      />

      {/* Table Visual */}
      <TableVisual positions={question.positions || ['SB', 'BB']} streetLabel={question.streetLabel || 'Preflop'} />

      {/* Question */}
      <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
        <div className="text-text-primary text-base leading-relaxed">{question.prompt}</div>
      </div>

      {/* Hint (Training mode only) */}
      {mode === 'training' && !showResult && !hintUsed && question.type !== 'allin-check' && (
        <button
          onClick={useHint}
          className="text-xs text-text-muted hover:text-warning transition-colors"
        >
          Show hint (-5 XP)
        </button>
      )}
      {hintUsed && !showResult && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-sm text-warning animate-slide-up">
          Formula: (3 x bet) + pot = max raise
        </div>
      )}

      {/* Answer Input */}
      {!showResult && (
        <div className="space-y-3">
          {isMultipleChoice ? (
            <div className="grid grid-cols-2 gap-3">
              {question.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(choice.value)}
                  className="p-4 bg-surface rounded-xl border-2 border-surface-lighter hover:border-gold text-text-primary font-bold text-lg transition-all active:scale-95"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-lg">$</span>
                <input
                  ref={inputRef}
                  type="number"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter amount"
                  autoFocus
                  className="w-full bg-surface border-2 border-surface-lighter focus:border-gold rounded-xl pl-8 pr-4 py-4 text-text-primary text-xl font-bold outline-none transition-colors"
                />
              </div>
              <button
                onClick={() => handleAnswer()}
                disabled={!inputValue}
                className="px-6 bg-gold hover:bg-gold-light text-surface font-bold rounded-xl transition-colors disabled:opacity-40 text-lg"
              >
                Go
              </button>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {showResult && (
        <div className="space-y-3 animate-slide-up">
          {/* Brief indicator for exam/speed */}
          {(mode === 'exam' || mode === 'speed') && (
            <div className={`text-center py-3 rounded-xl font-bold text-lg animate-bounce-in ${lastCorrect ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
              {lastCorrect ? 'Correct!' : `Wrong — Answer: $${question.answer}`}
            </div>
          )}

          {/* Full breakdown for training */}
          {mode === 'training' && question.type !== 'allin-check' && (
            <Breakdown scenario={question} isCorrect={lastCorrect} />
          )}
          {mode === 'training' && question.type === 'allin-check' && (
            <div className={`text-center py-3 rounded-xl font-bold ${lastCorrect ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
              {lastCorrect ? 'Correct!' : `Wrong — Answer: ${question.answerLabel}`}
              <div className="text-sm text-text-secondary mt-1">
                Stack ${question.playerStack} {question.answer === 1 ? '\u2264' : '>'} Pot ${question.existingPot}
              </div>
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full py-3 bg-gradient-to-r from-gold-dark to-gold hover:from-gold to-gold-light text-surface font-bold rounded-xl transition-all"
          >
            {questionNum >= totalQuestions ? 'Finish Session' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  );
}
