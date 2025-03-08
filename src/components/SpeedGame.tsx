import React, { useState, useEffect } from 'react';
import { validateAttempt, checkouts, getCheckoutCombinations, findAllCheckoutCombinations } from '../checkouts';
import Dartboard from './Dartboard';
import './SpeedGame.css';

interface SpeedGameProps {
  onGameComplete?: (score: number) => void;
}

interface GameState {
  currentScore: number;
  checkoutsCompleted: number;
  currentCheckout: number;
  startTime: number;
  currentThrows: string[];
  message: string;
  isGameComplete: boolean;
  hasStarted: boolean;
  showScoreAnimation: {
    show: boolean;
    points: number;
    isOptimal: boolean;
  };
  showWrongAnimation: boolean;
  wrongAttempts: Array<{
    checkout: number;
    attempt: string[];
    optimalCheckout: string[];
  }>;
}

interface ScoreRecord {
  score: number;
  date: string;
}

const TOTAL_CHECKOUTS = 5;
const BASE_POINTS_OPTIMAL = 200;
const BASE_POINTS_VALID = 100;
const TIME_BONUS_CUTOFF = 15; // seconds
const MAX_TIME_BONUS = 1000; // points
const MAX_RECENT_SCORES = 5;

// Generate all valid checkout numbers between 41 and 170
const generateValidCheckouts = (): number[] => {
  const checkouts: number[] = [];
  for (let i = 41; i <= 170; i++) {
    // Skip impossible checkouts
    if (i === 169 || i === 168 || i === 166 || i === 165 || i === 163 || i === 162 || i === 159) continue;
    checkouts.push(i);
  }
  return checkouts;
};

const VALID_CHECKOUTS = generateValidCheckouts();

