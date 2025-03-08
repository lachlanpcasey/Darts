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
  totalTime: number;
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
  nonOptimalAttempts: Array<{
    checkout: number;
    attempt: string[];
    optimalCheckout: string[];
  }>;
}

interface ScoreRecord {
  score: number;
  date: string;
  averageTime: number;
}

interface CheckoutAttempt {
  gameNumber: number;
  checkout: number;
  time: number;
  isSuccessful: boolean;
  attempt: string[];
  optimalCheckout: string[];
}

interface CheckoutStats {
  number: number;
  attempts: number;
  successfulAttempts: number;
  times: number[];
}

interface GameStats {
  checkoutStats: { [key: number]: CheckoutStats };
  checkoutAttempts: CheckoutAttempt[];
  totalGames: number;
  totalTime: number;
}

const TOTAL_CHECKOUTS = 1;
const TIME_BONUS_CUTOFF = 15; // seconds
const MAX_TIME_BONUS = 1000; // points
const MAX_RECENT_SCORES = 5;

// Generate valid checkouts between 41 and 170
function generateValidCheckouts(): number[] {
  // Define preset valid checkouts instead of calculating them
  const validCheckouts = [
    // High checkouts (120-170)
    170, 167, 164, 161, 160, 158, 157, 156, 155, 154, 153, 152, 151, 150,
    149, 148, 147, 146, 145, 144, 143, 142, 141, 140, 139, 138, 137, 136,
    135, 134, 133, 132, 131, 130, 129, 128, 127, 126, 125, 124, 123, 122, 121, 120,
    
    // Medium checkouts (81-120)
    119, 118, 117, 116, 115, 114, 113, 112, 111, 110, 109, 108, 107, 106,
    105, 104, 103, 102, 101, 100, 99, 98, 97, 96, 95, 94, 93, 92, 91, 90,
    89, 88, 87, 86, 85, 84, 83, 82, 81,
    
    // Low checkouts (41-80)
    80, 79, 78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 64,
    63, 62, 61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51, 50, 49, 48, 47,
    46, 45, 44, 43, 42, 41
  ];
  
  return validCheckouts;
}

const VALID_CHECKOUTS = generateValidCheckouts();
console.log('Valid checkouts generated:', VALID_CHECKOUTS);

