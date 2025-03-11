import React, { useState, useEffect } from 'react';
import { validateAttempt, checkouts, getCheckoutCombinations, findAllCheckoutCombinations } from '../checkouts';
import Dartboard from './Dartboard';
import './SpeedGame.css'; // Reusing the same styles

interface AdaptiveGameProps {
  onGameComplete?: (score: number) => void;
}

// Valid checkout range for adaptive mode
const MIN_CHECKOUT = 41;
const MAX_CHECKOUT = 170;
const TOTAL_CHECKOUTS = 5; // Number of checkouts to complete the game

// Filter valid checkout numbers for this mode
const VALID_CHECKOUTS = Object.keys(checkouts)
  .map(Number)
  .filter(score => score >= MIN_CHECKOUT && score <= MAX_CHECKOUT);

interface GameState {
  currentScore: number; // Player's current score
  checkoutsCompleted: number;
  currentCheckout: number;
  startTime: number;
  totalTime: number;
  currentThrows: string[];
  simulatedThrow1: string | null; // The simulated first throw
  simulatedThrow2: string | null; // The simulated second throw
  remainingScore: number | null; // Score remaining after the simulated throws
  expectedCheckout: string[]; // What the player should hit
  originalCheckout: string[]; // The original checkout attempt
  message: string;
  gameStage: 'initial' | 'adjusting' | 'complete'; // Track game stage
  isGameComplete: boolean;
  hasStarted: boolean;
  dartsRemaining: number; // Number of darts player can still throw
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
    stage: 'initial' | 'adjusting';
  }>;
  nonOptimalAttempts: Array<{
    checkout: number;
    attempt: string[];
    optimalCheckout: string[];
    stage: 'initial' | 'adjusting';
  }>;
}

interface ScoreRecord {
  score: number;
  datetime: number; // Store as timestamp
  averageTime: number;
}

