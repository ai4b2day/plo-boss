/**
 * Dynamic Question Generator for PLO Dealer Math Trainer
 * Generates mathematically valid scenarios based on difficulty level and blind configuration.
 */

import { potSizedRaise, preflopPot, preflopPotSizedRaise } from './potCalc.js';

const POSITIONS = ['SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO', 'BTN'];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate plausible wrong answers using common dealer mistakes
function generateDistractors(correctAnswer, scenario) {
  const distractors = new Set();
  const { type } = scenario;

  if (type === 'blinds-only' && scenario.question === 'raise') {
    const { sb, bb } = scenario;
    // Mistake: used 2× instead of 3×
    distractors.add(2 * bb + sb + bb);
    // Mistake: forgot to add the call (just 3×bb + pot without BB)
    distractors.add(3 * bb + sb);
    // Mistake: calculated 3×pot instead of formula
    distractors.add(3 * (sb + bb));
  } else if (type === 'flop-bet') {
    const { existingPot, betAmount } = scenario;
    // Mistake: used 2× instead of 3×
    distractors.add(2 * betAmount + existingPot);
    // Mistake: forgot to add the pot
    distractors.add(3 * betAmount);
    // Mistake: added pot after (bet + pot) × 3
    distractors.add(3 * (betAmount + existingPot));
  } else if (type === 'reraise') {
    const { existingPot, firstRaise } = scenario;
    // Mistake: used 2× instead of 3×
    distractors.add(2 * firstRaise + existingPot + firstRaise);
    // Mistake: forgot to account for the call
    distractors.add(3 * firstRaise + existingPot);
    // Mistake: doubled the raise instead of 3×
    distractors.add(2 * firstRaise + existingPot);
  }

  // Fill remaining slots with close-but-wrong values
  const offsets = [-10, -5, 5, 10, -15, 15, -20, 20, -3, 3, -7, 7];
  for (const off of shuffle(offsets)) {
    if (distractors.size >= 3) break;
    const wrong = correctAnswer + off;
    if (wrong > 0 && wrong !== correctAnswer && !distractors.has(wrong)) {
      distractors.add(wrong);
    }
  }

  // Fallback: percentage-based distractors
  const pcts = [0.7, 0.85, 1.15, 1.3, 0.5, 1.5];
  for (const p of shuffle(pcts)) {
    if (distractors.size >= 3) break;
    const wrong = Math.round(correctAnswer * p);
    if (wrong > 0 && wrong !== correctAnswer && !distractors.has(wrong)) {
      distractors.add(wrong);
    }
  }

  return [...distractors].slice(0, 3);
}

// LEVEL 1: Blinds Only
function generateLevel1(blinds) {
  const { sb, bb } = pickRandom(blinds);
  const questionType = Math.random() < 0.4 ? 'pot' : 'raise';

  if (questionType === 'pot') {
    return {
      type: 'blinds-only',
      level: 1,
      question: 'pot',
      sb,
      bb,
      prompt: `$${sb}/$${bb} PLO game. What is the starting pot?`,
      answer: preflopPot(sb, bb),
      positions: ['SB', 'BB'],
      streetLabel: 'Preflop',
    };
  } else {
    return {
      type: 'blinds-only',
      level: 1,
      question: 'raise',
      sb,
      bb,
      prompt: `$${sb}/$${bb} PLO game. What is the maximum pot-sized raise preflop?`,
      answer: preflopPotSizedRaise(sb, bb),
      positions: ['SB', 'BB', 'UTG'],
      streetLabel: 'Preflop',
    };
  }
}

// LEVEL 2: Single Preflop Raise
function generateLevel2(blinds) {
  const { sb, bb } = pickRandom(blinds);
  const pot = sb + bb;
  // First raiser pot-sizes it
  const raiseAmount = preflopPotSizedRaise(sb, bb);
  const numCallers = rand(1, 3);
  const totalPot = raiseAmount * (numCallers + 1);

  return {
    type: 'single-raise',
    level: 2,
    question: 'total-pot',
    sb,
    bb,
    raiseAmount,
    numCallers,
    prompt: `$${sb}/$${bb} PLO. UTG raises pot to $${raiseAmount}. ${numCallers} player${numCallers > 1 ? 's' : ''} call${numCallers === 1 ? 's' : ''}. What is the total pot?`,
    answer: totalPot,
    positions: ['SB', 'BB', 'UTG', ...POSITIONS.slice(3, 3 + numCallers)],
    streetLabel: 'Preflop',
  };
}