const SpeedGame: React.FC<SpeedGameProps> = ({ onGameComplete }) => {
  const [gameState, setGameState] = useState<GameState>({
    currentScore: 0,
    checkoutsCompleted: 0,
    currentCheckout: 0,
    startTime: 0,
    currentThrows: [],
    message: '',
    isGameComplete: false,
    hasStarted: false,
    showScoreAnimation: {
      show: false,
      points: 0,
      isOptimal: false
    },
    showWrongAnimation: false,
    wrongAttempts: []
  });

  const [highScore, setHighScore] = useState<number>(0);
  const [recentScores, setRecentScores] = useState<ScoreRecord[]>([]);

  // Helper function to get random checkouts
  const getRandomCheckouts = (count: number): number[] => {
    const shuffled = [...VALID_CHECKOUTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  // Load scores from localStorage on component mount
  useEffect(() => {
    const storedHighScore = localStorage.getItem('speedGameHighScore');
    const storedRecentScores = localStorage.getItem('speedGameRecentScores');
    
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore));
    }
    if (storedRecentScores) {
      setRecentScores(JSON.parse(storedRecentScores));
    }
  }, []);

  // Update high score and recent scores
  const updateScores = (newScore: number) => {
    // Update high score if necessary
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('speedGameHighScore', newScore.toString());
    }

    // Add to recent scores
    const newScoreRecord: ScoreRecord = {
      score: newScore,
      date: new Date().toLocaleDateString()
    };

    const updatedRecentScores = [newScoreRecord, ...recentScores].slice(0, MAX_RECENT_SCORES);
    setRecentScores(updatedRecentScores);
    localStorage.setItem('speedGameRecentScores', JSON.stringify(updatedRecentScores));
  };

  // Initialize or reset the game
  const startGame = () => {
    const checkouts = getRandomCheckouts(TOTAL_CHECKOUTS);
    
    setGameState({
      currentScore: 0,
      checkoutsCompleted: 0,
      currentCheckout: checkouts[0],
      startTime: Date.now(),
      currentThrows: [],
      message: 'Game started! Complete the checkout as quickly as possible.',
      isGameComplete: false,
      hasStarted: true,
      showScoreAnimation: {
        show: false,
        points: 0,
        isOptimal: false
      },
      showWrongAnimation: false,
      wrongAttempts: []
    });
  };

  // Calculate time bonus based on how quickly the checkout was completed
  const calculateTimeBonus = (timeTaken: number): number => {
    if (timeTaken > TIME_BONUS_CUTOFF) return 0;
    // Linear decrease from MAX_TIME_BONUS to 0 over TIME_BONUS_CUTOFF seconds
    return Math.floor(MAX_TIME_BONUS * (1 - timeTaken / TIME_BONUS_CUTOFF));
  };

  // Handle dart throws
  const handleDartThrow = (section: string) => {
    if (gameState.isGameComplete) return;
    
    setGameState(prev => ({
      ...prev,
      currentThrows: [...prev.currentThrows, section]
    }));
  };

  // Helper function to get optimal checkout for a score
  const getOptimalCheckout = (score: number): string[] => {
    const checkout = checkouts.find(c => c.score === score);
    if (checkout?.optimalCombinations && checkout.optimalCombinations.length > 0) {
      return checkout.optimalCombinations[0];
    }
    
    // If no predefined optimal checkout exists, calculate a simple one
    if (score <= 40 && score % 2 === 0) {
      return [`D${score/2}`];
    }
    
    // For any other score, use findAllCheckoutCombinations to get a valid checkout
    const allCombos = findAllCheckoutCombinations(score);
    return allCombos.length > 0 ? allCombos[0] : [];
  };

  // Handle submission of a checkout attempt
  const handleSubmit = () => {
    if (gameState.isGameComplete) return;

    const timeTaken = (Date.now() - gameState.startTime) / 1000;
    const validation = validateAttempt(gameState.currentThrows, gameState.currentCheckout);
    let pointsEarned = 0;
    let message = '';

    if (validation.isValid) {
      const timeBonus = calculateTimeBonus(timeTaken);
      pointsEarned = validation.isOptimal ? BASE_POINTS_OPTIMAL : BASE_POINTS_VALID;
      pointsEarned += timeBonus;

      setGameState(prev => ({
        ...prev,
        showScoreAnimation: {
          show: true,
          points: pointsEarned,
          isOptimal: validation.isOptimal
        },
        showWrongAnimation: false
      }));

      message = `Correct! ${validation.isOptimal ? 'Optimal solution! ' : ''}` +
                `Base points: ${validation.isOptimal ? BASE_POINTS_OPTIMAL : BASE_POINTS_VALID}, ` +
                `Time bonus: ${timeBonus}. Total: ${pointsEarned}`;
    } else {
      // Show wrong animation and store the wrong attempt
      setGameState(prev => ({
        ...prev,
        showWrongAnimation: true,
        showScoreAnimation: {
          show: false,
          points: 0,
          isOptimal: false
        },
        wrongAttempts: [...prev.wrongAttempts, {
          checkout: prev.currentCheckout,
          attempt: prev.currentThrows,
          optimalCheckout: getOptimalCheckout(prev.currentCheckout)
        }]
      }));
      message = 'Invalid checkout.';
    }

    const nextCheckoutIndex = gameState.checkoutsCompleted + 1;
    const isGameComplete = nextCheckoutIndex >= TOTAL_CHECKOUTS;
    const finalScore = gameState.currentScore + (validation.isValid ? pointsEarned : 0);

    setTimeout(() => {
      if (isGameComplete) {
        updateScores(finalScore);
      }

      // Get a new random checkout for the next round
      const nextCheckout = isGameComplete ? 0 : getRandomCheckouts(1)[0];

      setGameState(prev => ({
        ...prev,
        currentScore: finalScore,
        checkoutsCompleted: nextCheckoutIndex,
        currentCheckout: nextCheckout,
        currentThrows: [],
        startTime: Date.now(),
        message,
        isGameComplete,
        showScoreAnimation: {
          show: false,
          points: 0,
          isOptimal: false
        },
        showWrongAnimation: false
      }));

      if (isGameComplete && onGameComplete) {
        onGameComplete(finalScore);
      }
    }, validation.isValid ? 1000 : 1000);
  };

  // Reset current attempt
  const handleReset = () => {
    setGameState(prev => ({
      ...prev,
      currentThrows: [],
      message: ''
    }));
  };

  // Helper function to get score color
  const getScoreColor = (score: number): string => {
    if (score >= 750) return 'green';
    if (score >= 300) return 'orange';
    return 'red';
  };

  const renderScoreBoard = () => (
    <div className="score-board">
      <div className="high-score">
        <h3>High Score</h3>
        <p>{highScore}</p>
      </div>
      {recentScores.length > 0 && (
        <div className="recent-scores">
          <h3>Recent Scores</h3>
          <ul>
            {recentScores.map((record, index) => (
              <li key={index}>
                <span>{record.score}</span>
                <span>{record.date}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderStartScreen = () => (
    <div className="start-screen">
      <h2>Speed Checkout Challenge</h2>
      <p>Complete 5 checkouts as quickly as possible!</p>
      <ul>
        <li>200 points for optimal checkouts</li>
        <li>100 points for valid checkouts</li>
        <li>Up to 1000 bonus points based on speed (decreases over 15 seconds)</li>
      </ul>
      {renderScoreBoard()}
      <button className="start-game-button" onClick={startGame}>
        Start Challenge
      </button>
    </div>
  );

  const renderGameComplete = () => (
    <div className="game-complete">
      <h3>Game Complete!</h3>
      <p style={{ color: getScoreColor(gameState.currentScore), fontSize: '1.5em', fontWeight: 'bold' }}>
        Final Score: {gameState.currentScore}
      </p>
      
      {gameState.wrongAttempts.length > 0 && (
        <div className="wrong-attempts">
          <h4>Incorrect Attempts:</h4>
          {gameState.wrongAttempts.map((attempt, index) => (
            <div key={index} className="wrong-attempt">
              <p>Checkout {attempt.checkout}:</p>
              <p>Your attempt: {attempt.attempt.join(' → ')}</p>
              <p>Optimal checkout: {attempt.optimalCheckout.join(' → ')}</p>
            </div>
          ))}
        </div>
      )}
      
      {gameState.currentScore === highScore && (
        <div className="new-high-score">New High Score! 🎉</div>
      )}
      {renderScoreBoard()}
      <button className="play-again-button" onClick={startGame}>
        Play Again
      </button>
    </div>
  );

  return (
    <div className="speed-game">
      {!gameState.hasStarted ? (
        renderStartScreen()
      ) : (
        <>
          <div className="game-header">
            <div className="game-stats">
              <p style={{ color: getScoreColor(gameState.currentScore) }}>
                Score: {gameState.currentScore}
              </p>
              <p>High Score: {highScore}</p>
              <p>Checkouts: {gameState.checkoutsCompleted}/{TOTAL_CHECKOUTS}</p>
            </div>
          </div>

          {gameState.showScoreAnimation.show && (
            <div className={`score-animation ${gameState.showScoreAnimation.isOptimal ? 'optimal' : 'valid'}`}>
              +{gameState.showScoreAnimation.points}
            </div>
          )}

          {gameState.showWrongAnimation && (
            <div className="score-animation wrong">
              Wrong Attempt!
            </div>
          )}

          {!gameState.isGameComplete ? (
            <div className="game-content">
              <h2>Checkout Target: {gameState.currentCheckout}</h2>
              
              <div className="dartboard-container">
                <Dartboard
                  onSectionClick={handleDartThrow}
                  currentThrows={gameState.currentThrows}
                />
              </div>

              <div className="side-panel">
                <div className="attempt-display">
                  <h3>Current Attempt</h3>
                  <p>{gameState.currentThrows.join(' → ') || 'No darts thrown yet'}</p>
                </div>

                <div className="controls">
                  <button 
                    className="validate-button"
                    onClick={handleSubmit}
                    disabled={gameState.currentThrows.length === 0}
                  >
                    Submit Checkout
                  </button>
                  <button 
                    className="reset-button"
                    onClick={handleReset}
                    disabled={gameState.currentThrows.length === 0}
                  >
                    Reset Attempt
                  </button>
                </div>

                {gameState.message && (
                  <div className="message">{gameState.message}</div>
                )}
              </div>
            </div>
          ) : (
            renderGameComplete()
          )}
        </>
      )}
    </div>
  );
};

export default SpeedGame; 