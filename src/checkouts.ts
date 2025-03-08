interface Checkout {
  score: number;
  combinations: string[][];
  optimalCombinations?: string[][]; // Optimal solutions will be stored here
}

interface ValidationResult {
  isValid: boolean;
  isOptimal: boolean;
  message: string;
}

// Helper function to calculate the value of a dart throw
const calculateValue = (dart: string): number => {
  if (dart === '25') return 25;
  if (dart === 'BULL') return 50;
  
  const multiplier = dart[0];
  const number = parseInt(dart.slice(1));
  
  switch (multiplier) {
    case 'T': return number * 3;
    case 'D': return number * 2;
    case 'S': return number;
    default: return 0;
  }
};

// Helper function to validate if a sequence of darts equals the target score
// and ends with a double
function isValidCheckout(score: number, attempt: string[]): boolean {
  // Validate the checkout attempt
  let remainingScore = score;
  
  for (let i = 0; i < attempt.length - 1; i++) {
    const value = calculateValue(attempt[i]);
    if (value === undefined || value > remainingScore) {
      return false;
    }
    remainingScore -= value;
  }

  // Last dart must be a double or BULL
  const lastDart = attempt[attempt.length - 1];
  const lastValue = calculateValue(lastDart);
  return lastValue === remainingScore && (lastDart.startsWith('D') || lastDart === 'BULL');
}

// Helper function to count the number of darts in a combination
const countDarts = (combination: string[]): number => combination.length;

// Helper function to evaluate the difficulty of a dart throw
const evaluateDifficulty = (dart: string): number => {
  if (dart === 'BULL') return 5;
  if (dart === '25') return 4;
  
  const multiplier = dart[0];
  const number = parseInt(dart.slice(1));
  
  switch (multiplier) {
    case 'T': return 3;
    case 'D': return 2;
    case 'S': return 1;
    default: return 0;
  }
};

// Helper function to calculate the total difficulty of a combination
const calculateDifficulty = (combination: string[]): number => {
  return combination.reduce((total, dart) => total + evaluateDifficulty(dart), 0);
};

// Helper function to determine if a combination is optimal
const isOptimalCombination = (combination: string[], otherCombinations: string[][]): boolean => {
  const combinationDarts = countDarts(combination);
  const combinationDifficulty = calculateDifficulty(combination);

  // Check if any other combination is better
  for (const other of otherCombinations) {
    if (combination === other) continue;
    
    const otherDarts = countDarts(other);
    const otherDifficulty = calculateDifficulty(other);
    
    // A combination is better if:
    // 1. It uses fewer darts, or
    // 2. It uses the same number of darts but has a lower difficulty score
    if (otherDarts < combinationDarts || 
        (otherDarts === combinationDarts && otherDifficulty < combinationDifficulty)) {
      return false;
    }
  }
  return true;
};

// Helper function to get optimal combinations for a score
const getOptimalCombinations = (combinations: string[][]): string[][] => {
  if (combinations.length === 0) return [];
  
  return combinations.filter(combo => isOptimalCombination(combo, combinations));
};

