import React, { useState } from 'react'
import './App.css'
import Dartboard from './components/Dartboard'
import { isCheckoutPossible, validateAttempt } from './checkouts'
import SpeedGame from './components/SpeedGame'

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [targetNumber, setTargetNumber] = useState(0);
  const [currentThrows, setCurrentThrows] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [showSpeedGame, setShowSpeedGame] = useState(false);
  const [gameMode, setGameMode] = useState<'none' | 'practice' | 'speed'>('none');
  const [stats, setStats] = useState({
    attempts: 0,
    correct: 0,
    optimal: 0,
    incorrect: 0
  });

  const generateNewTarget = () => {
    const newTarget = Math.floor(Math.random() * 169) + 2;
    
    if (isCheckoutPossible(newTarget)) {
      setTargetNumber(newTarget);
      setGameStarted(true);
      setCurrentThrows([]);
      setMessage('');
    } else {
      generateNewTarget();
    }
  };

  const handleDartThrow = (section: string) => {
    setCurrentThrows(prev => [...prev, section]);
  };

  const validateCheckout = () => {
    const result = validateAttempt(targetNumber, currentThrows);
    setStats(prev => ({
      attempts: prev.attempts + 1,
      correct: prev.correct + (result.isValid ? 1 : 0),
      optimal: prev.optimal + (result.isOptimal ? 1 : 0),
      incorrect: prev.incorrect + (!result.isValid ? 1 : 0)
    }));

    setMessage(result.message);
    
    if (result.isValid) {
      setTimeout(() => {
        generateNewTarget();
      }, 2000);
    } else {
      setCurrentThrows([]);
    }
  };

  const handleNoCheckout = () => {
    const possible = isCheckoutPossible(targetNumber);
    setStats(prev => ({
      ...prev,
      attempts: prev.attempts + 1,
      correct: prev.correct + (!possible ? 1 : 0),
      incorrect: prev.incorrect + (possible ? 1 : 0)
    }));

    if (!possible) {
      setMessage('Correct! No checkout is possible for this number.');
      setTimeout(() => {
        generateNewTarget();
      }, 2000);
    } else {
      setMessage('Incorrect. This number can be checked out!');
      setCurrentThrows([]);
    }
  };

  const resetAttempt = () => {
    setCurrentThrows([]);
    setMessage('');
  };

  const startPracticeMode = () => {
    setGameMode('practice');
    setGameStarted(true);
    generateNewTarget();
  };

  const startSpeedMode = () => {
    setGameMode('speed');
  };

  const renderLandingPage = () => (
    <div className="landing-page">
      <div className="game-modes">
        <div className="game-mode-card" onClick={startPracticeMode}>
          <h2>Practice Mode</h2>
          <div className="mode-icon">🎯</div>
          <p>Learn and practice dart checkouts at your own pace</p>
          <ul>
            <li>Unlimited attempts</li>
            <li>Detailed feedback</li>
            <li>Track your progress</li>
          </ul>
          <button className="mode-button">Start Practice</button>
        </div>

        <div className="game-mode-card" onClick={startSpeedMode}>
          <h2>Speed Challenge</h2>
          <div className="mode-icon">⚡</div>
          <p>Test your skills against the clock</p>
          <ul>
            <li>5 checkouts</li>
            <li>Time bonuses</li>
            <li>High score challenge</li>
          </ul>
          <button className="mode-button">Start Challenge</button>
        </div>
      </div>
    </div>
  );

  const renderGameContent = () => {
    if (gameMode === 'speed') {
      return <SpeedGame />;
    }

    return (
      <div className="game-content">
        <h2>Checkout Target: {targetNumber}</h2>
        
        <div className="stats">
          <p>Attempts: {stats.attempts}</p>
          <p>Correct: {stats.correct}</p>
          <p>Optimal: {stats.optimal}</p>
          <p>Incorrect: {stats.incorrect}</p>
        </div>

        <div className="dartboard-container">
          <Dartboard
            onSectionClick={handleDartThrow}
            currentThrows={currentThrows}
          />
        </div>

        <div className="attempt-display">
          <h3>Current Attempt</h3>
          <p>{currentThrows.join(' → ') || 'No darts thrown yet'}</p>
        </div>

        <div className="controls">
          <button
            className="validate-button"
            onClick={validateCheckout}
            disabled={currentThrows.length === 0}
          >
            Submit Checkout
          </button>
          <button
            className="no-checkout-button"
            onClick={handleNoCheckout}
          >
            No Checkout Possible
          </button>
          <button
            className="reset-button"
            onClick={resetAttempt}
            disabled={currentThrows.length === 0}
          >
            Reset Attempt
          </button>
        </div>

        {message && <div className="message">{message}</div>}
      </div>
    );
  };

  return (
    <div className="game-container">
      <h1>Darts Checkout Practice</h1>
      
      {gameMode !== 'none' && (
        <div className="mode-selection">
          <button 
            className="mode-button"
            onClick={() => setGameMode('practice')}
            disabled={gameMode === 'practice'}
          >
            Practice Mode
          </button>
          <button 
            className="mode-button"
            onClick={() => setGameMode('speed')}
            disabled={gameMode === 'speed'}
          >
            Speed Challenge
          </button>
        </div>
      )}

      {gameMode === 'none' ? renderLandingPage() : renderGameContent()}
    </div>
  )
}

export default App 