// LEVEL 3: Flop Betting
function generateLevel3(blinds) {
  const { sb, bb } = pickRandom(blinds);
  // Simulate a preflop pot with some callers
  const numPreflopCallers = rand(2, 4);
  const preflopCallAmount = bb; // Limped pot for simplicity, or raised
  const isRaised = Math.random() < 0.5;

  let existingPot;
  if (isRaised) {
    const raiseAmount = preflopPotSizedRaise(sb, bb);
    const callers = rand(1, 3);
    existingPot = raiseAmount * (callers + 1);
  } else {
    existingPot = bb * numPreflopCallers;
  }

  // Bet on the flop: pot-sized, half-pot, or 2/3 pot
  const betType = pickRandom(['pot', 'half', 'twothirds']);
  let betAmount;
  if (betType === 'pot') betAmount = existingPot;
  else if (betType === 'half') betAmount = Math.round(existingPot / 2);
  else betAmount = Math.round((existingPot * 2) / 3);

  const answer = potSizedRaise(betAmount, existingPot);

  return {
    type: 'flop-bet',
    level: 3,
    question: 'max-raise',
    sb,
    bb,
    existingPot,
    betAmount,
    prompt: `Pot is $${existingPot} on the flop. Player bets $${betAmount}. What is the maximum pot-sized raise?`,
    answer,
    positions: ['SB', 'BB', 'UTG', 'BTN'],
    streetLabel: 'Flop',
  };
}

// LEVEL 4: Multi-Action Streets
function generateLevel4(blinds) {
  const { sb, bb } = pickRandom(blinds);
  const pot = sb + bb;

  // Preflop: raise and calls
  const raiseAmount = preflopPotSizedRaise(sb, bb);
  const preflopCallers = rand(1, 3);
  let runningPot = raiseAmount * (preflopCallers + 1);

  // Flop: bet and call(s)
  const flopBetRatio = pickRandom([1, 0.5, 2 / 3]);
  const flopBet = Math.round(runningPot * flopBetRatio);
  const flopCallers = rand(1, 2);
  const potAfterFlop = runningPot + flopBet * (flopCallers + 1);

  // Turn: bet
  const turnBetRatio = pickRandom([1, 0.5, 2 / 3]);
  const turnBet = Math.round(potAfterFlop * turnBetRatio);
  const turnAnswer = potSizedRaise(turnBet, potAfterFlop);

  const actions = [
    { type: 'blinds', sb, bb },
    { type: 'raise', player: 'UTG', amount: raiseAmount },
    ...Array(preflopCallers).fill(null).map((_, i) => ({ type: 'call', player: POSITIONS[4 + i] || 'Player', amount: raiseAmount })),
    { type: 'bet', player: 'UTG', amount: flopBet, street: 'Flop' },
    ...Array(flopCallers).fill(null).map((_, i) => ({ type: 'call', player: POSITIONS[4 + i] || 'Player', amount: flopBet })),
    { type: 'bet', player: 'UTG', amount: turnBet, street: 'Turn' },
  ];

  return {
    type: 'multi-street',
    level: 4,
    question: 'max-raise',
    sb,
    bb,
    existingPot: potAfterFlop,
    betAmount: turnBet,
    actions,
    prompt: `Preflop: UTG raises to $${raiseAmount}, ${preflopCallers} caller${preflopCallers > 1 ? 's' : ''} (pot: $${runningPot}). Flop: bet $${flopBet}, ${flopCallers} caller${flopCallers > 1 ? 's' : ''} (pot: $${potAfterFlop}). Turn: bet $${turnBet}. What is the max raise?`,
    answer: turnAnswer,
    positions: POSITIONS.slice(0, preflopCallers + 3),
    streetLabel: 'Turn',
  };
}

// LEVEL 5: Re-Raises and All-In
function generateLevel5(blinds) {
  const { sb, bb } = pickRandom(blinds);
  const isReRaise = Math.random() < 0.6;

  if (isReRaise) {
    // Pot exists, someone bets, someone raises, what's the re-raise?
    const numCallers = rand(2, 4);
    const existingPot = bb * numCallers * rand(2, 5);
    const firstBet = Math.round(existingPot * pickRandom([0.5, 2 / 3, 1]));
    const potAfterBet = existingPot + firstBet;
    const firstRaise = potSizedRaise(firstBet, existingPot);
    const potAfterRaise = existingPot + firstBet + firstRaise;
    const reRaiseAmount = potSizedRaise(firstRaise - firstBet, potAfterRaise);

    return {
      type: 'reraise',
      level: 5,
      question: 'reraise',
      sb,
      bb,
      existingPot,
      firstBet,
      firstRaise,
      prompt: `Pot is $${existingPot}. Player A bets $${firstBet}. Player B raises to $${firstRaise}. What is the maximum pot-sized re-raise for Player C?`,
      answer: reRaiseAmount,
      positions: ['A', 'B', 'C'],
      streetLabel: 'Action',
    };
  } else {
    // All-in validity check
    const existingPot = bb * rand(5, 20);
    const playerStack = Math.round(existingPot * pickRandom([0.3, 0.6, 0.9, 1.1, 1.5, 2.0]));
    const isValid = playerStack <= existingPot;

    return {
      type: 'allin-check',
      level: 5,
      question: 'allin-valid',
      sb,
      bb,
      existingPot,
      playerStack,
      prompt: `Pot is $${existingPot}. Player has $${playerStack} remaining. Can they go all-in? (The pot-sized bet is $${existingPot})`,
      answer: isValid ? 1 : 0,
      answerLabel: isValid ? 'Yes' : 'No',
      positions: ['Player'],
      streetLabel: 'All-In Check',
    };
  }
}