const AdaptiveGame: React.FC<AdaptiveGameProps> = ({ onGameComplete }) => {
  // Initialize state
  const [gameState, setGameState] = useState<GameState>({
    currentScore: 0,
    checkoutsCompleted: 0,
    currentCheckout: 0,
    startTime: 0,
    totalTime: 0,
    currentThrows: [],
    simulatedThrow1: null,
    simulatedThrow2: null,
    remainingScore: null,
    expectedCheckout: [],
    originalCheckout: [],
    message: '',
    gameStage: 'initial',
    isGameComplete: false,
    hasStarted: false,
    dartsRemaining: 3,
    showScoreAnimation: {
      show: false,
      points: 0,
      isOptimal: false
    },
    showWrongAnimation: false,
    wrongAttempts: [],
    nonOptimalAttempts: []
  });

  const [highScore, setHighScore] = useState<number>(0);
  const [recentScores, setRecentScores] = useState<ScoreRecord[]>([]);
  const MAX_RECENT_SCORES = 10;

  // Load saved scores on component mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem('adaptiveGameHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }

    const savedRecentScores = localStorage.getItem('adaptiveGameRecentScores');
    if (savedRecentScores) {
      try {
        setRecentScores(JSON.parse(savedRecentScores));
      } catch (error) {
        console.error('Error parsing recent scores:', error);
      }
    }
  }, []);

  // Get random checkouts for the game
  const getRandomCheckouts = (count: number): number[] => {
    if (!VALID_CHECKOUTS.length) return [];

    const selected: number[] = [];
    const available = [...VALID_CHECKOUTS];

    for (let i = 0; i < count; i++) {
      if (!available.length) break;
      const index = Math.floor(Math.random() * available.length);
      selected.push(available[index]);
      available.splice(index, 1);
    }

    return selected;
  };

  // Get optimal checkout for a score
  const getOptimalCheckout = (score: number): string[] => {
    if (checkouts[score]) {
      return Array.isArray(checkouts[score]) ? checkouts[score] : [];
    }
    return [];
  };

  // Calculate score for a throw
  const calculateThrowScore = (dartThrow: string): number => {
    if (dartThrow === 'BULL') return 50;
    if (dartThrow === '25') return 25;
    
    const multiplier = dartThrow[0];
    const value = parseInt(dartThrow.substring(1), 10);
    
    if (multiplier === 'S') return value;
    if (multiplier === 'D') return value * 2;
    if (multiplier === 'T') return value * 3;
    
    return 0;
  };

  // Simulate a throw - either a miss or a different segment
  const simulateThrow = (intendedThrow: string): string => {
    // 50% chance to hit exactly what was intended (changed from 70%)
    if (Math.random() > 0.5) {
      return intendedThrow;
    }

    // Simulate a miss by either:
    // 1. Missing the multiplier (e.g. T20 -> S20)
    // 2. Hitting a neighboring segment (e.g. T20 -> T5 or T1)
    
    const segments = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
    
    if (intendedThrow === 'BULL') {
      // 50% chance to hit 25 instead of BULL
      return Math.random() > 0.5 ? '25' : 'BULL';
    }
    
    if (intendedThrow === '25') {
      // Simulate missing the outer bull and hitting a single
      const randomIndex = Math.floor(Math.random() * segments.length);
      return `S${segments[randomIndex]}`;
    }
    
    const multiplier = intendedThrow[0];
    const value = parseInt(intendedThrow.substring(1), 10);
    
    // 50% chance to hit the same number but different multiplier
    if (Math.random() > 0.5) {
      const multipliers = ['S', 'D', 'T'].filter(m => m !== multiplier);
      const newMultiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
      return `${newMultiplier}${value}`;
    } else {
      // Hit a neighboring segment with the same multiplier
      const currentIndex = segments.indexOf(value);
      if (currentIndex !== -1) {
        // Get neighbors (wrap around the array)
        const leftIndex = (currentIndex - 1 + segments.length) % segments.length;
        const rightIndex = (currentIndex + 1) % segments.length;
        
        // Pick a neighbor randomly
        const newValue = Math.random() > 0.5 ? segments[leftIndex] : segments[rightIndex];
        return `${multiplier}${newValue}`;
      }
    }
    
    // Fallback to the original throw
    return intendedThrow;
  };

  // Initialize or reset the game
  const startGame = () => {
    try {
      console.log('Starting game...');
      const checkouts = getRandomCheckouts(TOTAL_CHECKOUTS);
      console.log('Generated checkouts:', checkouts);
      
      if (!checkouts.length) {
        console.error('Failed to generate checkouts');
        return;
      }
      
      const startTime = Date.now();
      console.log('Setting initial start time:', startTime);
      
      const newGameState: GameState = {
        currentScore: 0,
        checkoutsCompleted: 0,
        currentCheckout: checkouts[0],
        startTime: startTime,
        totalTime: 0,
        currentThrows: [],
        simulatedThrow1: null,
        simulatedThrow2: null,
        remainingScore: null,
        expectedCheckout: [],
        originalCheckout: [],
        message: 'Choose the optimal checkout...',
        gameStage: 'initial',
        isGameComplete: false,
        hasStarted: true,
        dartsRemaining: 3,
        showScoreAnimation: {
          show: false,
          points: 0,
          isOptimal: false
        },
        showWrongAnimation: false,
        wrongAttempts: [],
        nonOptimalAttempts: []
      };
      
      console.log('Setting new game state:', newGameState);
      setGameState(newGameState);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  // Calculate time bonus based on how quickly the player completes the checkout
  const calculateTimeBonus = (timeTaken: number): number => {
    return Math.max(0, Math.floor(1000 - timeTaken * 5));
  };

  // Determine if a checkout is strategically good
  const isStrategicScore = (score: number): boolean => {
    // Common good doubles to leave
    const goodDoubles = [40, 36, 32, 24, 20, 18, 16, 12, 8, 4, 2];
    return goodDoubles.includes(score);
  };

  // Check if a throw is strategic (leaves a good double)
  const isStrategicThrow = (remainingScore: number): boolean => {
    if (remainingScore <= 40 && remainingScore % 2 === 0) {
      return isStrategicScore(remainingScore);
    }
    return false;
  };

  // Handle dart throw
  const handleDartThrow = (section: string) => {
    if (gameState.currentThrows.length < gameState.dartsRemaining && !gameState.isGameComplete) {
      setGameState(prev => ({
        ...prev,
        currentThrows: [...prev.currentThrows, section]
      }));
    }
  };

  // Handle submit of initial checkout
  const handleInitialSubmit = () => {
    const validation = validateAttempt(gameState.currentThrows, gameState.currentCheckout);
    const optimalCheckout = getOptimalCheckout(gameState.currentCheckout);
    
    let pointsEarned = 0;
    let isOptimal = false;
    
    if (validation.isValid) {
      // Calculate points for initial checkout
      pointsEarned = gameState.currentThrows.join(' ') === optimalCheckout.join(' ')
        ? 150 // Perfect checkout
        : gameState.currentThrows.length === optimalCheckout.length
          ? 100 // Same number of darts
          : 50;  // Valid but not optimal

      isOptimal = pointsEarned === 150;
      
      // Choose the first throw and simulate it
      const intendedThrow1 = gameState.currentThrows[0];
      const actualThrow1: string = simulateThrow(intendedThrow1);
      
      // If first dart hits as intended, simulate a second dart miss
      // If first dart misses, don't simulate a second dart
      let actualThrow2: string | null = null;
      let remainingScore = gameState.currentCheckout;
      
      // Calculate remaining score after the first simulated throw
      remainingScore -= calculateThrowScore(actualThrow1);
      
      // Determine darts remaining for player
      let dartsRemaining = 2; // After first dart, 2 darts remain
      
      // If first dart hit as intended, simulate a second dart miss
      if (actualThrow1 === intendedThrow1 && gameState.currentThrows.length > 1) {
        const intendedThrow2 = gameState.currentThrows[1];
        // Always miss with the second dart (100% miss rate)
        let missThrow: string;
        do {
          missThrow = simulateThrow(intendedThrow2);
        } while (missThrow === intendedThrow2);
        
        actualThrow2 = missThrow;
        
        // Calculate remaining score after second throw
        remainingScore -= calculateThrowScore(actualThrow2);
        
        // After second dart, only 1 dart remains
        dartsRemaining = 1;
      }
      
      // Find possible checkouts for the remaining score
      let expectedCheckout: string[] = [];
      if (remainingScore > 0 && remainingScore <= 170) {
        expectedCheckout = getOptimalCheckout(remainingScore);
      }
      
      let message = '';
      if (actualThrow1 !== intendedThrow1) {
        message = `You aimed for ${intendedThrow1} but hit ${actualThrow1} instead! You have ${dartsRemaining} darts left.`;
      } else if (actualThrow2) {
        message = `You hit ${actualThrow1} as planned, but aimed for ${gameState.currentThrows[1]} and hit ${actualThrow2} instead! You have 1 dart left.`;
      }
      
      // Move to the adjustment stage
      setGameState(prev => ({
        ...prev,
        currentScore: prev.currentScore + pointsEarned,
        currentThrows: [],
        simulatedThrow1: actualThrow1,
        simulatedThrow2: actualThrow2,
        remainingScore: remainingScore,
        expectedCheckout: expectedCheckout,
        originalCheckout: prev.currentThrows,
        message: message,
        gameStage: 'adjusting',
        dartsRemaining: dartsRemaining,
        showScoreAnimation: {
          show: true,
          points: pointsEarned,
          isOptimal
        },
        nonOptimalAttempts: !isOptimal ? [...prev.nonOptimalAttempts, {
          checkout: prev.currentCheckout,
          attempt: prev.currentThrows,
          optimalCheckout,
          stage: 'initial'
        }] : prev.nonOptimalAttempts
      }));
    } else {
      // Invalid checkout attempt
      setGameState(prev => ({
        ...prev,
        message: 'Invalid checkout attempt. Try again!',
        showWrongAnimation: true,
        wrongAttempts: [...prev.wrongAttempts, {
          checkout: prev.currentCheckout,
          attempt: prev.currentThrows,
          optimalCheckout,
          stage: 'initial'
        }]
      }));
      
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          showWrongAnimation: false,
          currentThrows: []
        }));
      }, 1000);
    }
  };

  // Handle submit for the adjustment stage
  const handleAdjustmentSubmit = () => {
    if (gameState.remainingScore === null) {
      return;
    }
    
    // Calculate remaining score after throws
    let scoreAfterThrows = gameState.remainingScore;
    for (const dartThrow of gameState.currentThrows) {
      scoreAfterThrows -= calculateThrowScore(dartThrow);
    }
    
    // Check for bust
    if (scoreAfterThrows < 0) {
      setGameState(prev => ({
        ...prev,
        message: 'Bust! You exceeded the score.',
        showWrongAnimation: true,
        currentThrows: []
      }));
      return;
    }
    
    const isCheckoutPossible = gameState.remainingScore <= 170 && 
                             (gameState.remainingScore <= 40 && gameState.remainingScore % 2 === 0 || 
                              gameState.remainingScore === 50);
    
    // Check if the player has achieved a checkout with the current throws
    const hasCheckedOut = scoreAfterThrows === 0 && 
                          (gameState.currentThrows.length > 0 && 
                           gameState.currentThrows[gameState.currentThrows.length - 1].startsWith('D') || 
                           gameState.currentThrows[gameState.currentThrows.length - 1] === 'BULL');
    
    // Check if the throws are strategic (leave a good double)
    const isStrategic = !hasCheckedOut && isStrategicThrow(scoreAfterThrows);
    
    // Check if the player has used all darts or successfully checked out
    const throwsAreValid = hasCheckedOut || 
                          (gameState.currentThrows.length === gameState.dartsRemaining && scoreAfterThrows >= 0);
    
    // Get optimal checkout for the original remaining score
    const optimalCheckout = gameState.expectedCheckout.length > 0 
      ? gameState.expectedCheckout 
      : getOptimalCheckout(gameState.remainingScore);
    
    const endTime = Date.now();
    const timeTaken = (endTime - gameState.startTime) / 1000;
    const timeBonus = calculateTimeBonus(timeTaken);
    
    let pointsEarned = 0;
    let isOptimal = false;
    let isValidAttempt = false;
    
    // Determine if the attempt was valid
    if (throwsAreValid && (hasCheckedOut || isStrategic)) {
      isValidAttempt = true;
      
      // Calculate points
      if (hasCheckedOut) {
        // Successful checkout
        const isOptimalCheckout = gameState.currentThrows.join(' ') === optimalCheckout.join(' ');
        const usesMinimalDarts = gameState.currentThrows.length <= optimalCheckout.length;
        
        pointsEarned = isOptimalCheckout
          ? 150 // Perfect adjustment
          : usesMinimalDarts
            ? 100 // Same or fewer darts than optimal
            : 50;  // Valid but not optimal
        
        isOptimal = pointsEarned === 150;
      } else if (isStrategic) {
        // Strategic play (leaving a good double)
        pointsEarned = 75; // Points for strategic play
      }
      
      const finalScore = gameState.currentScore + pointsEarned + timeBonus;
      const nextCheckoutIndex = gameState.checkoutsCompleted + 1;
      const isGameComplete = nextCheckoutIndex >= TOTAL_CHECKOUTS;
      
      let message = '';
      if (hasCheckedOut) {
        message = `Correct adjustment! ${isOptimal ? 'Perfect checkout! ' : ''} +${pointsEarned} points${timeBonus > 0 ? ` (+${timeBonus} time bonus)` : ''}`;
      } else if (isStrategic) {
        message = `Good strategic play! You left ${scoreAfterThrows} which is a good double. +${pointsEarned} points${timeBonus > 0 ? ` (+${timeBonus} time bonus)` : ''}`;
      }
      
      setGameState(prev => ({
        ...prev,
        currentScore: finalScore,
        totalTime: timeTaken,
        message: message,
        showScoreAnimation: {
          show: true,
          points: pointsEarned + timeBonus,
          isOptimal
        },
        nonOptimalAttempts: !isOptimal && hasCheckedOut ? [...prev.nonOptimalAttempts, {
          checkout: prev.remainingScore || 0,
          attempt: prev.currentThrows,
          optimalCheckout,
          stage: 'adjusting'
        }] : prev.nonOptimalAttempts
      }));
      
      setTimeout(() => {
        if (isGameComplete) {
          // Game complete
          updateScores(finalScore);
        }
        
        const nextCheckout = isGameComplete ? 0 : getRandomCheckouts(1)[0];
        const newStartTime = Date.now();
        
        setGameState(prev => ({
          ...prev,
          checkoutsCompleted: nextCheckoutIndex,
          currentCheckout: nextCheckout,
          currentThrows: [],
          simulatedThrow1: null,
          simulatedThrow2: null,
          remainingScore: null,
          expectedCheckout: [],
          originalCheckout: [],
          startTime: newStartTime,
          message: isGameComplete ? 'Game complete!' : 'Choose the optimal checkout...',
          gameStage: 'initial',
          isGameComplete,
          dartsRemaining: 3,
          showScoreAnimation: {
            show: false,
            points: 0,
            isOptimal: false
          }
        }));
        
        if (isGameComplete && onGameComplete) {
          onGameComplete(finalScore);
        }
      }, 1500);
    } else {
      // Invalid adjustment attempt
      let errorMessage = '';
      if (!throwsAreValid && !hasCheckedOut) {
        if (gameState.currentThrows.length === 0) {
          errorMessage = 'You must throw at least one dart.';
        } else if (scoreAfterThrows < 0 || (scoreAfterThrows === 1) || (scoreAfterThrows > 1 && scoreAfterThrows % 2 !== 0 && scoreAfterThrows !== 50)) {
          errorMessage = `Invalid score left: ${scoreAfterThrows}. Cannot be checked out.`;
        } else {
          errorMessage = `You must either checkout or use all ${gameState.dartsRemaining} darts to leave a strategic score.`;
        }
      } else if (!hasCheckedOut && !isStrategic) {
        errorMessage = `You left ${scoreAfterThrows}, which is not a checkout or a good strategic leave.`;
      }
      
      setGameState(prev => ({
        ...prev,
        message: errorMessage,
        showWrongAnimation: true,
        wrongAttempts: [...prev.wrongAttempts, {
          checkout: prev.remainingScore || 0,
          attempt: prev.currentThrows,
          optimalCheckout,
          stage: 'adjusting'
        }]
      }));
      
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          showWrongAnimation: false,
          currentThrows: []
        }));
      }, 1000);
    }
  };

  // Handle submit button
  const handleSubmit = () => {
    if (gameState.currentThrows.length === 0) {
      return;
    }
    
    if (gameState.gameStage === 'initial') {
      handleInitialSubmit();
    } else if (gameState.gameStage === 'adjusting') {
      handleAdjustmentSubmit();
    }
  };

  // Reset current throw
  const handleReset = () => {
    setGameState(prev => ({
      ...prev,
      currentThrows: []
    }));
  };

  // Update high score and recent scores
  const updateScores = (newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('adaptiveGameHighScore', newScore.toString());
    }

    const newScoreRecord: ScoreRecord = {
      score: newScore,
      datetime: Date.now(), // Store exact timestamp
      averageTime: gameState.totalTime
    };

    const updatedRecentScores = [newScoreRecord, ...recentScores].slice(0, MAX_RECENT_SCORES);
    setRecentScores(updatedRecentScores);
    localStorage.setItem('adaptiveGameRecentScores', JSON.stringify(updatedRecentScores));
  };

  // Get color based on score
  const getScoreColor = (score: number): string => {
    if (score < 300) return '#3498db'; // Blue
    if (score < 600) return '#2ecc71'; // Green
    if (score < 900) return '#f1c40f'; // Yellow
    if (score < 1200) return '#e67e22'; // Orange
    return '#e74c3c'; // Red
  };

  // Render start screen
  const renderStartScreen = () => (
    <div className="start-screen">
      <h2>Adaptive Checkout Practice</h2>
      <p>
        In this mode, you'll need to adapt your checkouts when you don't hit what you intended.
        First choose an optimal checkout, then adjust when the first dart doesn't go where planned.
      </p>
      <ul>
        <li>Choose the optimal checkout for each score</li>
        <li>Adapt your checkout when the first dart doesn't hit the intended target</li>
        <li>Complete {TOTAL_CHECKOUTS} checkouts to finish the game</li>
        <li>Score points for successful checkouts and time bonuses</li>
      </ul>
      {highScore > 0 && <p><strong>High Score:</strong> {highScore}</p>}
      <div className="card-container">
        <div className="card">
          <button className="start-game-button" onClick={startGame}>
            Start Challenge
          </button>
        </div>
      </div>
    </div>
  );

  // Render game complete screen
  const renderGameComplete = () => (
    <div className="game-complete">
      <div className="header-section">
        <h2>Challenge Complete!</h2>
        <p>Final Score: <strong style={{ color: getScoreColor(gameState.currentScore) }}>{gameState.currentScore}</strong></p>
        {gameState.currentScore > highScore && <div className="new-high-score">New High Score!</div>}
      </div>

      <div className="game-stats">
        <div className="time-stats">
          <h3>Time Statistics</h3>
          <p>Total Time: {gameState.totalTime.toFixed(2)} seconds</p>
          <p>Average Time per Checkout: {(gameState.totalTime / TOTAL_CHECKOUTS).toFixed(2)} seconds</p>
        </div>

        {gameState.nonOptimalAttempts.length > 0 && (
          <div className="wrong-attempts">
            <h4>Non-Optimal Checkouts ({gameState.nonOptimalAttempts.length})</h4>
            {gameState.nonOptimalAttempts.slice(0, 5).map((attempt, index) => (
              <div className="wrong-attempt" key={index}>
                <p>Checkout {attempt.checkout}: {attempt.attempt.join(', ')}</p>
                <p>Optimal: {attempt.optimalCheckout.join(', ')}</p>
                <p>Stage: {attempt.stage === 'initial' ? 'Initial Checkout' : 'Adjustment'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={startGame}>Play Again</button>
    </div>
  );

  // Updated DartHit component
  const DartHit = ({ section }: { section: string }) => (
    <span className="dart-hit">
      {section}
    </span>
  );

  // Get an array of simulated throws for visualization
  const getSimulatedThrows = (): string[] => {
    const throws: string[] = [];
    if (gameState.simulatedThrow1) {
      throws.push(gameState.simulatedThrow1);
    }
    if (gameState.simulatedThrow2) {
      throws.push(gameState.simulatedThrow2);
    }
    return throws;
  };

  // Main render method
  return (
    <div className="speed-game">
      {!gameState.hasStarted ? (
        renderStartScreen()
      ) : gameState.isGameComplete ? (
        renderGameComplete()
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

          <div className="game-content">
            {gameState.gameStage === 'initial' ? (
              <h2>Checkout: {gameState.currentCheckout}</h2>
            ) : (
              <div className="adjustment-header">
                <h2>
                  Original Checkout: {gameState.currentCheckout} 
                  ({gameState.originalCheckout.join(' → ')})
                </h2>
                <div className="simulated-darts">
                  <p>Actual Darts:</p>
                  <div className="dart-hits">
                    {gameState.simulatedThrow1 && (
                      <DartHit section={gameState.simulatedThrow1} />
                    )}
                    {gameState.simulatedThrow2 && (
                      <DartHit section={gameState.simulatedThrow2} />
                    )}
                  </div>
                  <p>
                    {gameState.dartsRemaining === 1 
                      ? "You have 1 dart left" 
                      : `You have ${gameState.dartsRemaining} darts left`}
                  </p>
                </div>
              </div>
            )}

            <div className="dartboard-container">
              <Dartboard 
                onSectionClick={handleDartThrow} 
                currentThrows={gameState.currentThrows}
                simulatedThrows={gameState.gameStage === 'adjusting' ? getSimulatedThrows() : []}
              />
            </div>

            <div className="side-panel">
              <div className="attempt-display">
                <h3>
                  {gameState.gameStage === 'initial' 
                    ? `Choose checkout for ${gameState.currentCheckout}` 
                    : gameState.remainingScore 
                      ? `Choose what to hit with your remaining darts`
                      : 'Choose what to hit'}
                </h3>
                <p>
                  {gameState.currentThrows.length > 0 
                    ? gameState.currentThrows.join(' → ') 
                    : 'Select darts on the board'}
                </p>
              </div>

              <div className="message">
                {gameState.message}
              </div>

              <div className="controls">
                <button 
                  className="validate-button"
                  onClick={handleSubmit}
                  disabled={gameState.currentThrows.length === 0}
                >
                  {gameState.gameStage === 'initial' ? 'Submit Checkout' : 'Submit Adjustment'}
                </button>
                <button 
                  className="reset-button"
                  onClick={handleReset}
                  disabled={gameState.currentThrows.length === 0}
                >
                  Reset Throws
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdaptiveGame;