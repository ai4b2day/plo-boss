import { useState, useEffect, useCallback } from 'react';
import useGameState from './hooks/useGameState';
import ModeSelect from './components/ModeSelect';
import ConfigScreen from './components/ConfigScreen';
import GameBoard from './components/GameBoard';
import Flashcard from './components/Flashcard';
import Settings from './components/Settings';

export default function App() {
  const gameState = useGameState();
  const { state, config, setConfig, setLastMode, resetSession } = gameState;

  const [screen, setScreen] = useState('menu');
  const [selectedMode, setSelectedMode] = useState(null);

  // Navigate to a screen and push browser history so back button works
  function navigateTo(newScreen) {
    window.history.pushState({ screen: newScreen }, '', '');
    setScreen(newScreen);
  }

  // Handle browser back button
  const handlePopState = useCallback((e) => {
    const targetScreen = e.state?.screen || 'menu';
    setScreen(targetScreen);
    if (targetScreen === 'menu') {
      resetSession();
    }
  }, [resetSession]);

  useEffect(() => {
    // Set initial history state
    window.history.replaceState({ screen: 'menu' }, '', '');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handlePopState]);

  function handleSelectMode(mode, quickStart = false) {
    setSelectedMode(mode);
    setLastMode(mode);

    if (mode === 'training') {
      navigateTo('training-choice');
    } else if (quickStart) {
      startGame(mode);
    } else {
      navigateTo('config');
    }
  }

  function handleTrainingChoice(choice) {
    if (choice === 'memorization') {
      navigateTo('memorization');
    } else {
      navigateTo('config');
    }
  }

  function startGame(mode) {
    const m = mode || selectedMode;
    resetSession();
    setSelectedMode(m);
    navigateTo('game');
  }

  function handleEndGame() {
    // Clear forward history and go to menu
    window.history.pushState({ screen: 'menu' }, '', '');
    setScreen('menu');
    resetSession();
  }

  function handleBack() {
    // Use browser back to keep history consistent
    window.history.back();
  }

  return (
    <div className="min-h-screen bg-surface">
      {screen === 'menu' && (
        <ModeSelect
          gameState={gameState}
          onSelectMode={handleSelectMode}
          onSettings={() => navigateTo('settings')}
        />
      )}

      {screen === 'training-choice' && (
        <div className="max-w-lg mx-auto p-4 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <button onClick={handleBack} className="text-text-secondary hover:text-text-primary text-sm">&larr; Back</button>
            <h2 className="text-gold font-bold text-lg">Training Mode</h2>
            <div className="w-12" />
          </div>

          <button
            onClick={() => handleTrainingChoice('regular')}
            className="w-full text-left bg-surface-light rounded-xl p-5 border-2 border-surface-lighter hover:border-chip-green transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-chip-green to-green-700 flex items-center justify-center text-2xl shrink-0">
                {'\u{1F4DA}'}
              </div>
              <div>
                <h3 className="text-text-primary font-bold group-hover:text-gold transition-colors">Practice Questions</h3>
                <p className="text-text-secondary text-sm mt-0.5">Multiple choice with full breakdowns. Work through all difficulty levels.</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleTrainingChoice('memorization')}
            className="w-full text-left bg-surface-light rounded-xl p-5 border-2 border-surface-lighter hover:border-gold transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-dark to-gold flex items-center justify-center text-2xl shrink-0">
                {'\u{1F0CF}'}
              </div>
              <div>
                <h3 className="text-text-primary font-bold group-hover:text-gold transition-colors">Memorization Drill</h3>
                <p className="text-text-secondary text-sm mt-0.5">Flashcard-style drill. Master the core 4x, 2.5x, and 3x multiples.</p>
                <p className="text-text-muted text-xs mt-1">Spaced repetition: weaker multiples appear more often.</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {screen === 'config' && (
        <ConfigScreen
          config={config}
          setConfig={setConfig}
          onStart={() => startGame()}
          unlockedLevel={state.unlockedLevel}
        />
      )}

      {screen === 'game' && (
        <GameBoard
          mode={selectedMode}
          gameState={gameState}
          config={config}
          onEnd={handleEndGame}
          onBack={handleBack}
        />
      )}

      {screen === 'memorization' && (
        <Flashcard
          gameState={gameState}
          onBack={handleBack}
        />
      )}

      {screen === 'settings' && (
        <Settings
          gameState={gameState}
          onBack={() => setScreen('menu')}
        />
      )}
    </div>
  );
}
