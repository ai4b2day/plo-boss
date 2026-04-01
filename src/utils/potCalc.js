/**
 * PLO Pot Calculation Engine
 *
 * Core rule: Pot-sized raise = (3 × current bet) + existing pot
 * This works because: you call the bet (1×), then raise the total pot (which is
 * original pot + your call + their bet = pot + 2×bet), so total = bet + pot + 2×bet = 3×bet + pot
 */

// Calculate the maximum pot-sized raise given a bet and existing pot
export function potSizedRaise(currentBet, existingPot) {
  return 3 * currentBet + existingPot;
}

// Calculate preflop pot (SB + BB)
export function preflopPot(sb, bb) {
  return sb + bb;
}

// Calculate pot-sized raise preflop (first to act)
// First player calls BB, then raises the new pot
// New pot after call = SB + BB + BB = SB + 2×BB
// Raise = new pot = SB + 2×BB, total put in = BB (call) + SB + 2×BB = SB + 3×BB
// Using the formula: 3×BB + SB + BB = 3×BB + SB + BB
export function preflopPotSizedRaise(sb, bb) {
  return 3 * bb + sb + bb;
}

// Calculate pot after a bet is called
// When someone bets and another calls: pot grows by 2 × bet
export function potAfterBetAndCall(existingPot, betAmount) {
  return existingPot + 2 * betAmount;
}

// Calculate pot after multiple callers of a bet
export function potAfterMultipleCallers(existingPot, betAmount, numCallers) {
  return existingPot + betAmount * (numCallers + 1); // +1 for the original bettor
}

// Calculate a re-raise (raise on top of a raise)
// The "current bet" for the re-raiser is the raise amount (the increment)
// existing pot includes all prior action
export function potSizedReRaise(previousRaiseAmount, potBeforeReRaise) {
  return 3 * previousRaiseAmount + potBeforeReRaise;
}

// Check if an all-in is valid (stack must be ≤ pot-sized bet)
export function isAllInValid(playerStack, potSizedBetAmount) {
  return playerStack <= potSizedBetAmount;
}

// Get the multiplier name for a bet size relative to pot
export function getBetMultiplierInfo(betSize, potSize) {
  const ratio = betSize / potSize;
  if (Math.abs(ratio - 1) < 0.01) return { ratio: 1, label: 'Pot', raiseMult: 4 };
  if (Math.abs(ratio - 0.5) < 0.01) return { ratio: 0.5, label: 'Half-Pot', raiseMult: 2.5 };
  if (Math.abs(ratio - 2 / 3) < 0.05) return { ratio: 2 / 3, label: 'Two-Thirds Pot', raiseMult: 3 };
  return { ratio, label: 'Custom', raiseMult: (3 * ratio + 1) };
}

// Core multiples that dealers must memorize
export const CORE_MULTIPLES = [
  {
    id: 'pot-full',
    label: 'Full Pot Bet',
    description: 'Pot-sized bet → raise is always 4× the bet',
    betRatio: 1,
    raiseMultiple: 4,
    formula: '3 × bet + pot = 3 × pot + pot = 4 × pot',
  },
  {
    id: 'pot-half',
    label: 'Half Pot Bet',
    description: 'Half-pot bet → raise is 2.5× the pot',
    betRatio: 0.5,
    raiseMultiple: 2.5,
    formula: '3 × (pot/2) + pot = 1.5×pot + pot = 2.5 × pot',
  },
  {
    id: 'pot-twothirds',
    label: 'Two-Thirds Pot Bet',
    description: 'Two-thirds pot bet → raise is ~3× the pot',
    betRatio: 2 / 3,
    raiseMultiple: 3,
    formula: '3 × (2pot/3) + pot = 2×pot + pot = 3 × pot',
  },
];

