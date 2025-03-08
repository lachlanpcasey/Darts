import React, { useState } from 'react'
import './App.css'
import Dartboard from './components/Dartboard'
import { isCheckoutPossible, validateAttempt, getCheckoutCombinations } from './checkouts'

function App() {
  const [targetNumber, setTargetNumber] = useState<number>(0);
  const [userAttempt, setUserAttempt] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [stats, setStats] = useState({
    attempts: 0,
    correct: 0,
    incorrect: 0
  });

  const generateNewTarget = () => {
    const newTarget = Math.floor(Math.random() * (170 - 41 + 1)) + 41;
    setTargetNumber(newTarget);
    setUserAttempt([]);
    setMessage('');
    setGameStarted(true);
  };

  const validateCheckout = () => {
    if (userAttempt.length === 0) {
      setMessage('Please make an attempt first!');
      return;
    }

    const result = validateAttempt(targetNumber, userAttempt);
    
    setStats(prev => ({
      attempts: prev.attempts + 1,
      correct: prev.correct + (result.isValid ? 1 : 0),
      incorrect: prev.incorrect + (result.isValid ? 0 : 1)
    }));

    if (result.isValid) {
      if (result.isOptimal) {
        setMessage('Perfect! This is an optimal checkout solution! 🎯');
      } else {
        const optimalSolutions = result.optimalCombinations
          ? `\nOptimal solution${result.optimalCombinations.length > 1 ? 's' : ''}: ${result.optimalCombinations.map(c => c.join(' → ')).join(' or ')}`
          : '';
        setMessage(`Correct! But there's a more optimal way to check out.${optimalSolutions}`);
      }
    } else {
      const suggestedCheckouts = result.optimalCombinations
        ? `Common checkouts for ${targetNumber} are:\n${result.optimalCombinations.map(c => c.join(' → ')).join('\n')}`
        : `Try to find a checkout that ends with a double!`;
      setMessage(`Wrong! ${suggestedCheckouts}`);
    }
  };

  const handleDartboardClick = (section: string) => {
    if (userAttempt.length < 3) {
      setUserAttempt([...userAttempt, section]);
    }
  };

  const handleNoCheckout = () => {
    const possible = isCheckoutPossible(targetNumber);
    setStats(prev => ({
      attempts: prev.attempts + 1,
      correct: prev.correct + (!possible ? 1 : 0),
      incorrect: prev.incorrect + (!possible ? 0 : 1)
    }));

    if (!possible) {
      setMessage('Correct! This number cannot be checked out!');
    } else {
      setMessage('Wrong! This number can be checked out. Try again!');
    }
  };

  const resetAttempt = () => {
    setUserAttempt([]);
  };

  return (
    <div className="game-container">
      <h1>Darts Checkout Practice</h1>
      
      {!gameStarted ? (
        <button onClick={generateNewTarget} className="start-button">
          Start New Game
        </button>
      ) : (
        <div className="game-content">
          <h2>Checkout Target: {targetNumber}</h2>
          
          <div className="stats">
            <p>Attempts: {stats.attempts}</p>
            <p>Correct: {stats.correct}</p>
            <p>Success Rate: {stats.attempts > 0 ? ((stats.correct / stats.attempts) * 100).toFixed(1) : 0}%</p>
          </div>

          <Dartboard 
            onSectionClick={handleDartboardClick} 
            currentThrows={userAttempt}
          />

          <div className="attempt-display">
            <h3>Your attempt:</h3>
            <p>{userAttempt.join(' → ') || 'No darts thrown yet'}</p>
            <button onClick={resetAttempt} className="reset-button">
              Reset Attempt
            </button>
          </div>

          <div className="controls">
            <button 
              onClick={validateCheckout} 
              className="validate-button"
              disabled={userAttempt.length === 0}
            >
              Check Answer
            </button>
            <button onClick={handleNoCheckout} className="no-checkout-button">
              No Checkout Possible
            </button>
            <button onClick={generateNewTarget} className="next-button">
              New Number
            </button>
          </div>

          {message && <div className="message">{message}</div>}
        </div>
      )}
    </div>
  )
}

export default App 