// LEVEL 6: Full Hand Speed Drill
function generateLevel6(blinds) {
  const { sb, bb } = pickRandom(blinds);
  const numPlayers = rand(3, 6);

  // Preflop
  const preflopRaise = preflopPotSizedRaise(sb, bb);
  const preflopCallers = rand(1, Math.min(numPlayers - 1, 3));
  let pot = preflopRaise * (preflopCallers + 1);

  // Flop
  const flopBet = Math.round(pot * pickRandom([0.5, 2 / 3, 1]));
  const flopCallers = rand(1, Math.min(preflopCallers, 2));
  pot = pot + flopBet * (flopCallers + 1);

  // Turn
  const turnBet = Math.round(pot * pickRandom([0.5, 2 / 3, 1]));
  const turnCallers = rand(1, Math.min(flopCallers, 2));
  pot = pot + turnBet * (turnCallers + 1);

  // River: what's the pot-sized bet?
  const riverAnswer = pot;

  return {
    type: 'full-hand',
    level: 6,
    question: 'river-pot',
    sb,
    bb,
    prompt: `$${sb}/$${bb}. Preflop: raise to $${preflopRaise}, ${preflopCallers} caller${preflopCallers > 1 ? 's' : ''}. Flop: bet $${flopBet}, ${flopCallers} caller${flopCallers > 1 ? 's' : ''}. Turn: bet $${turnBet}, ${turnCallers} caller${turnCallers > 1 ? 's' : ''}. What is the pot on the river?`,
    answer: riverAnswer,
    positions: POSITIONS.slice(0, numPlayers),
    streetLabel: 'River',
  };
}

// Generate a memorization drill question
export function generateMemorizationQuestion() {
  const potSizes = [10, 20, 30, 40, 50, 60, 80, 100, 150, 200];
  const potSize = pickRandom(potSizes);
  const drillType = pickRandom(['full', 'half', 'twothirds']);

  let betSize, correctMultiple, multipleLabel;
  if (drillType === 'full') {
    betSize = potSize;
    correctMultiple = 4;
    multipleLabel = '4×';
  } else if (drillType === 'half') {
    betSize = Math.round(potSize / 2);
    correctMultiple = 2.5;
    multipleLabel = '2.5×';
  } else {
    betSize = Math.round((potSize * 2) / 3);
    correctMultiple = 3;
    multipleLabel = '3×';
  }

  const raiseAmount = 3 * betSize + potSize;

  return {
    type: 'memorization',
    drillType,
    potSize,
    betSize,
    correctMultiple,
    multipleLabel,
    raiseAmount,
    prompt: `Pot is $${potSize}. Bet is $${betSize}. What multiple of the pot is the max raise?`,
    answer: correctMultiple,
    choices: shuffle([
      { value: 4, label: '4× the pot' },
      { value: 2.5, label: '2.5× the pot' },
      { value: 3, label: '3× the pot' },
      { value: 2, label: '2× the pot' },
    ]),
    scenario: { type: 'memorization', potSize, betSize, multiple: correctMultiple },
  };
}

// Main question generator
export function generateQuestion(level, blinds, streetLock = null) {
  const generators = {
    1: generateLevel1,
    2: generateLevel2,
    3: generateLevel3,
    4: generateLevel4,
    5: generateLevel5,
    6: generateLevel6,
  };

  const gen = generators[level] || generators[1];
  const question = gen(blinds);

  // Generate multiple choice options
  if (question.type === 'allin-check') {
    question.choices = [
      { value: 1, label: 'Yes - All-in is valid' },
      { value: 0, label: 'No - Stack exceeds pot-sized bet' },
    ];
  } else {
    const distractors = generateDistractors(question.answer, question);
    question.choices = shuffle([
      { value: question.answer, label: `$${question.answer}` },
      ...distractors.map(d => ({ value: d, label: `$${d}` })),
    ]);
  }

  return question;
}

// Generate a random level (for "All" mode)
export function generateRandomLevel(unlockedLevel, blinds) {
  const level = rand(1, unlockedLevel);
  return generateQuestion(level, blinds);
}