// Generate step-by-step breakdown for a pot-sized raise calculation
export function generateBreakdown(scenario) {
  const steps = [];
  const { type } = scenario;

  if (type === 'blinds-only') {
    const { sb, bb } = scenario;
    steps.push({ text: `Small Blind = $${sb}`, value: sb });
    steps.push({ text: `Big Blind = $${bb}`, value: bb });
    if (scenario.question === 'pot') {
      steps.push({ text: `Starting Pot = SB + BB = $${sb} + $${bb}`, value: sb + bb });
      steps.push({ text: `Answer: $${sb + bb}`, value: sb + bb, final: true });
    } else {
      const pot = sb + bb;
      steps.push({ text: `Starting Pot = $${sb} + $${bb} = $${pot}`, value: pot });
      steps.push({ text: `Pot-sized raise = (3 × BB) + SB + BB`, value: null });
      steps.push({ text: `= (3 × $${bb}) + $${sb} + $${bb}`, value: null });
      const answer = 3 * bb + sb + bb;
      steps.push({ text: `= $${3 * bb} + $${sb + bb} = $${answer}`, value: answer, final: true });
    }
  } else if (type === 'single-raise') {
    const { sb, bb, raiseAmount, numCallers } = scenario;
    const pot = sb + bb;
    steps.push({ text: `Blinds: $${sb}/$${bb} → Starting pot = $${pot}`, value: pot });
    steps.push({ text: `Raise to $${raiseAmount}`, value: raiseAmount });
    const totalCallers = numCallers || 2;
    const totalPot = raiseAmount * (totalCallers + 1) + (pot - sb - bb);
    // Actually: SB and BB are already in the pot. Raiser puts in raiseAmount.
    // Callers each put in raiseAmount. SB completes to raiseAmount, BB completes to raiseAmount.
    const finalPot = raiseAmount * (totalCallers + 1);
    steps.push({ text: `${totalCallers + 1} players each put in $${raiseAmount}`, value: null });
    steps.push({ text: `Total pot = ${totalCallers + 1} × $${raiseAmount} = $${finalPot}`, value: finalPot, final: true });
  } else if (type === 'flop-bet') {
    const { existingPot, betAmount } = scenario;
    steps.push({ text: `Pot entering the flop: $${existingPot}`, value: existingPot });
    steps.push({ text: `Player bets: $${betAmount}`, value: betAmount });
    steps.push({ text: `Pot-sized raise = (3 × bet) + pot`, value: null });
    steps.push({ text: `= (3 × $${betAmount}) + $${existingPot}`, value: null });
    const answer = 3 * betAmount + existingPot;
    steps.push({ text: `= $${3 * betAmount} + $${existingPot} = $${answer}`, value: answer, final: true });
  } else if (type === 'multi-street') {
    const { actions } = scenario;
    let runningPot = 0;
    for (const action of actions) {
      if (action.type === 'blinds') {
        runningPot = action.sb + action.bb;
        steps.push({ text: `Blinds posted: $${action.sb} + $${action.bb} = $${runningPot}`, value: runningPot });
      } else if (action.type === 'bet') {
        steps.push({ text: `${action.player} bets $${action.amount} into $${runningPot} pot`, value: null });
        runningPot += action.amount;
      } else if (action.type === 'call') {
        steps.push({ text: `${action.player} calls $${action.amount}`, value: null });
        runningPot += action.amount;
      } else if (action.type === 'raise') {
        steps.push({ text: `${action.player} raises to $${action.amount}`, value: null });
        runningPot += action.amount;
      }
    }
    steps.push({ text: `Running pot total: $${runningPot}`, value: runningPot, final: true });
  } else if (type === 'reraise') {
    const { existingPot, firstRaise, question } = scenario;
    steps.push({ text: `Pot before action: $${existingPot}`, value: existingPot });
    steps.push({ text: `First raise to: $${firstRaise}`, value: firstRaise });
    const potAfterRaise = existingPot + firstRaise;
    steps.push({ text: `Pot after raise: $${existingPot} + $${firstRaise} = $${potAfterRaise}`, value: potAfterRaise });
    if (question === 'reraise') {
      steps.push({ text: `Re-raise = (3 × raise) + pot after raise`, value: null });
      const reraiseAmount = 3 * firstRaise + potAfterRaise;
      steps.push({ text: `= (3 × $${firstRaise}) + $${potAfterRaise}`, value: null });
      steps.push({ text: `= $${3 * firstRaise} + $${potAfterRaise} = $${reraiseAmount}`, value: reraiseAmount, final: true });
    }
  } else if (type === 'memorization') {
    const { potSize, betSize, multiple } = scenario;
    steps.push({ text: `Pot = $${potSize}`, value: potSize });
    steps.push({ text: `Bet = $${betSize}`, value: betSize });
    steps.push({ text: `Raise = (3 × bet) + pot`, value: null });
    const raise = 3 * betSize + potSize;
    steps.push({ text: `= (3 × $${betSize}) + $${potSize} = $${raise}`, value: raise });
    steps.push({ text: `This equals ${multiple}× the original pot`, value: multiple, final: true });
  }

  return steps;
}