export const checkouts: Checkout[] = [
  {
    score: 170,
    combinations: [['T20', 'T20', 'BULL']],
    optimalCombinations: [['T20', 'T20', 'BULL']]
  },
  {
    score: 167,
    combinations: [['T20', 'T19', 'BULL']],
    optimalCombinations: [['T20', 'T19', 'BULL']]
  },
  {
    score: 164,
    combinations: [['T20', 'T18', 'BULL']],
    optimalCombinations: [['T20', 'T18', 'BULL']]
  },
  {
    score: 161,
    combinations: [['T20', 'T17', 'BULL']],
    optimalCombinations: [['T20', 'T17', 'BULL']]
  },
  {
    score: 160,
    combinations: [['T20', 'T20', 'D20']],
    optimalCombinations: [['T20', 'T20', 'D20']]
  },
  {
    score: 158,
    combinations: [['T20', 'T20', 'D19']],
    optimalCombinations: [['T20', 'T20', 'D19']]
  },
  {
    score: 157,
    combinations: [['T20', 'T19', 'D20']],
    optimalCombinations: [['T20', 'T19', 'D20']]
  },
  {
    score: 156,
    combinations: [['T20', 'T20', 'D18']],
    optimalCombinations: [['T20', 'T20', 'D18']]
  },
  {
    score: 155,
    combinations: [['T20', 'T19', 'D19']],
    optimalCombinations: [['T20', 'T19', 'D19']]
  },
  {
    score: 154,
    combinations: [['T20', 'T18', 'D20']],
    optimalCombinations: [['T20', 'T18', 'D20']]
  },
  {
    score: 113,
    combinations: [
      ['T20', 'S13', 'D20'],
      ['T19', 'S16', 'D20'],
      ['T19', 'D19'],
      ['T20', 'D16'],
    ],
    optimalCombinations: [
      ['T19', 'D19'],
      ['T20', 'D16']
    ]
  },
  {
    score: 60,
    combinations: [
      ['S20', 'S20', 'D10'],
      ['S20', 'D20']
    ],
    optimalCombinations: [['S20', 'D20']]
  }
  // Add more common checkouts here
];

export const isCheckoutPossible = (score: number): boolean => {
  // A checkout is possible if:
  // 1. The score is 170 or less
  // 2. The score is 2 or more
  // 3. The score is even OR can be reduced to an even number with available throws
  if (score > 170 || score < 2) return false;
  
  // For scores above 99, check if they're in our predefined checkouts
  if (score > 99) {
    return checkouts.some(checkout => checkout.score === score);
  }
  
  // For scores 2-99:
  // Must be able to end on a double
  return score % 2 === 0 || // If it's even, we can checkout
         score <= 57;       // If it's odd and ≤57, we can use single/triple to make it even
};

export const getCheckoutCombinations = (score: number): string[][] => {
  const checkout = checkouts.find(c => c.score === score);
  if (checkout) {
    return checkout.combinations;
  }
  
  // For lower numbers or numbers not in the database,
  // calculate a simple checkout if possible
  if (score <= 40 && score % 2 === 0) {
    return [[`D${score/2}`]];
  }
  return [];
};

// Helper function to generate all possible single dart values
function getAllPossibleDartValues(): string[] {
  const darts: string[] = [];
  
  // Singles (1-20)
  for (let i = 1; i <= 20; i++) {
    darts.push(`S${i}`);
  }
  
  // Doubles (1-20)
  for (let i = 1; i <= 20; i++) {
    darts.push(`D${i}`);
  }
  
  // Triples (1-20)
  for (let i = 1; i <= 20; i++) {
    darts.push(`T${i}`);
  }
  
  // Bull (25) and Double Bull (50)
  darts.push('25');
  darts.push('BULL');
  
  return darts;
}

// Helper function to find all possible checkout combinations for a score
const findAllCheckoutCombinations = (score: number): string[][] => {
  const allDarts = getAllPossibleDartValues();
  const combinations: string[][] = [];
  const maxDarts = 3;

  // Helper function to find combinations recursively
  const findCombinations = (
    remainingScore: number,
    currentCombo: string[],
    isLastDart: boolean,
    dartsLeft: number
  ) => {
    // Base cases
    if (remainingScore < 0 || dartsLeft < 0) return;
    if (remainingScore === 0) {
      // Check if last dart is a double or bull
      const lastDart = currentCombo[currentCombo.length - 1];
      if (lastDart?.startsWith('D') || lastDart === 'BULL') {
        combinations.push([...currentCombo]);
      }
      return;
    }

    // For the last dart, only try doubles and bull
    const possibleDarts = isLastDart
      ? allDarts.filter(d => (d.startsWith('D') || d === 'BULL') && calculateValue(d) <= remainingScore)
      : allDarts.filter(d => calculateValue(d) <= remainingScore);

    for (const dart of possibleDarts) {
      // For non-last darts, prefer singles over doubles/25 when possible
      if (!isLastDart && 
          (dart.startsWith('D') || dart === '25' || dart === 'BULL')) {
        const singleEquivalent = allDarts.find(d => 
          d.startsWith('S') && calculateValue(d) === calculateValue(dart)
        );
        if (singleEquivalent) continue;
      }

      findCombinations(
        remainingScore - calculateValue(dart),
        [...currentCombo, dart],
        dartsLeft === 1,
        dartsLeft - 1
      );
    }
  };

  // Try with 1, 2, and 3 darts
  for (let numDarts = 1; numDarts <= maxDarts; numDarts++) {
    findCombinations(score, [], numDarts === 1, numDarts);
  }

  return combinations;
};

