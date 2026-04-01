import { useState, useEffect } from 'react';

const CONFETTI_COLORS = ['#d4a843', '#e8c96a', '#2ecc71', '#e74c3c', '#2980b9', '#f39c12'];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function ConfettiPiece({ color, delay }) {
  const left = randomBetween(5, 95);
  const size = randomBetween(6, 12);
  const duration = randomBetween(1.5, 3);
  const rotation = randomBetween(0, 360);
  const shape = Math.random() > 0.5 ? 'rounded-full' : 'rounded-sm';

  return (
    <div
      className={`absolute top-0 ${shape}`}
      style={{
        left: `${left}%`,
        width: `${size}px`,
        height: `${size * 0.6}px`,
        backgroundColor: color,
        transform: `rotate(${rotation}deg)`,
        animation: `confetti-fall ${duration}s ease-in ${delay}s forwards`,
        opacity: 0,
      }}
    />
  );
}

export function ConfettiExplosion() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: randomBetween(0, 0.5),
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <ConfettiPiece key={p.id} color={p.color} delay={p.delay} />
      ))}
    </div>
  );
}

export function StreakCelebration({ streak }) {
  const messages = {
    3: { text: 'On Fire!', icon: '\u{1F525}' },
    5: { text: 'Unstoppable!', icon: '\u{1F4A5}' },
    10: { text: 'LEGENDARY!', icon: '\u{1F451}' },
    25: { text: 'GODMODE!', icon: '\u{2B50}' },
  };

  const msg = messages[streak];
  if (!msg) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="text-center animate-streak-celebration">
        <div className="text-6xl mb-2">{msg.icon}</div>
        <div className="text-3xl font-black text-gold drop-shadow-lg">{msg.text}</div>
        <div className="text-lg text-gold-light font-bold">{streak} Streak!</div>
      </div>
    </div>
  );
}

export function CorrectFlash() {
  return (
    <div className="fixed inset-0 pointer-events-none z-40 bg-success/10 animate-correct-flash" />
  );
}

export function WrongFlash() {
  return (
    <div className="fixed inset-0 pointer-events-none z-40 bg-danger/10 animate-correct-flash" />
  );
}

export function SessionComplete({ accuracy, xp }) {
  const isGreat = accuracy >= 80;
  const isGood = accuracy >= 50;

  return (
    <div className="text-center py-8 animate-slide-up">
      <div className="text-7xl mb-4">
        {isGreat ? '\u{1F3C6}' : isGood ? '\u{1F44F}' : '\u{1F4AA}'}
      </div>
      <h2 className="text-3xl font-black text-gold mb-2">
        {isGreat ? 'Outstanding!' : isGood ? 'Nice Work!' : 'Keep Grinding!'}
      </h2>
      <div className="text-gold-light text-lg font-bold mb-1">
        {accuracy}% Accuracy
      </div>
      <div className="text-text-secondary">
        +{xp} XP earned this session
      </div>
      {isGreat && <ConfettiExplosion />}
    </div>
  );
}
