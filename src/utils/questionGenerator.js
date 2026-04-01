/**
 * Dynamic Question Generator for PLO Dealer Math Trainer
 * Every question explicitly states the full action sequence before asking for a number.
 * No question should be answerable without the context provided in the prompt.
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

function fmt(n) { return `$${n}`; }

// Generate plausible wrong answers using common dealer mistakes
function generateDistractors(correctAnswer, scenario) {
  const distractors = new Set();
  const { type } = scenario;

  if (type === 'blinds-only' && scenario.question === 'raise') {
    const { sb, bb } = scenario;
    // Mistake: forgot the dead SB, just did 3×BB
    distractors.add(3 * bb);
    // Mistake: used 2× instead of 3×
    distractors.add(2 * bb + sb);
    // Mistake: multiplied the starting pot by 3
    distractors.add(3 * (sb + bb));
  } else if (type === 'single-raise') {
    const { raiseAmount, sb, numCallers } = scenario;
    // Mistake: forgot the dead SB money
    distractors.add(raiseAmount * (numCallers + 1));
    // Mistake: included the blinds again instead of using dead money
    distractors.add(raiseAmount * (numCallers + 1) + raiseAmount);
    // Mistake: subtracted instead of adding dead money
    distractors.add(Math.max(1, sb + raiseAmount * (numCallers + 1) - sb * 2));
  } else if (type === 'flop-bet') {
    const { existingPot, betAmount } = scenario;
    // Mistake: used 2× instead of 3×
    distractors.add(2 * betAmount + existingPot);
    // Mistake: forgot to add the pot
    distractors.add(3 * betAmount);
    // Mistake: (bet + pot) × 3
    distractors.add(3 * (betAmount + existingPot));
  } else if (type === 'reraise') {
    const { existingPot, firstBet, firstRaise } = scenario;
    // Mistake: applied 3× to firstBet instead of firstRaise
    distractors.add(potSizedRaise(firstBet, existingPot + firstBet));
    // Mistake: used pot before A's bet
    distractors.add(potSizedRaise(firstRaise, existingPot));
    // Mistake: used 2× on firstRaise
    distractors.add(2 * firstRaise + (existingPot + firstBet));
  }

  // Fill remaining with close-but-wrong values
  const offsets = [-10, -5, 5, 10, -15, 15, -20, 20, -3, 3, -7, 7];
  for (const off of shuffle(offsets)) {
    if (distractors.size >= 3) break;
    const wrong = correctAnswer + off;
    if (wrong > 0 && wrong !== correctAnswer && !distractors.has(wrong)) {
      distractors.add(wrong);
    }
  }

  // Fallback: percentage-based
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

// ─── LEVEL 1: Blinds Only ──────────────────────────────────────────────────
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
      prompt:
        `${fmt(sb)}/${fmt(bb)} PLO. ` +
        `SB posts ${fmt(sb)}, BB posts ${fmt(bb)}. ` +
        `No other action yet. ` +
        `What is the total pot before anyone acts?`,
      answer: preflopPot(sb, bb),
      positions: ['SB', 'BB'],
      streetLabel: 'Preflop',
    };
  } else {
    const answer = preflopPotSizedRaise(sb, bb);
    // Verify: call BB ($bb) → pot = sb+bb+bb = sb+2bb, raise by that pot → total = bb + (sb+2bb) = sb+3bb = 3bb+sb ✓
    return {
      type: 'blinds-only',
      level: 1,
      question: 'raise',
      sb,
      bb,
      prompt:
        `${fmt(sb)}/${fmt(bb)} PLO. ` +
        `SB posts ${fmt(sb)}, BB posts ${fmt(bb)}. ` +
        `Action folds to UTG — no raises yet. ` +
        `UTG wants to make a pot-sized raise. ` +
        `What is the total amount UTG must put in?`,
      answer,
      positions: ['SB', 'BB', 'UTG'],
      streetLabel: 'Preflop',
    };
  }
}

// ─── LEVEL 2: Single Preflop Raise + Callers ──────────────────────────────
function generateLevel2(blinds) {
  const { sb, bb } = pickRandom(blinds);
  const raiseAmount = preflopPotSizedRaise(sb, bb);

  // SB folds (dead money), BB always calls, 0–2 extra callers
  const extraCallers = rand(0, 2);
  const callerPositions = ['BB', ...POSITIONS.slice(3, 3 + extraCallers)];
  const numCallers = callerPositions.length; // BB + extras

  // Pot = dead SB + raiseAmount × (UTG raiser + all callers)
  const totalPot = sb + raiseAmount * (numCallers + 1);

  const callerText = extraCallers === 0
    ? 'Only the BB calls.'
    : `The BB calls. ${extraCallers} more player${extraCallers > 1 ? 's' : ''} call${extraCallers === 1 ? 's' : ''}.`;

  return {
    type: 'single-raise',
    level: 2,
    question: 'total-pot',
    sb,
    bb,
    raiseAmount,
    numCallers,
    extraCallers,
    prompt:
      `${fmt(sb)}/${fmt(bb)} PLO. ` +
      `SB posts ${fmt(sb)}, BB posts ${fmt(bb)}. ` +
      `UTG raises to ${fmt(raiseAmount)}. ` +
      `SB folds (${fmt(sb)} stays in pot). ` +
      `${callerText} ` +
      `What is the total pot going to the flop?`,
    answer: totalPot,
    positions: ['SB', 'BB', 'UTG', ...POSITIONS.slice(3, 3 + extraCallers)],
    streetLabel: 'Preflop',
  };
}

// ─── LEVEL 3: Flop Betting ────────────────────────────────────────────────
function generateLevel3(blinds) {
  const { sb, bb } = pickRandom(blinds);

  // Build a clean preflop pot with explicit accounting
  const raiseAmount = preflopPotSizedRaise(sb, bb);
  const preflopCallers = rand(1, 3); // BB + extras (all call)
  // Pot = dead SB + raiseAmount × (UTG + callers)
  const preflopPotTotal = sb + raiseAmount * (preflopCallers + 1);

  // Flop bet
  const betType = pickRandom(['pot', 'half', 'twothirds']);
  let betAmount;
  let betLabel;
  if (betType === 'pot') {
    betAmount = preflopPotTotal;
    betLabel = 'pot';
  } else if (betType === 'half') {
    betAmount = Math.round(preflopPotTotal / 2);
    betLabel = 'half-pot';
  } else {
    betAmount = Math.round((preflopPotTotal * 2) / 3);
    betLabel = 'two-thirds pot';
  }

  const answer = potSizedRaise(betAmount, preflopPotTotal);

  const callerText = preflopCallers === 1
    ? 'BB calls'
    : `BB and ${preflopCallers - 1} other${preflopCallers > 2 ? 's' : ''} call`;

  return {
    type: 'flop-bet',
    level: 3,
    question: 'max-raise',
    sb,
    bb,
    existingPot: preflopPotTotal,
    betAmount,
    prompt:
      `${fmt(sb)}/${fmt(bb)} PLO. ` +
      `Preflop: UTG raises to ${fmt(raiseAmount)}, SB folds, ${callerText}. ` +
      `Pot going to flop: ${fmt(preflopPotTotal)}. ` +
      `On the flop, UTG bets ${fmt(betAmount)} (${betLabel}). ` +
      `What is the maximum pot-sized raise on this bet?`,
    answer,
    positions: ['SB', 'BB', 'UTG', ...POSITIONS.slice(3, 3 + preflopCallers - 1)],
    streetLabel: 'Flop',
  };
}

// ─── LEVEL 4: Multi-Action Streets ────────────────────────────────────────
function generateLevel4(blinds) {
  const { sb, bb } = pickRandom(blinds);

  // Preflop
  const raiseAmount = preflopPotSizedRaise(sb, bb);
  const preflopCallers = rand(1, 2);
  const preflopPotTotal = sb + raiseAmount * (preflopCallers + 1);

  // Flop: bet and single caller
  const flopBetRatio = pickRandom([1, 0.5, 2 / 3]);
  const flopBet = Math.round(preflopPotTotal * flopBetRatio);
  const flopLabel = flopBetRatio === 1 ? 'pot' : flopBetRatio === 0.5 ? 'half-pot' : '2/3-pot';
  const potAfterFlop = preflopPotTotal + flopBet * 2; // bet + 1 caller

  // Turn: ask for the max raise on a given bet
  const turnBetRatio = pickRandom([1, 0.5, 2 / 3]);
  const turnBet = Math.round(potAfterFlop * turnBetRatio);
  const turnLabel = turnBetRatio === 1 ? 'pot' : turnBetRatio === 0.5 ? 'half-pot' : '2/3-pot';
  const turnAnswer = potSizedRaise(turnBet, potAfterFlop);

  const preflopCallerText = preflopCallers === 1
    ? 'BB calls'
    : `BB and one other call`;

  return {
    type: 'multi-street',
    level: 4,
    question: 'max-raise',
    sb,
    bb,
    existingPot: potAfterFlop,
    betAmount: turnBet,
    prompt:
      `${fmt(sb)}/${fmt(bb)} PLO. ` +
      `Preflop: UTG raises to ${fmt(raiseAmount)}, SB folds, ${preflopCallerText}. Pot: ${fmt(preflopPotTotal)}. ` +
      `Flop: UTG bets ${fmt(flopBet)} (${flopLabel}), one player calls. Pot: ${fmt(potAfterFlop)}. ` +
      `Turn: UTG bets ${fmt(turnBet)} (${turnLabel}). ` +
      `What is the maximum pot-sized raise on this bet?`,
    answer: turnAnswer,
    positions: POSITIONS.slice(0, preflopCallers + 2),
    streetLabel: 'Turn',
  };
}

// ─── LEVEL 5: Re-Raises and All-In ────────────────────────────────────────
function generateLevel5(blinds) {
  const { sb, bb } = pickRandom(blinds);
  const isReRaise = Math.random() < 0.6;

  if (isReRaise) {
    // Build pot from a clean multi-caller preflop
    const callers = rand(2, 4);
    const raisePreflop = preflopPotSizedRaise(sb, bb);
    const existingPot = sb + raisePreflop * (callers + 1); // a realistic pot

    // A bets into that pot
    const firstBet = Math.round(existingPot * pickRandom([0.5, 2 / 3, 1]));
    const betLabel = firstBet === existingPot ? 'pot' : firstBet === Math.round(existingPot / 2) ? 'half-pot' : '2/3-pot';

    // B pot-raises over A's bet
    // firstRaise = total B puts in = 3 × firstBet + existingPot
    const firstRaise = potSizedRaise(firstBet, existingPot);

    // Pot after A bets and B raises:
    // = existingPot + firstBet (A's bet) + firstRaise (B's total)
    const potAfterRaise = existingPot + firstBet + firstRaise;

    // C re-raises. C faces firstRaise total to call.
    // Pot before B's raise = existingPot + firstBet (after A bet)
    // Re-raise = 3 × firstRaise + (existingPot + firstBet)
    const reRaiseAmount = potSizedRaise(firstRaise, existingPot + firstBet);

    return {
      type: 'reraise',
      level: 5,
      question: 'reraise',
      sb,
      bb,
      existingPot,
      firstBet,
      firstRaise,
      potAfterRaise,
      prompt:
        `The pot is ${fmt(existingPot)}. ` +
        `Player A bets ${fmt(firstBet)} (${betLabel}). ` +
        `Player B raises to ${fmt(firstRaise)} (pot-sized raise over A's bet). ` +
        `Pot after B raises: ${fmt(potAfterRaise)}. ` +
        `Player C has not yet acted. ` +
        `What is the maximum pot-sized re-raise Player C can make?`,
      answer: reRaiseAmount,
      positions: ['A', 'B', 'C'],
      streetLabel: 'Re-Raise',
    };
  } else {
    // All-in validity check
    const existingPot = bb * rand(5, 20);
    const multiplier = pickRandom([0.3, 0.6, 0.9, 1.1, 1.5, 2.0]);
    const playerStack = Math.round(existingPot * multiplier);
    const isValid = playerStack <= existingPot;

    return {
      type: 'allin-check',
      level: 5,
      question: 'allin-valid',
      sb,
      bb,
      existingPot,
      playerStack,
      prompt:
        `The pot is ${fmt(existingPot)}. ` +
        `A pot-sized bet would be ${fmt(existingPot)}. ` +
        `Player has ${fmt(playerStack)} remaining in their stack. ` +
        `In PLO a player can only go all-in if their stack does not exceed the pot-sized bet. ` +
        `Is this all-in valid?`,
      answer: isValid ? 1 : 0,
      answerLabel: isValid ? 'Yes — stack is within pot-sized bet' : 'No — stack exceeds pot-sized bet',
      positions: ['Player'],
      streetLabel: 'All-In Check',
    };
  }
}

// ─── LEVEL 6: Full Hand Speed Drill ───────────────────────────────────────
function generateLevel6(blinds) {
  const { sb, bb } = pickRandom(blinds);
  const numPlayers = rand(3, 5);

  // Preflop
  const preflopRaise = preflopPotSizedRaise(sb, bb);
  const preflopCallers = rand(1, Math.min(numPlayers - 2, 3));
  let pot = sb + preflopRaise * (preflopCallers + 1);
  const preflopPotSnapshot = pot;

  // Flop: bet + 1 caller
  const flopBetRatio = pickRandom([0.5, 2 / 3, 1]);
  const flopBet = Math.round(pot * flopBetRatio);
  pot = pot + flopBet * 2;
  const flopPotSnapshot = pot;

  // Turn: bet + 1 caller
  const turnBetRatio = pickRandom([0.5, 2 / 3, 1]);
  const turnBet = Math.round(pot * turnBetRatio);
  pot = pot + turnBet * 2;

  const riverPot = pot;

  const preflopText = `SB folds, ${preflopCallers} player${preflopCallers > 1 ? 's' : ''} call${preflopCallers === 1 ? 's' : ''}`;
  const flopRatioLabel = flopBetRatio === 1 ? 'pot' : flopBetRatio === 0.5 ? 'half-pot' : '2/3-pot';
  const turnRatioLabel = turnBetRatio === 1 ? 'pot' : turnBetRatio === 0.5 ? 'half-pot' : '2/3-pot';

  return {
    type: 'full-hand',
    level: 6,
    question: 'river-pot',
    sb,
    bb,
    prompt:
      `${fmt(sb)}/${fmt(bb)} PLO — track the pot through each street: ` +
      `Preflop: UTG raises to ${fmt(preflopRaise)}, ${preflopText} → pot ${fmt(preflopPotSnapshot)}. ` +
      `Flop: bet ${fmt(flopBet)} (${flopRatioLabel}), 1 caller → pot ${fmt(flopPotSnapshot)}. ` +
      `Turn: bet ${fmt(turnBet)} (${turnRatioLabel}), 1 caller. ` +
      `What is the total pot on the river?`,
    answer: riverPot,
    positions: POSITIONS.slice(0, numPlayers),
    streetLabel: 'River',
  };
}

// ─── Memorization Drill ────────────────────────────────────────────────────
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
    prompt: `Pot is ${fmt(potSize)}. A player bets ${fmt(betSize)}. What is the multiple of the pot for the max raise?`,
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

// ─── Main Exports ──────────────────────────────────────────────────────────
export function generateQuestion(level, blinds) {
  const generators = { 1: generateLevel1, 2: generateLevel2, 3: generateLevel3, 4: generateLevel4, 5: generateLevel5, 6: generateLevel6 };
  const gen = generators[level] || generators[1];
  const question = gen(blinds);

  if (question.type === 'allin-check') {
    question.choices = [
      { value: 1, label: 'Yes — all-in is valid' },
      { value: 0, label: 'No — stack exceeds pot-sized bet' },
    ];
  } else {
    const distractors = generateDistractors(question.answer, question);
    question.choices = shuffle([
      { value: question.answer, label: fmt(question.answer) },
      ...distractors.map(d => ({ value: d, label: fmt(d) })),
    ]);
  }

  return question;
}

export function generateRandomLevel(unlockedLevel, blinds) {
  const level = rand(1, unlockedLevel);
  return generateQuestion(level, blinds);
}