// Helper function to normalize dart notation
const normalizeDartNotation = (dart: string): string => {
  // Treat 25 and BULL as equivalent for validation
  if (dart === '25' || dart === 'BULL') return 'BULL';
  return dart;
};

// Helper function to validate a checkout attempt
export function validateAttempt(score: number, attempt: string[]): ValidationResult {
  // If no checkout is possible, any attempt is invalid
  if (!isCheckoutPossible(score)) {
    return {
      isValid: false,
      isOptimal: false,
      message: 'No checkout possible for this score.'
    };
  }

  // Check if the attempt is valid
  if (!isValidCheckout(score, attempt)) {
    return {
      isValid: false,
      isOptimal: false,
      message: 'Invalid checkout attempt.'
    };
  }

  // Find all possible checkouts for this score
  const allPossibleCheckouts = generateAllCheckouts(score);
  
  // Find the minimum number of darts needed for this score
  const minDarts = Math.min(...allPossibleCheckouts.map(checkout => checkout.length));
  
  // A solution is optimal if it uses the minimum number of darts possible
  const isOptimal = attempt.length <= minDarts;

  // Generate appropriate message
  let message = 'Valid checkout! ';
  if (!isOptimal) {
    message += `There exists a solution using ${minDarts} dart${minDarts === 1 ? '' : 's'} instead of ${attempt.length}.`;
  } else if (attempt.length === minDarts) {
    message += 'This is an optimal solution using the minimum number of darts possible.';
  }

  return {
    isValid: true,
    isOptimal,
    message
  };
}

// Add this function to generate all possible checkouts
function generateAllCheckouts(score: number): string[][] {
  const allCheckouts: string[][] = [];
  const possibleDarts = getAllPossibleDartValues();

  // Helper function for recursive generation
  function generateCheckouts(remaining: number, currentAttempt: string[]) {
    // Base case: if remaining score is 0 and last dart is valid
    if (remaining === 0 && (currentAttempt[currentAttempt.length - 1]?.startsWith('D') || 
                           currentAttempt[currentAttempt.length - 1] === 'BULL')) {
      allCheckouts.push([...currentAttempt]);
      return;
    }

    // Don't continue if we've used 3 darts or the remaining score is invalid
    if (currentAttempt.length >= 3 || remaining < 0) {
      return;
    }

    // For the last dart, only try doubles and BULL
    if (currentAttempt.length === 2) {
      const doubles = possibleDarts.filter(d => d.startsWith('D') || d === 'BULL');
      for (const dart of doubles) {
        const value = calculateValue(dart);
        if (value === remaining) {
          generateCheckouts(0, [...currentAttempt, dart]);
        }
      }
      return;
    }

    // Try all possible darts
    for (const dart of possibleDarts) {
      const value = calculateValue(dart);
      if (value && value <= remaining) {
        generateCheckouts(remaining - value, [...currentAttempt, dart]);
      }
    }
  }

  generateCheckouts(score, []);
  return allCheckouts;
} 