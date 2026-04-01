# PLO Boss — Dealer Math Trainer

A gamified training app for casino dealers learning Pot Limit Omaha (PLO) pot calculation math. Built with React + Vite + Tailwind CSS.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Build for Production

```bash
npm run build
npm run preview
```

## Features

### Three Training Modes

- **Training Mode** — Multiple choice with step-by-step breakdowns, hints, and a Memorization Drill sub-mode (flashcards with spaced repetition)
- **Exam Mode** — Free numeric input with 15-second countdown timer, full XP rewards + streak multipliers
- **Speed Round** — 10 questions, fastest time wins, 10-second penalty per wrong answer, leaderboard

### Gamification

- XP system with 5 dealer ranks: Rookie Dealer, Floor Dealer, Shift Supervisor, Pit Boss, Casino Pro
- Streak tracking with multipliers (3+ = 1.5x, 5+ = 2x, 10+ = 3x XP)
- Local leaderboards (top 10 per mode)
- 6 progressive difficulty levels that unlock at 80% accuracy over 20 questions

### Configuration

- Select from standard blind levels ($1/$2 through $25/$50) or add custom blinds
- Lock to specific difficulty levels or streets
- Choose session length (10/20/50/unlimited)
- Quick Start button uses last saved config

## PLO Pot Calculation Formula Reference

### Core Formula

```
Pot-sized raise = (3 x current bet) + existing pot
```

### Key Multiples to Memorize

| Bet Size | Raise Multiple | Example (pot = $100) |
|----------|---------------|---------------------|
| Full pot | 4x the pot | Bet $100 -> raise to $400 |
| Half pot | 2.5x the pot | Bet $50 -> raise to $250 |
| 2/3 pot | 3x the pot | Bet $67 -> raise to $300 |

### Preflop

```
Starting pot = SB + BB
Max preflop raise = (3 x BB) + SB + BB
```

Example: $1/$2 game -> pot = $3 -> max raise = (3x2) + 1 + 2 = $9

### Re-Raise

```
Re-raise = (3 x previous raise amount) + pot after raise
```

### All-In Rule

A player may only go all-in if their stack is less than or equal to the pot-sized bet amount.

## Project Structure

```
src/
  App.jsx                    - Main app shell with screen routing
  components/
    Breakdown.jsx            - Step-by-step formula explainer
    ConfigScreen.jsx         - Blind level and session configurator
    Flashcard.jsx            - Memorization drill card flip UI
    GameBoard.jsx            - Active question display and input
    Leaderboard.jsx          - Session and all-time boards
    ModeSelect.jsx           - Main menu mode picker
    ProgressBar.jsx          - XP and level display
    ScoreDisplay.jsx         - Streak, XP, level badge
    Settings.jsx             - Player rename, stats, reset
    Timer.jsx                - Countdown with color/pulse states
  hooks/
    useGameState.js          - XP, streak, level, localStorage persistence
    useTimer.js              - Countdown timer logic
  utils/
    multiplesDrill.js        - Spaced repetition tracker for multiples
    potCalc.js               - All PLO pot math logic
    questionGenerator.js     - Dynamic scenario generator with distractors
```

## Tech Stack

- React 19 + Vite
- Tailwind CSS v4
- localStorage for all persistence (no backend)