const SpeedGame: React.FC<SpeedGameProps> = ({ onGameComplete }) => {
  const [gameState, setGameState] = useState<GameState>({
    currentScore: 0,
    checkoutsCompleted: 0,
    currentCheckout: 0,
    startTime: 0,
    totalTime: 0,
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
    wrongAttempts: [],
    nonOptimalAttempts: []
  });

  const [highScore, setHighScore] = useState<number>(0);
  const [recentScores, setRecentScores] = useState<ScoreRecord[]>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    checkoutStats: {},
    checkoutAttempts: [],
    totalGames: 0,
    totalTime: 0
  });

  // Helper function to get random checkouts with better distribution
  const getRandomCheckouts = (count: number): number[] => {
    // Safety check
    if (count <= 0) return [];
    
    // Get all valid checkouts from the predefined checkouts array
    const allValidCheckouts = VALID_CHECKOUTS.filter(n => !isNaN(n));

    // Split checkouts into ranges
    const ranges = {
      low: allValidCheckouts.filter(n => n <= 80),
      medium: allValidCheckouts.filter(n => n > 80 && n <= 120),
      high: allValidCheckouts.filter(n => n > 120 && n <= 170)
    };

    const selectedCheckouts: number[] = [];
    
    // Helper to get random item from array
    const getRandomItem = (arr: number[]): number | null => {
      if (!arr || arr.length === 0) return null;
      return arr[Math.floor(Math.random() * arr.length)];
    };
    
    // For 5 checkouts, try to get: 2 high, 2 medium, 1 low
    if (count === TOTAL_CHECKOUTS) {
      // Add 1 very high checkout (150+)
      const veryHighCheckouts = ranges.high.filter(n => n >= 150);
      const veryHigh = getRandomItem(veryHighCheckouts);
      if (veryHigh) selectedCheckouts.push(veryHigh);

      // Add 1 high checkout (120-149)
      const highCheckouts = ranges.high.filter(n => n < 150 && !selectedCheckouts.includes(n));
      const high = getRandomItem(highCheckouts);
      if (high) selectedCheckouts.push(high);
      
      // Add 2 medium checkouts (81-120)
      for (let i = 0; i < 2 && selectedCheckouts.length < count; i++) {
        const availableMedium = ranges.medium.filter(n => !selectedCheckouts.includes(n));
        const medium = getRandomItem(availableMedium);
        if (medium) selectedCheckouts.push(medium);
      }
      
      // Add 1 low checkout (41-80)
      if (selectedCheckouts.length < count) {
        const availableLow = ranges.low.filter(n => !selectedCheckouts.includes(n));
        const low = getRandomItem(availableLow);
        if (low) selectedCheckouts.push(low);
      }

      // If we still don't have enough checkouts, fill with random ones
      while (selectedCheckouts.length < count) {
        const available = allValidCheckouts.filter(n => !selectedCheckouts.includes(n));
        const random = getRandomItem(available);
        if (random) selectedCheckouts.push(random);
        else break; // Prevent infinite loop
      }
      
      // Shuffle the final array
      return selectedCheckouts.sort(() => Math.random() - 0.5);
    }
    
    // For single checkout, use weighted random
    const weightedCheckouts = [
      ...ranges.high, ...ranges.high,  // Double weight for high
      ...ranges.medium,                // Normal weight for medium
      ...ranges.low                    // Normal weight for low
    ];
    
    const single = getRandomItem(weightedCheckouts);
    return single ? [single] : [getRandomItem(allValidCheckouts) || 60]; // Fallback to 60 if all else fails
  };

  // Load scores and stats from localStorage on component mount
  useEffect(() => {
    const storedHighScore = localStorage.getItem('speedGameHighScore');
    const storedRecentScores = localStorage.getItem('speedGameRecentScores');
    const storedStats = localStorage.getItem('speedGameStats');
    
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore));
    }
    if (storedRecentScores) {
      setRecentScores(JSON.parse(storedRecentScores));
    }
    if (storedStats) {
      setGameStats(JSON.parse(storedStats));
    }
  }, []);

  // Update high score and recent scores
  const updateScores = (newScore: number) => {
    // Calculate average time directly from the total time
    const averageTime = gameState.totalTime;

    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('speedGameHighScore', newScore.toString());
    }

    const newScoreRecord: ScoreRecord = {
      score: newScore,
      date: new Date().toLocaleDateString(),
      averageTime
    };

    const updatedRecentScores = [newScoreRecord, ...recentScores].slice(0, MAX_RECENT_SCORES);
    setRecentScores(updatedRecentScores);
    localStorage.setItem('speedGameRecentScores', JSON.stringify(updatedRecentScores));

    updateStats(averageTime);
  };

  // Load stats from localStorage on mount
  useEffect(() => {
    const storedStats = localStorage.getItem('speedGameStats');
    if (storedStats) {
      setGameStats(JSON.parse(storedStats));
    }
  }, []);

  // Update stats when game completes
  const updateStats = (averageTime: number) => {
    setGameStats(prev => {
      const newStats = {
        ...prev,
        totalGames: prev.totalGames + 1,
        totalTime: prev.totalTime + averageTime
      };

      // Get all attempted checkouts from this game
      const allAttempts = [
        ...gameState.wrongAttempts,
        ...gameState.nonOptimalAttempts,
        // Include successful attempts that aren't in the other arrays
        {
          checkout: gameState.currentCheckout,
          attempt: gameState.currentThrows,
          optimalCheckout: getOptimalCheckout(gameState.currentCheckout)
        }
      ];

      // Add new attempts with game number
      const newAttempts = allAttempts.map(attempt => ({
        gameNumber: newStats.totalGames,
        checkout: attempt.checkout,
        time: averageTime,
        isSuccessful: !gameState.wrongAttempts.find(w => w.checkout === attempt.checkout),
        attempt: attempt.attempt,
        optimalCheckout: attempt.optimalCheckout
      }));

      newStats.checkoutAttempts = [...prev.checkoutAttempts, ...newAttempts];

      // Update stats for each checkout attempted in this game
      allAttempts.forEach(attempt => {
        const currentStats = prev.checkoutStats[attempt.checkout] || {
          number: attempt.checkout,
          attempts: 0,
          successfulAttempts: 0,
          times: []
        };

        const isSuccessful = !gameState.wrongAttempts.find(w => w.checkout === attempt.checkout);

        newStats.checkoutStats[attempt.checkout] = {
          ...currentStats,
          attempts: currentStats.attempts + 1,
          successfulAttempts: currentStats.successfulAttempts + (isSuccessful ? 1 : 0),
          times: [...currentStats.times, averageTime]
        };
      });

      localStorage.setItem('speedGameStats', JSON.stringify(newStats));
      return newStats;
    });
  };

  // Helper function to get median time for a checkout
  const getMedianTime = (times: number[]): number => {
    if (times.length === 0) return 0;
    const sorted = [...times].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  };

  // Helper function to get best and worst checkouts
  const getCheckoutPerformance = () => {
    const checkouts = Object.values(gameStats.checkoutStats)
      .filter(stat => stat.times.length >= 1) // Changed from 2 to 1 to show stats after first attempt
      .map(stat => ({
        number: stat.number,
        medianTime: getMedianTime(stat.times),
        successRate: (stat.successfulAttempts / stat.attempts) * 100
      }))
      .sort((a, b) => a.medianTime - b.medianTime);

    return {
      best: checkouts.slice(0, 3),
      worst: checkouts.slice(-3).reverse()
    };
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
      
      const newGameState = {
        currentScore: 0,
        checkoutsCompleted: 0,
        currentCheckout: checkouts[0],
        startTime: Date.now(),
        totalTime: 0,
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
        wrongAttempts: [],
        nonOptimalAttempts: []
      };
      
      console.log('Setting new game state:', newGameState);
      setGameState(newGameState);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  // Calculate time bonus based on how quickly the checkout was completed
  const calculateTimeBonus = (timeTaken: number): number => {
    if (timeTaken > TIME_BONUS_CUTOFF) return 0;
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

  // Handle submit
  const handleSubmit = () => {
    const validation = validateAttempt(gameState.currentThrows, gameState.currentCheckout);
    const optimalCheckout = getOptimalCheckout(gameState.currentCheckout);
    const timeTaken = (Date.now() - gameState.startTime) / 1000;
    const timeBonus = calculateTimeBonus(timeTaken);
    
    let pointsEarned = 0;
    let isOptimal = false;
    
    if (validation.isValid) {
      // Store the raw time without dividing
      setGameState(prev => ({
        ...prev,
        totalTime: timeTaken
      }));

      // Check if the attempt matches the optimal checkout exactly
      if (gameState.currentThrows.join(' ') === optimalCheckout.join(' ')) {
        pointsEarned = 300;
        isOptimal = true;
      }
      // Check if the attempt uses the same number of darts as optimal
      else if (gameState.currentThrows.length === optimalCheckout.length) {
        pointsEarned = 250;
        // Store non-optimal but valid attempt
        setGameState(prev => ({
          ...prev,
          nonOptimalAttempts: [...prev.nonOptimalAttempts, {
            checkout: prev.currentCheckout,
            attempt: prev.currentThrows,
            optimalCheckout
          }]
        }));
      }
      // Valid but not optimal number of darts
      else {
        pointsEarned = 50;
        // Store non-optimal attempt
        setGameState(prev => ({
          ...prev,
          nonOptimalAttempts: [...prev.nonOptimalAttempts, {
            checkout: prev.currentCheckout,
            attempt: prev.currentThrows,
            optimalCheckout
          }]
        }));
      }
    } else {
      // Store wrong attempt
      setGameState(prev => ({
        ...prev,
        wrongAttempts: [...prev.wrongAttempts, {
          checkout: prev.currentCheckout,
          attempt: prev.currentThrows,
          optimalCheckout
        }]
      }));
    }

    const finalScore = gameState.currentScore + pointsEarned + timeBonus;
    const nextCheckoutIndex = gameState.checkoutsCompleted + (validation.isValid ? 1 : 0);
    const isGameComplete = nextCheckoutIndex >= TOTAL_CHECKOUTS;

    let message = validation.isValid
      ? `Correct! ${isOptimal ? 'Perfect checkout! ' : ''} +${pointsEarned} points${timeBonus > 0 ? ` (+${timeBonus} time bonus)` : ''}`
      : 'Wrong attempt. Try again!';

    setGameState(prev => ({
      ...prev,
      showScoreAnimation: {
        show: validation.isValid,
        points: pointsEarned + timeBonus,
        isOptimal
      },
      showWrongAnimation: !validation.isValid
    }));

    setTimeout(() => {
      if (isGameComplete) {
        updateScores(finalScore);
      }

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
    if (score >= 2500) return '#27ae60'; // Perfect game
    if (score >= 2000) return '#2ecc71'; // Very good
    if (score >= 1500) return '#f1c40f'; // Good
    if (score >= 1000) return '#e67e22'; // Average
    return '#e74c3c'; // Below average
  };

  const renderGraph = (times: number[]) => {
    if (times.length === 0) return null;

    // Reverse the times array so most recent is on the right
    const displayTimes = [...times].reverse();
    const maxTime = Math.max(...displayTimes, TIME_BONUS_CUTOFF + 5); // Add padding above threshold
    const minTime = Math.min(...displayTimes, 0);
    const padding = 40;
    const width = 400;
    const height = 300;
    
    // Create points for the line
    const points = displayTimes.map((time, index) => {
      const x = padding + ((width - padding * 2) * (index / (displayTimes.length - 1)));
      const y = height - padding - ((height - padding * 2) * ((time - minTime) / (maxTime - minTime)));
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="time-graph">
        <h4>Last 10 Games Performance</h4>
        <div className="graph-container">
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            {/* Draw horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = height - padding - (ratio * (height - padding * 2));
              const timeValue = minTime + (ratio * (maxTime - minTime));
              return (
                <g key={ratio}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="#e0e0e0"
                    strokeWidth="1"
                  />
                  <text
                    x={padding - 5}
                    y={y}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    className="graph-axis-label"
                  >
                    {timeValue.toFixed(1)}s
                  </text>
                </g>
              );
            })}

            {/* Draw vertical grid lines and game numbers */}
            {displayTimes.map((_, index) => {
              const x = padding + ((width - padding * 2) * (index / (Math.max(displayTimes.length - 1, 1))));
              return (
                <g key={`grid-${index}`}>
                  <line
                    x1={x}
                    y1={padding}
                    x2={x}
                    y2={height - padding}
                    stroke="#e0e0e0"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={height - padding + 20}
                    textAnchor="middle"
                    className="graph-label"
                  >
                    {displayTimes.length - index}
                  </text>
                </g>
              );
            })}

            {/* Draw the line */}
            <polyline
              points={points}
              fill="none"
              stroke="#2ecc71"
              strokeWidth="2"
            />

            {/* Draw data points */}
            {displayTimes.map((time, index) => {
              const x = padding + ((width - padding * 2) * (index / (Math.max(displayTimes.length - 1, 1))));
              const y = height - padding - ((height - padding * 2) * ((time - minTime) / (maxTime - minTime)));
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#2ecc71"
                    stroke="white"
                    strokeWidth="2"
                  />
                </g>
              );
            })}

            {/* Add axis labels */}
            <text
              x={width / 2}
              y={height - 5}
              textAnchor="middle"
              className="graph-axis-label"
            >
              Games Ago
            </text>
            <text
              x={-height / 2}
              y={15}
              textAnchor="middle"
              transform={`rotate(-90, 15, ${height / 2})`}
              className="graph-axis-label"
            >
              Time (seconds)
            </text>
          </svg>
        </div>
      </div>
    );
  };

  const renderStatistics = () => {
    const { best, worst } = getCheckoutPerformance();
    const allTimeAverage = gameStats.totalTime / (gameStats.totalGames * TOTAL_CHECKOUTS);
    
    // Get the last 10 unique game numbers
    const lastTenGames = [...new Set(gameStats.checkoutAttempts
      .map(attempt => attempt.gameNumber))]
      .sort((a, b) => b - a)
      .slice(0, 10);

    // Calculate average time for each game
    const lastTenGameTimes = lastTenGames.map(gameNumber => {
      const gameAttempts = gameStats.checkoutAttempts
        .filter(attempt => attempt.gameNumber === gameNumber);
      return gameAttempts.reduce((sum, attempt) => sum + attempt.time, 0) / gameAttempts.length;
    });

    // Calculate recent average from the last 5 games
    const recentAverage = lastTenGameTimes.slice(0, 5).length > 0
      ? lastTenGameTimes.slice(0, 5).reduce((a, b) => a + b, 0) / lastTenGameTimes.slice(0, 5).length
      : 0;

    return (
      <div className="statistics">
        <h3>Statistics</h3>
        
        <div className="time-stats">
          <h4>Time Performance</h4>
          <p>Last 5 Games Average: {recentAverage.toFixed(2)} seconds per checkout</p>
          <p>All-Time Average: {allTimeAverage.toFixed(2)} seconds per checkout</p>
          <p>Total Games Played: {gameStats.totalGames}</p>
          
          {lastTenGameTimes.length > 0 && renderGraph(lastTenGameTimes)}
        </div>

        <div className="checkout-stats">
          <div className="best-checkouts">
            <h4>Best Checkouts</h4>
            {best.map(checkout => (
              <div key={checkout.number} className="checkout-stat">
                <p>Checkout {checkout.number}</p>
                <p>Average Time: {checkout.medianTime.toFixed(2)}s</p>
                <p>Success Rate: {checkout.successRate.toFixed(1)}%</p>
              </div>
            ))}
          </div>

          <div className="worst-checkouts">
            <h4>Most Challenging Checkouts</h4>
            {worst.map(checkout => (
              <div key={checkout.number} className="checkout-stat">
                <p>Checkout {checkout.number}</p>
                <p>Average Time: {checkout.medianTime.toFixed(2)}s</p>
                <p>Success Rate: {checkout.successRate.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStartScreen = () => (
    <div className="start-screen">
      <h2>Speed Checkout Game</h2>
      <p>Complete {TOTAL_CHECKOUTS} checkouts as quickly as possible.</p>
      <p>Scoring:</p>
      <ul>
        <li>Perfect checkout: 300 points</li>
        <li>Same number of darts as optimal: 250 points</li>
        <li>Valid but not optimal: 50 points</li>
        <li>Time bonus: up to {MAX_TIME_BONUS} points (decreases over {TIME_BONUS_CUTOFF} seconds)</li>
      </ul>
      <button onClick={(e) => {
        console.log('Start button clicked');
        startGame();
      }}>Start Game</button>
      
      {gameStats.totalGames > 0 && renderStatistics()}
    </div>
  );

  const renderGameComplete = () => {
    const averageTime = gameState.totalTime / TOTAL_CHECKOUTS;
    const { best, worst } = getCheckoutPerformance();
    
    // Get the last 10 unique game numbers
    const lastTenGames = [...new Set(gameStats.checkoutAttempts
      .map(attempt => attempt.gameNumber))]
      .sort((a, b) => b - a)
      .slice(0, 10);

    // Calculate average time for each game
    const lastTenGameTimes = lastTenGames.map(gameNumber => {
      const gameAttempts = gameStats.checkoutAttempts
        .filter(attempt => attempt.gameNumber === gameNumber);
      return gameAttempts.reduce((sum, attempt) => sum + attempt.time, 0) / gameAttempts.length;
    });

    // Calculate recent average from the last 5 games
    const recentAverage = lastTenGameTimes.slice(0, 5).length > 0
      ? lastTenGameTimes.slice(0, 5).reduce((a, b) => a + b, 0) / lastTenGameTimes.slice(0, 5).length
      : 0;

    return (
      <div className="game-complete">
        <div className="header-section">
          <h2>Game Complete!</h2>
          <p className="final-score" style={{ color: getScoreColor(gameState.currentScore) }}>
            Final Score: {gameState.currentScore}
          </p>
          <p className="average-time">
            Average Time per Checkout: {averageTime.toFixed(2)} seconds
          </p>
        </div>

        <div className="game-stats">
          <h3>Your Statistics</h3>
          <div className="time-stats">
            <h4>Time Performance</h4>
            <p>Last 5 Games Average: {recentAverage.toFixed(2)} seconds per checkout</p>
            <p>All-Time Average: {
              (gameStats.totalTime / (gameStats.totalGames * TOTAL_CHECKOUTS)).toFixed(2)
            } seconds per checkout</p>
            <p>Total Games Played: {gameStats.totalGames}</p>

            {lastTenGameTimes.length > 0 && renderGraph(lastTenGameTimes)}
          </div>

          <div className="checkout-stats">
            <div className="best-checkouts">
              <h4>Your Best Checkouts</h4>
              {best.map(checkout => (
                <div key={checkout.number} className="checkout-stat">
                  <p>Checkout {checkout.number}</p>
                  <p>Average Time: {checkout.medianTime.toFixed(2)}s</p>
                  <p>Success Rate: {checkout.successRate.toFixed(1)}%</p>
                </div>
              ))}
            </div>

            <div className="worst-checkouts">
              <h4>Your Most Challenging Checkouts</h4>
              {worst.map(checkout => (
                <div key={checkout.number} className="checkout-stat">
                  <p>Checkout {checkout.number}</p>
                  <p>Average Time: {checkout.medianTime.toFixed(2)}s</p>
                  <p>Success Rate: {checkout.successRate.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="attempts-section">
          {gameState.wrongAttempts.length > 0 && (
            <div className="wrong-attempts">
              <h3>Wrong Attempts</h3>
              {gameState.wrongAttempts.map((attempt, index) => (
                <div key={`wrong-${index}`} className="attempt-review">
                  <p>Checkout {attempt.checkout}</p>
                  <p>Your attempt: {attempt.attempt.join(' → ')}</p>
                  <p>Optimal checkout: {attempt.optimalCheckout.join(' → ')}</p>
                </div>
              ))}
            </div>
          )}

          {gameState.nonOptimalAttempts.length > 0 && (
            <div className="non-optimal-attempts">
              <h3>Non-Optimal Checkouts</h3>
              {gameState.nonOptimalAttempts.map((attempt, index) => (
                <div key={`non-optimal-${index}`} className="attempt-review">
                  <p>Checkout {attempt.checkout}</p>
                  <p>Your attempt: {attempt.attempt.join(' → ')}</p>
                  <p>Optimal checkout: {attempt.optimalCheckout.join(' → ')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={startGame}>Play Again</button>
      </div>
    );
  };

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
              <div className="current-checkout">
                <h2>Checkout: {gameState.currentCheckout}</h2>
                <p className="message">{gameState.message}</p>
              </div>

              <Dartboard
                onSectionClick={handleDartThrow}
                currentThrows={gameState.currentThrows}
              />

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