/**
 * Dynamic Question Generator for PLO Dealer Math Trainer
 *
 * Rules:
 * - Every question states the FULL action sequence before asking for a number
 * - Position names are varied even when the math is identical
 * - Session deduplication is handled by GameBoard using questionSignature()
 * - Deeper levels chain raises (3-bet, 4-bet, pot-over-pot per street)
 */

import { potSizedRaise, preflopPot, preflopPotSizedRaise } from './potCalc.js';

// All 8 positions
const ALL_POSITIONS = ['UTG', 'UTG+1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const OPEN_POSITIONS  = ['UTG', 'UTG+1', 'MP', 'HJ', 'CO', 'BTN']; // can open-raise

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
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function fmt(n) { return `$${n}`; }

// A unique string for dedup — includes prompt framing (positions), not just the math
export function questionSignature(q) {
  return `${q.type}|${q.question}|${q.answer}|${q.sb}|${q.bb}|${(q.positions || []).join(',')}`;
}

// ─── Distractor generator ──────────────────────────────────────────────────
function generateDistractors(correctAnswer, scenario) {
  const distractors = new Set();
  const { type } = scenario;

  if (type === 'blinds-only' && scenario.question === 'raise') {
    const { sb, bb } = scenario;
    distractors.add(3 * bb);                  // forgot dead SB
    distractors.add(2 * bb + sb);             // used 2× instead of 3×
    distractors.add(3 * (sb + bb));           // multiplied full pot by 3
  } else if (type === 'blinds-only' && scenario.question === 'pot') {
    const { sb, bb } = scenario;
    distractors.add(bb);                      // forgot SB
    distractors.add(sb + bb + bb);            // added BB twice
    distractors.add(sb * 2 + bb);             // doubled SB
  } else if (type === 'single-raise') {
    const { raiseAmount, sb, numCallers } = scenario;
    distractors.add(raiseAmount * (numCallers + 1));           // forgot dead SB
    distractors.add(sb + raiseAmount * (numCallers + 2));      // counted SB as caller
    distractors.add(sb + bb + raiseAmount * (numCallers + 1)); // added both blinds as dead
  } else if (type === 'flop-bet' || type === 'multi-street') {
    const { existingPot, betAmount } = scenario;
    distractors.add(2 * betAmount + existingPot);              // used 2× not 3×
    distractors.add(3 * betAmount);                            // forgot the pot
    distractors.add(3 * (betAmount + existingPot));            // multiplied (bet+pot)
  } else if (type === 'reraise' || type === 'three-bet' || type === 'four-bet') {
    const correct = correctAnswer;
    distractors.add(Math.round(correct * 0.75));
    distractors.add(Math.round(correct * 1.33));
    distractors.add(Math.round(correct * 0.5));
  }

  const offsets = [-10, -5, 5, 10, -15, 15, -20, 20, -3, 3, -7, 7];
  for (const off of shuffle(offsets)) {
    if (distractors.size >= 3) break;
    const w = correctAnswer + off;
    if (w > 0 && w !== correctAnswer && !distractors.has(w)) distractors.add(w);
  }
  const pcts = [0.7, 0.85, 1.15, 1.3, 0.5, 1.5];
  for (const p of shuffle(pcts)) {
    if (distractors.size >= 3) break;
    const w = Math.round(correctAnswer * p);
    if (w > 0 && w !== correctAnswer && !distractors.has(w)) distractors.add(w);
  }
  return [...distractors].slice(0, 3);
}

// ─── LEVEL 1: Blinds Only ─────────────────────────────────────────────────
// Position is varied on every call so the same math feels like a new question
function generateLevel1(blinds) {
  const { sb, bb } = pickRandom(blinds);
  const questionType = Math.random() < 0.4 ? 'pot' : 'raise';
  // Pick a random open position so framing varies even with same blind level
  const raiserPos = pickRandom(OPEN_POSITIONS);

  if (questionType === 'pot') {
    return {
      type: 'blinds-only', level: 1, question: 'pot', sb, bb,
      prompt:
        `${fmt(sb)}/${fmt(bb)} PLO. SB posts ${fmt(sb)}, BB posts ${fmt(bb)}. ` +
        `${raiserPos} is about to act — no raises yet. ` +
        `What is the total pot right now?`,
      answer: preflopPot(sb, bb),
      positions: ['SB', 'BB', raiserPos],
      streetLabel: 'Preflop',
    };
  } else {
    const answer = preflopPotSizedRaise(sb, bb);
    return {
      type: 'blinds-only', level: 1, question: 'raise', sb, bb,
      prompt:
        `${fmt(sb)}/${fmt(bb)} PLO. SB posts ${fmt(sb)}, BB posts ${fmt(bb)}. ` +
        `Action folds around to ${raiserPos} — no raises yet. ` +
        `${raiserPos} wants to pot-raise. ` +
        `What is the total amount ${raiserPos} must put in?`,
      answer,
      positions: ['SB', 'BB', raiserPos],
      streetLabel: 'Preflop',
    };
  }
}

// ─── LEVEL 2: Open Raise + Callers ────────────────────────────────────────
function generateLevel2(blinds) {
  const { sb, bb } = pickRandom(blinds);
  const raiserPos  = pickRandom(OPEN_POSITIONS);
  const raiseAmount = preflopPotSizedRaise(sb, bb);

  // SB folds (dead), BB always calls, 0–2 more callers from random positions
  const extraCallers = rand(0, 2);
  const usedPos = new Set(['SB', 'BB', raiserPos]);
  const callerPool = ALL_POSITIONS.filter(p => !usedPos.has(p));
  const extraCallerPositions = shuffle(callerPool).slice(0, extraCallers);
  const numCallers = 1 + extraCallers; // BB + extras

  // Pot = dead SB + raiseAmount × (raiser + all callers)
  const totalPot = sb + raiseAmount * (numCallers + 1);

  const callerText = extraCallers === 0
    ? `Only BB calls.`
    : `BB calls. ${extraCallerPositions.join(' and ')} also call${extraCallers === 1 ? 's' : ''}.`;

  return {
    type: 'single-raise', level: 2, question: 'total-pot',
    sb, bb, raiseAmount, numCallers, extraCallers,
    prompt:
      `${fmt(sb)}/${fmt(bb)} PLO. SB posts ${fmt(sb)}, BB posts ${fmt(bb)}. ` +
      `Action folds to ${raiserPos}, who pot-raises to ${fmt(raiseAmount)}. ` +
      `SB folds — ${fmt(sb)} stays as dead money. ${callerText} ` +
      `What is the total pot going to the flop?`,
    answer: totalPot,
    positions: ['SB', 'BB', raiserPos, ...extraCallerPositions],
    streetLabel: 'Preflop',
  };
}

// ─── LEVEL 3: Flop Bet Over a Built Pot ───────────────────────────────────
function generateLevel3(blinds) {
  const { sb, bb } = pickRandom(blinds);
  const raiserPos  = pickRandom(OPEN_POSITIONS);
  const raiseAmount = preflopPotSizedRaise(sb, bb);
  const preflopCallers = rand(1, 3);
  const preflopPotTotal = sb + raiseAmount * (preflopCallers + 1);

  // Flop bettor is a random position still in the hand
  const usedPos = new Set(['SB', raiserPos]);
  const activePlayers = ['BB', ...ALL_POSITIONS.filter(p => !usedPos.has(p))].slice(0, preflopCallers + 1);
  const bettor = pickRandom(activePlayers);

  const betType = pickRandom(['pot', 'half', 'twothirds']);
  let betAmount, betLabel;
  if (betType === 'pot')        { betAmount = preflopPotTotal;                          betLabel = 'pot-sized'; }
  else if (betType === 'half')  { betAmount = Math.round(preflopPotTotal / 2);          betLabel = 'half-pot'; }
  else                          { betAmount = Math.round((preflopPotTotal * 2) / 3);    betLabel = 'two-thirds pot'; }

  const answer = potSizedRaise(betAmount, preflopPotTotal);
  const callerText = preflopCallers === 1 ? 'BB calls' : `BB and ${preflopCallers - 1} other${preflopCallers > 2 ? 's' : ''} call`;

  return {
    type: 'flop-bet', level: 3, question: 'max-raise',
    sb, bb, existingPot: preflopPotTotal, betAmount,
    prompt:
      `${fmt(sb)}/${fmt(bb)} PLO. Preflop: ${raiserPos} raises to ${fmt(raiseAmount)}, SB folds, ${callerText}. ` +
      `Pot to flop: ${fmt(preflopPotTotal)}. ` +
      `On the flop, ${bettor} bets ${fmt(betAmount)} (${betLabel}). ` +
      `What is the maximum pot-sized raise?`,
    answer,
    positions: activePlayers,
    streetLabel: 'Flop',
  };
}

// ─── LEVEL 4: Multi-Street Pot Tracking ───────────────────────────────────
function generateLevel4(blinds) {
  const { sb, bb } = pickRandom(blinds);
  const raiserPos = pickRandom(OPEN_POSITIONS);
  const raiseAmount = preflopPotSizedRaise(sb, bb);
  const preflopCallers = rand(1, 2);
  const preflopPotTotal = sb + raiseAmount * (preflopCallers + 1);

  // Pick bettors for flop and turn from active players
  const usedPos = new Set(['SB', raiserPos]);
  const active = ['BB', ...ALL_POSITIONS.filter(p => !usedPos.has(p))].slice(0, preflopCallers + 1);
  const flopBettor = pickRandom(active);
  const turnBettor = pickRandom(active);

  const flopRatio = pickRandom([1, 0.5, 2/3]);
  const flopBet   = Math.round(preflopPotTotal * flopRatio);
  const flopLabel = flopRatio === 1 ? 'pot' : flopRatio === 0.5 ? 'half-pot' : '2/3-pot';
  const potAfterFlop = preflopPotTotal + flopBet * 2; // bet + 1 caller

  const turnRatio = pickRandom([1, 0.5, 2/3]);
  const turnBet   = Math.round(potAfterFlop * turnRatio);
  const turnLabel = turnRatio === 1 ? 'pot' : turnRatio === 0.5 ? 'half-pot' : '2/3-pot';
  const answer    = potSizedRaise(turnBet, potAfterFlop);

  const preflopCallerText = preflopCallers === 1 ? 'BB calls' : 'BB and one other call';

  return {
    type: 'multi-street', level: 4, question: 'max-raise',
    sb, bb, existingPot: potAfterFlop, betAmount: turnBet,
    prompt:
      `${fmt(sb)}/${fmt(bb)} PLO. ` +
      `Preflop: ${raiserPos} raises to ${fmt(raiseAmount)}, SB folds, ${preflopCallerText}. Pot: ${fmt(preflopPotTotal)}. ` +
      `Flop: ${flopBettor} bets ${fmt(flopBet)} (${flopLabel}), one call. Pot: ${fmt(potAfterFlop)}. ` +
      `Turn: ${turnBettor} bets ${fmt(turnBet)} (${turnLabel}). ` +
      `What is the maximum pot-sized raise?`,
    answer,
    positions: active,
    streetLabel: 'Turn',
  };
}

// ─── LEVEL 5: 3-Bets, Re-Raises, All-In ──────────────────────────────────
function generateLevel5(blinds) {
  const { sb, bb } = pickRandom(blinds);
  const scenario = pickRandom(['3bet', 'reraise-flop', 'allin']);

  if (scenario === '3bet') {
    // Preflop 3-bet
    const raiserPos  = pickRandom(['UTG', 'UTG+1', 'MP', 'HJ', 'CO']);
    const threeBetPos = pickRandom(['HJ', 'CO', 'BTN', 'SB', 'BB'].filter(p => p !== raiserPos));
    const openRaise  = preflopPotSizedRaise(sb, bb);
    // Pot after open (SB/BB fold): all dead money + open
    const potAfterOpen = sb + bb + openRaise; // both blinds dead if 3-bettor is not SB/BB
    // 3-bet = potSizedRaise(openRaise, pot_before_open) = 3×open + (sb+bb)
    const threeBet   = potSizedRaise(openRaise, sb + bb);
    return {
      type: 'three-bet', level: 5, question: 'three-bet',
      sb, bb, openRaise, potAfterOpen, threeBet,
      prompt:
        `${fmt(sb)}/${fmt(bb)} PLO. SB posts ${fmt(sb)}, BB posts ${fmt(bb)}. ` +
        `Action folds to ${raiserPos} who open-raises to ${fmt(openRaise)}. ` +
        `Action folds to ${threeBetPos}. ` +
        `${threeBetPos} wants to make a pot-sized 3-bet. ` +
        `Pot before ${raiserPos}'s raise was ${fmt(sb + bb)}. ` +
        `What is the total amount ${threeBetPos} must put in?`,
      answer: threeBet,
      positions: ['SB', 'BB', raiserPos, threeBetPos],
      streetLabel: 'Preflop 3-Bet',
    };
  }

  if (scenario === 'reraise-flop') {
    // Flop raise then re-raise
    const numCallers  = rand(2, 4);
    const openRaiseP  = preflopPotSizedRaise(sb, bb);
    const existingPot = sb + openRaiseP * (numCallers + 1);

    const posPool  = shuffle(OPEN_POSITIONS);
    const bettorA  = posPool[0];
    const raisorB  = posPool[1];
    const raisorC  = posPool[2];

    const firstBet   = Math.round(existingPot * pickRandom([0.5, 2/3, 1]));
    const betLabel   = firstBet === existingPot ? 'pot' : firstBet === Math.round(existingPot/2) ? 'half-pot' : '2/3-pot';
    const firstRaise = potSizedRaise(firstBet, existingPot);
    const potAfterARaises = existingPot + firstBet + firstRaise; // B's total in pot
    // C re-raises: faces firstRaise, pot before B moved = existingPot + firstBet
    const reRaise    = potSizedRaise(firstRaise, existingPot + firstBet);

    return {
      type: 'reraise', level: 5, question: 'reraise',
      sb, bb, existingPot, firstBet, firstRaise, potAfterRaise: potAfterARaises,
      prompt:
        `Pot on the flop is ${fmt(existingPot)}. ` +
        `${bettorA} bets ${fmt(firstBet)} (${betLabel}). ` +
        `${raisorB} raises to ${fmt(firstRaise)} (pot-raise over ${bettorA}'s bet). ` +
        `Pot is now ${fmt(potAfterARaises)}. ` +
        `${raisorC} has not yet acted. ` +
        `What is the maximum pot-sized re-raise ${raisorC} can make?`,
      answer: reRaise,
      positions: [bettorA, raisorB, raisorC],
      streetLabel: 'Flop Re-Raise',
    };
  }

  // All-in check
  const existingPot  = bb * rand(5, 20);
  const multiplier   = pickRandom([0.3, 0.6, 0.9, 1.1, 1.5, 2.0]);
  const playerStack  = Math.round(existingPot * multiplier);
  const isValid      = playerStack <= existingPot;
  const checkPos     = pickRandom(OPEN_POSITIONS);

  return {
    type: 'allin-check', level: 5, question: 'allin-valid',
    sb, bb, existingPot, playerStack,
    prompt:
      `Pot is ${fmt(existingPot)}. A pot-sized bet would be ${fmt(existingPot)}. ` +
      `${checkPos} has ${fmt(playerStack)} remaining. ` +
      `In PLO, a player can only go all-in if their stack does not exceed the pot-sized bet. ` +
      `Can ${checkPos} go all-in?`,
    answer: isValid ? 1 : 0,
    answerLabel: isValid ? 'Yes — stack is within pot-sized bet' : 'No — stack exceeds pot-sized bet',
    positions: [checkPos],
    streetLabel: 'All-In Check',
  };
}

// ─── LEVEL 6: Full Hand — Pot Over Pot Over Pot ───────────────────────────
// Chains pot-sized bets across all four streets to build a final river pot
function generateLevel6(blinds) {
  const { sb, bb } = pickRandom(blinds);
  const numPlayers = rand(3, 5);
  const posPool    = shuffle([...OPEN_POSITIONS]).slice(0, numPlayers);
  const raiser     = posPool[0];

  // ── Preflop ──
  const openRaise      = preflopPotSizedRaise(sb, bb);
  const preflopCallers = rand(1, Math.min(numPlayers - 2, 3));
  let pot              = sb + openRaise * (preflopCallers + 1);
  const potPreflop     = pot;

  // ── Flop ──
  const flopRatio  = pickRandom([0.5, 2/3, 1]);
  const flopBet    = Math.round(pot * flopRatio);
  const flopLabel  = flopRatio === 1 ? 'pot' : flopRatio === 0.5 ? 'half-pot' : '2/3-pot';
  const flopCaller = pickRandom(posPool.filter(p => p !== raiser));
  pot              = pot + flopBet * 2; // bet + 1 call
  const potFlop    = pot;

  // ── Turn ──
  const turnRatio  = pickRandom([0.5, 2/3, 1]);
  const turnBet    = Math.round(pot * turnRatio);
  const turnLabel  = turnRatio === 1 ? 'pot' : turnRatio === 0.5 ? 'half-pot' : '2/3-pot';
  pot              = pot + turnBet * 2;
  const potTurn    = pot;

  // ── River: what's the max bet / pot? ──
  const riverPot   = pot;
  // Ask either "what is the river pot" or "what is the max bet on the river"
  const askMaxBet  = Math.random() < 0.5;
  const answer     = riverPot; // pot-sized bet on river = the river pot itself

  const preflopText = `SB folds, ${preflopCallers} player${preflopCallers > 1 ? 's' : ''} call${preflopCallers === 1 ? 's' : ''}`;

  return {
    type: 'full-hand', level: 6, question: 'river-pot',
    sb, bb, existingPot: riverPot, betAmount: riverPot,
    prompt:
      `${fmt(sb)}/${fmt(bb)} PLO — track the pot: ` +
      `Preflop: ${raiser} raises to ${fmt(openRaise)}, ${preflopText} → pot ${fmt(potPreflop)}. ` +
      `Flop: ${raiser} bets ${fmt(flopBet)} (${flopLabel}), ${flopCaller} calls → pot ${fmt(potFlop)}. ` +
      `Turn: ${raiser} bets ${fmt(turnBet)} (${turnLabel}), one call → pot ${fmt(potTurn)}. ` +
      `${askMaxBet
        ? `${raiser} wants to bet pot on the river. What is the maximum bet?`
        : `What is the total pot on the river?`}`,
    answer,
    positions: posPool,
    streetLabel: 'River',
  };
}

// ─── Memorization Drill ────────────────────────────────────────────────────
export function generateMemorizationQuestion() {
  const potSizes = [10, 20, 30, 40, 50, 60, 80, 100, 150, 200];
  const potSize  = pickRandom(potSizes);
  const drillType = pickRandom(['full', 'half', 'twothirds']);
  const bettor   = pickRandom(OPEN_POSITIONS);

  let betSize, correctMultiple, multipleLabel;
  if (drillType === 'full')       { betSize = potSize;                        correctMultiple = 4;   multipleLabel = '4×'; }
  else if (drillType === 'half')  { betSize = Math.round(potSize / 2);        correctMultiple = 2.5; multipleLabel = '2.5×'; }
  else                            { betSize = Math.round((potSize * 2) / 3);  correctMultiple = 3;   multipleLabel = '3×'; }

  const raiseAmount = 3 * betSize + potSize;

  return {
    type: 'memorization', drillType, potSize, betSize,
    correctMultiple, multipleLabel, raiseAmount,
    prompt: `Pot is ${fmt(potSize)}. ${bettor} bets ${fmt(betSize)}. What multiple of the pot is the max raise?`,
    answer: correctMultiple,
    choices: shuffle([
      { value: 4,   label: '4× the pot' },
      { value: 2.5, label: '2.5× the pot' },
      { value: 3,   label: '3× the pot' },
      { value: 2,   label: '2× the pot' },
    ]),
    scenario: { type: 'memorization', potSize, betSize, multiple: correctMultiple },
  };
}

// ─── Main Exports ──────────────────────────────────────────────────────────
export function generateQuestion(level, blinds) {
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
