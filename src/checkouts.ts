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
  // 170-161
  { score: 170, combinations: [['T20', 'T20', 'BULL']], optimalCombinations: [['T20', 'T20', 'BULL']] },
  { score: 167, combinations: [['T20', 'T19', 'BULL']], optimalCombinations: [['T20', 'T19', 'BULL']] },
  { score: 164, combinations: [['T20', 'T18', 'BULL']], optimalCombinations: [['T20', 'T18', 'BULL']] },
  { score: 161, combinations: [['T20', 'T17', 'BULL']], optimalCombinations: [['T20', 'T17', 'BULL']] },

  // 160-151
  { score: 160, combinations: [['T20', 'T20', 'D20']], optimalCombinations: [['T20', 'T20', 'D20']] },
  { score: 158, combinations: [['T20', 'T20', 'D19']], optimalCombinations: [['T20', 'T20', 'D19']] },
  { score: 157, combinations: [['T20', 'T19', 'D20']], optimalCombinations: [['T20', 'T19', 'D20']] },
  { score: 156, combinations: [['T20', 'T20', 'D18']], optimalCombinations: [['T20', 'T20', 'D18']] },
  { score: 155, combinations: [['T20', 'T19', 'D19']], optimalCombinations: [['T20', 'T19', 'D19']] },
  { score: 154, combinations: [['T20', 'T18', 'D20']], optimalCombinations: [['T20', 'T18', 'D20']] },
  { score: 153, combinations: [['T20', 'T19', 'D18']], optimalCombinations: [['T20', 'T19', 'D18']] },
  { score: 152, combinations: [['T20', 'T20', 'D16']], optimalCombinations: [['T20', 'T20', 'D16']] },
  { score: 151, combinations: [['T20', 'T17', 'D20']], optimalCombinations: [['T20', 'T17', 'D20']] },

  // 150-141
  { score: 150, combinations: [['T20', 'T18', 'D18']], optimalCombinations: [['T20', 'T18', 'D18']] },
  { score: 149, combinations: [['T20', 'T19', 'D16']], optimalCombinations: [['T20', 'T19', 'D16']] },
  { score: 148, combinations: [['T20', 'T20', 'D14']], optimalCombinations: [['T20', 'T20', 'D14']] },
  { score: 147, combinations: [['T20', 'T17', 'D18']], optimalCombinations: [['T20', 'T17', 'D18']] },
  { score: 146, combinations: [['T20', 'T18', 'D16']], optimalCombinations: [['T20', 'T18', 'D16']] },
  { score: 145, combinations: [['T20', 'T19', 'D14']], optimalCombinations: [['T20', 'T19', 'D14']] },
  { score: 144, combinations: [['T20', 'T20', 'D12']], optimalCombinations: [['T20', 'T20', 'D12']] },
  { score: 143, combinations: [['T20', 'T17', 'D16']], optimalCombinations: [['T20', 'T17', 'D16']] },
  { score: 142, combinations: [['T20', 'T18', 'D14']], optimalCombinations: [['T20', 'T18', 'D14']] },
  { score: 141, combinations: [['T20', 'T19', 'D12']], optimalCombinations: [['T20', 'T19', 'D12']] },

  // 140-131
  { score: 140, combinations: [['T20', 'T20', 'D10']], optimalCombinations: [['T20', 'T20', 'D10']] },
  { score: 139, combinations: [['T20', 'T13', 'D20']], optimalCombinations: [['T20', 'T13', 'D20']] },
  { score: 138, combinations: [['T20', 'T18', 'D12']], optimalCombinations: [['T20', 'T18', 'D12']] },
  { score: 137, combinations: [['T20', 'T19', 'D10']], optimalCombinations: [['T20', 'T19', 'D10']] },
  { score: 136, combinations: [['T20', 'T20', 'D8']], optimalCombinations: [['T20', 'T20', 'D8']] },
  { score: 135, combinations: [['T20', 'T15', 'D15']], optimalCombinations: [['T20', 'T15', 'D15']] },
  { score: 134, combinations: [['T20', 'T14', 'D16']], optimalCombinations: [['T20', 'T14', 'D16']] },
  { score: 133, combinations: [['T20', 'T19', 'D8']], optimalCombinations: [['T20', 'T19', 'D8']] },
  { score: 132, combinations: [['BULL', 'BULL', 'D16']], optimalCombinations: [['BULL', 'BULL', 'D16']] },
  { score: 131, combinations: [['T20', 'T13', 'D16']], optimalCombinations: [['T20', 'T13', 'D16']] },

  // 130-121
  { score: 130, combinations: [['T20', 'T20', 'D5']], optimalCombinations: [['T20', 'T20', 'D5']] },
  { score: 129, combinations: [['T19', 'T20', 'D6']], optimalCombinations: [['T19', 'T20', 'D6']] },
  { score: 128, combinations: [['T20', 'T20', 'D4']], optimalCombinations: [['T20', 'T20', 'D4']] },
  { score: 127, combinations: [['T20', 'T17', 'D8']], optimalCombinations: [['T20', 'T17', 'D8']] },
  { score: 126, combinations: [['T19', 'T19', 'D6']], optimalCombinations: [['T19', 'T19', 'D6']] },
  { score: 125, combinations: [['T20', 'T19', 'D4']], optimalCombinations: [['T20', 'T19', 'D4']] },
  { score: 124, combinations: [['T20', 'T16', 'D8']], optimalCombinations: [['T20', 'T16', 'D8']] },
  { score: 123, combinations: [['T19', 'T16', 'D9']], optimalCombinations: [['T19', 'T16', 'D9']] },
  { score: 122, combinations: [['T18', 'T20', 'D4']], optimalCombinations: [['T18', 'T20', 'D4']] },
  { score: 121, combinations: [['T20', 'T11', 'D14']], optimalCombinations: [['T20', 'T11', 'D14']] },

  // 120-111
  { score: 120, combinations: [['T20', 'S20', 'D20']], optimalCombinations: [['T20', 'S20', 'D20']] },
  { score: 119, combinations: [['T19', 'T12', 'D13']], optimalCombinations: [['T19', 'T12', 'D13']] },
  { score: 118, combinations: [['T20', 'S18', 'D20']], optimalCombinations: [['T20', 'S18', 'D20']] },
  { score: 117, combinations: [['T20', 'S17', 'D20']], optimalCombinations: [['T20', 'S17', 'D20']] },
  { score: 116, combinations: [['T20', 'S16', 'D20']], optimalCombinations: [['T20', 'S16', 'D20']] },
  { score: 115, combinations: [['T20', 'S15', 'D20']], optimalCombinations: [['T20', 'S15', 'D20']] },
  { score: 114, combinations: [['T20', 'S14', 'D20']], optimalCombinations: [['T20', 'S14', 'D20']] },
  { score: 113, combinations: [['T20', 'S13', 'D20']], optimalCombinations: [['T20', 'S13', 'D20']] },
  { score: 112, combinations: [['T20', 'S12', 'D20']], optimalCombinations: [['T20', 'S12', 'D20']] },
  { score: 111, combinations: [['T20', 'S11', 'D20']], optimalCombinations: [['T20', 'S11', 'D20']] },

  // 110-101
  { score: 110, combinations: [['T20', 'S10', 'D20']], optimalCombinations: [['T20', 'S10', 'D20']] },
  { score: 109, combinations: [['T20', 'S9', 'D20']], optimalCombinations: [['T20', 'S9', 'D20']] },
  { score: 108, combinations: [['T20', 'S8', 'D20']], optimalCombinations: [['T20', 'S8', 'D20']] },
  { score: 107, combinations: [['T19', 'S10', 'D20']], optimalCombinations: [['T19', 'S10', 'D20']] },
  { score: 106, combinations: [['T20', 'S6', 'D20']], optimalCombinations: [['T20', 'S6', 'D20']] },
  { score: 105, combinations: [['T20', 'S5', 'D20']], optimalCombinations: [['T20', 'S5', 'D20']] },
  { score: 104, combinations: [['T20', 'S4', 'D20']], optimalCombinations: [['T20', 'S4', 'D20']] },
  { score: 103, combinations: [['T19', 'S6', 'D20']], optimalCombinations: [['T19', 'S6', 'D20']] },
  { score: 102, combinations: [['T20', 'S2', 'D20']], optimalCombinations: [['T20', 'S2', 'D20']] },
  { score: 101, combinations: [['T20', 'S1', 'D20']], optimalCombinations: [['T20', 'S1', 'D20']] },

  // 100-91
  { score: 100, combinations: [['T20', 'D20']], optimalCombinations: [['T20', 'D20']] },
  { score: 99, combinations: [['T19', 'S2', 'D20']], optimalCombinations: [['T19', 'S2', 'D20']] },
  { score: 98, combinations: [['T20', 'D19']], optimalCombinations: [['T20', 'D19']] },
  { score: 97, combinations: [['T19', 'D20']], optimalCombinations: [['T19', 'D20']] },
  { score: 96, combinations: [['T20', 'D18']], optimalCombinations: [['T20', 'D18']] },
  { score: 95, combinations: [['T19', 'D19']], optimalCombinations: [['T19', 'D19']] },
  { score: 94, combinations: [['T18', 'D20']], optimalCombinations: [['T18', 'D20']] },
  { score: 93, combinations: [['T19', 'D18']], optimalCombinations: [['T19', 'D18']] },
  { score: 92, combinations: [['T20', 'D16']], optimalCombinations: [['T20', 'D16']] },
  { score: 91, combinations: [['T17', 'D20']], optimalCombinations: [['T17', 'D20']] },

  // 90-81
  { score: 90, combinations: [['T20', 'D15']], optimalCombinations: [['T20', 'D15']] },
  { score: 89, combinations: [['T19', 'D16']], optimalCombinations: [['T19', 'D16']] },
  { score: 88, combinations: [['T20', 'D14']], optimalCombinations: [['T20', 'D14']] },
  { score: 87, combinations: [['T17', 'D18']], optimalCombinations: [['T17', 'D18']] },
  { score: 86, combinations: [['T18', 'D16']], optimalCombinations: [['T18', 'D16']] },
  { score: 85, combinations: [['T15', 'D20']], optimalCombinations: [['T15', 'D20']] },
  { score: 84, combinations: [['T20', 'D12']], optimalCombinations: [['T20', 'D12']] },
  { score: 83, combinations: [['T17', 'D16']], optimalCombinations: [['T17', 'D16']] },
  { score: 82, combinations: [['T14', 'D20']], optimalCombinations: [['T14', 'D20']] },
  { score: 81, combinations: [['T19', 'D12']], optimalCombinations: [['T19', 'D12']] },

  // 80-71
  { score: 80, combinations: [['T20', 'D10']], optimalCombinations: [['T20', 'D10']] },
  { score: 79, combinations: [['T19', 'D11']], optimalCombinations: [['T19', 'D11']] },
  { score: 78, combinations: [['T18', 'D12']], optimalCombinations: [['T18', 'D12']] },
  { score: 77, combinations: [['T19', 'D10']], optimalCombinations: [['T19', 'D10']] },
  { score: 76, combinations: [['T20', 'D8']], optimalCombinations: [['T20', 'D8']] },
  { score: 75, combinations: [['T17', 'D12']], optimalCombinations: [['T17', 'D12']] },
  { score: 74, combinations: [['T14', 'D16']], optimalCombinations: [['T14', 'D16']] },
  { score: 73, combinations: [['T19', 'D8']], optimalCombinations: [['T19', 'D8']] },
  { score: 72, combinations: [['T16', 'D12']], optimalCombinations: [['T16', 'D12']] },
  { score: 71, combinations: [['T13', 'D16']], optimalCombinations: [['T13', 'D16']] },

  // 70-61
  { score: 70, combinations: [['T18', 'D8']], optimalCombinations: [['T18', 'D8']] },
  { score: 69, combinations: [['T19', 'D6']], optimalCombinations: [['T19', 'D6']] },
  { score: 68, combinations: [['T20', 'D4']], optimalCombinations: [['T20', 'D4']] },
  { score: 67, combinations: [['T17', 'D8']], optimalCombinations: [['T17', 'D8']] },
  { score: 66, combinations: [['T14', 'D12']], optimalCombinations: [['T14', 'D12']] },
  { score: 65, combinations: [['T19', 'D4']], optimalCombinations: [['T19', 'D4']] },
  { score: 64, combinations: [['T16', 'D8']], optimalCombinations: [['T16', 'D8']] },
  { score: 63, combinations: [['T13', 'D12']], optimalCombinations: [['T13', 'D12']] },
  { score: 62, combinations: [['T10', 'D16']], optimalCombinations: [['T10', 'D16']] },
  { score: 61, combinations: [['T15', 'D8']], optimalCombinations: [['T15', 'D8']] },

  // 60-51
  { score: 60, combinations: [['S20', 'D20']], optimalCombinations: [['S20', 'D20']] },
  { score: 59, combinations: [['S19', 'D20']], optimalCombinations: [['S19', 'D20']] },
  { score: 58, combinations: [['S18', 'D20']], optimalCombinations: [['S18', 'D20']] },
  { score: 57, combinations: [['S17', 'D20']], optimalCombinations: [['S17', 'D20']] },
  { score: 56, combinations: [['S16', 'D20']], optimalCombinations: [['S16', 'D20']] },
  { score: 55, combinations: [['S15', 'D20']], optimalCombinations: [['S15', 'D20']] },
  { score: 54, combinations: [['S14', 'D20']], optimalCombinations: [['S14', 'D20']] },
  { score: 53, combinations: [['S13', 'D20']], optimalCombinations: [['S13', 'D20']] },
  { score: 52, combinations: [['S12', 'D20']], optimalCombinations: [['S12', 'D20']] },
  { score: 51, combinations: [['S11', 'D20']], optimalCombinations: [['S11', 'D20']] },

  // 50-41
  { score: 50, combinations: [['S10', 'D20']], optimalCombinations: [['S10', 'D20']] },
  { score: 49, combinations: [['S9', 'D20']], optimalCombinations: [['S9', 'D20']] },
  { score: 48, combinations: [['S8', 'D20']], optimalCombinations: [['S8', 'D20']] },
  { score: 47, combinations: [['S7', 'D20']], optimalCombinations: [['S7', 'D20']] },
  { score: 46, combinations: [['S6', 'D20']], optimalCombinations: [['S6', 'D20']] },
  { score: 45, combinations: [['S5', 'D20']], optimalCombinations: [['S5', 'D20']] },
  { score: 44, combinations: [['S4', 'D20']], optimalCombinations: [['S4', 'D20']] },
  { score: 43, combinations: [['S3', 'D20']], optimalCombinations: [['S3', 'D20']] },
  { score: 42, combinations: [['S2', 'D20']], optimalCombinations: [['S2', 'D20']] },
  { score: 41, combinations: [['S1', 'D20']], optimalCombinations: [['S1', 'D20']] },

  // 40-2 (all simple doubles)
  { score: 40, combinations: [['D20']], optimalCombinations: [['D20']] },
  { score: 38, combinations: [['D19']], optimalCombinations: [['D19']] },
  { score: 36, combinations: [['D18']], optimalCombinations: [['D18']] },
  { score: 34, combinations: [['D17']], optimalCombinations: [['D17']] },
  { score: 32, combinations: [['D16']], optimalCombinations: [['D16']] },
  { score: 30, combinations: [['D15']], optimalCombinations: [['D15']] },
  { score: 28, combinations: [['D14']], optimalCombinations: [['D14']] },
  { score: 26, combinations: [['D13']], optimalCombinations: [['D13']] },
  { score: 24, combinations: [['D12']], optimalCombinations: [['D12']] },
  { score: 22, combinations: [['D11']], optimalCombinations: [['D11']] },
  { score: 20, combinations: [['D10']], optimalCombinations: [['D10']] },
  { score: 18, combinations: [['D9']], optimalCombinations: [['D9']] },
  { score: 16, combinations: [['D8']], optimalCombinations: [['D8']] },
  { score: 14, combinations: [['D7']], optimalCombinations: [['D7']] },
  { score: 12, combinations: [['D6']], optimalCombinations: [['D6']] },
  { score: 10, combinations: [['D5']], optimalCombinations: [['D5']] },
  { score: 8, combinations: [['D4']], optimalCombinations: [['D4']] },
  { score: 6, combinations: [['D3']], optimalCombinations: [['D3']] },
  { score: 4, combinations: [['D2']], optimalCombinations: [['D2']] },
  { score: 2, combinations: [['D1']], optimalCombinations: [['D1']] }
];

export const isCheckoutPossible = (score: number): boolean => {
  // A checkout is possible if:
  // 1. The score is 170 or less
  // 2. The score is 2 or more
  // 3. The score is not in the list of impossible checkouts
  if (score > 170 || score < 2) return false;
  
  // Check for impossible checkouts
  if ([169, 168, 166, 165, 163, 162, 159].includes(score)) {
    return false;
  }
  
  return true;
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

// Helper function to sort darts to prioritize trebles first and higher numbers
const sortDartsByPriority = (darts: string[]): string[] => {
  return darts.sort((a, b) => {
    const aNum = parseInt(a.slice(1));
    const bNum = parseInt(b.slice(1));
    
    // First compare multipliers
    if (a.startsWith('T') && !b.startsWith('T')) return -1;
    if (!a.startsWith('T') && b.startsWith('T')) return 1;
    
    // For same multiplier, compare numbers
    if (a[0] === b[0]) {
      return bNum - aNum; // Higher numbers first
    }
    
    // Then singles
    if (a.startsWith('S') && !b.startsWith('S')) return -1;
    if (!a.startsWith('S') && b.startsWith('S')) return 1;
    
    return 0;
  });
};

// Helper function to find all possible checkout combinations for a score
export const findAllCheckoutCombinations = (score: number): string[][] => {
  const allDarts = getAllPossibleDartValues();
  const combinations: string[][] = [];
  const maxDarts = 3;

  // Helper function to get valid darts for the current position
  const getValidDartsForPosition = (remainingScore: number, isLastDart: boolean, currentCombo: string[]): string[] => {
    let validDarts = isLastDart
      ? allDarts.filter(d => {
          const value = calculateValue(d);
          // Only include BULL if no double is possible for this score
          if (d === 'BULL') {
            return value === remainingScore && !allDarts.some(d2 => 
              d2.startsWith('D') && calculateValue(d2) === remainingScore
            );
          }
          return (d.startsWith('D')) && value <= remainingScore;
        })
      : allDarts.filter(d => {
          const value = calculateValue(d);
          const num = parseInt(d.slice(1));
          
          // For numbers 20 or below, only allow singles
          if (num <= 20 && (d.startsWith('T') || d.startsWith('D'))) {
            return false;
          }

          // Prevent multiple BULLs
          if ((d === 'BULL' || d === '25') && currentCombo.some(x => x === 'BULL' || x === '25')) {
            return false;
          }
          
          return value <= remainingScore;
        });

    // Sort darts by priority for non-last darts
    if (!isLastDart) {
      validDarts = validDarts.sort((a, b) => {
        const aNum = parseInt(a.slice(1));
        const bNum = parseInt(b.slice(1));
        
        // Always try T20 first if available
        if (a === 'T20') return -1;
        if (b === 'T20') return 1;

        // Then other trebles (high to low)
        if (a.startsWith('T') && !b.startsWith('T')) return -1;
        if (!a.startsWith('T') && b.startsWith('T')) return 1;
        if (a.startsWith('T') && b.startsWith('T')) return bNum - aNum;

        // Then singles (high to low)
        if (a.startsWith('S') && !b.startsWith('S')) return -1;
        if (!a.startsWith('S') && b.startsWith('S')) return 1;
        if (a.startsWith('S') && b.startsWith('S')) return bNum - aNum;

        // Then everything else
        return 0;
      });
    }
    
    return validDarts;
  };

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

    const possibleDarts = getValidDartsForPosition(remainingScore, isLastDart, currentCombo);

    for (const dart of possibleDarts) {
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

  // Sort combinations to prioritize trebles first and higher numbers
  return combinations.sort((a, b) => {
    // First compare number of darts (fewer is better)
    if (a.length !== b.length) return a.length - b.length;

    // Compare the first dart in each combination
    const aFirst = a[0];
    const bFirst = b[0];
    
    // Always prefer T20 first
    if (aFirst === 'T20' && bFirst !== 'T20') return -1;
    if (aFirst !== 'T20' && bFirst === 'T20') return 1;

    // Then compare trebles
    if (aFirst.startsWith('T') && !bFirst.startsWith('T')) return -1;
    if (!aFirst.startsWith('T') && bFirst.startsWith('T')) return 1;

    // For same multiplier, compare numbers
    const aNum = parseInt(aFirst.slice(1));
    const bNum = parseInt(bFirst.slice(1));
    if (aFirst[0] === bFirst[0]) return bNum - aNum;

    return 0;
  });
};

// Helper function to normalize dart notation
const normalizeDartNotation = (dart: string): string => {
  // Treat 25 and BULL as equivalent for validation
  if (dart === '25' || dart === 'BULL') return 'BULL';
  return dart;
};

// Helper function to validate a checkout attempt
export const validateAttempt = (attempt: string[], targetScore: number): ValidationResult => {
  // Check if we have the right number of throws
  if (attempt.length === 0 || attempt.length > 3) {
    return { isValid: false, message: 'Invalid number of throws', isOptimal: false };
  }

  // Calculate the total score
  const totalScore = attempt.reduce((sum, throw_) => sum + calculateValue(throw_), 0);
  
  // Check if the score matches the target
  if (totalScore !== targetScore) {
    return { isValid: false, message: 'Score does not match target', isOptimal: false };
  }

  // Check if the last throw is a double
  const lastThrow = attempt[attempt.length - 1];
  if (!lastThrow.startsWith('D') && lastThrow !== 'BULL') {
    return { isValid: false, message: 'Last throw must be a double', isOptimal: false };
  }

  // Get the optimal checkout for this score
  const checkout = checkouts.find(c => c.score === targetScore);
  if (!checkout?.optimalCombinations) {
    // If no predefined optimal checkout exists, consider any valid checkout optimal
    return { 
      isValid: true, 
      message: 'Valid checkout!', 
      isOptimal: true 
    };
  }

  // Consider the attempt optimal if it uses the same number of darts as any optimal combination
  const isOptimal = checkout.optimalCombinations.some(combo => combo.length === attempt.length);

  return { 
    isValid: true, 
    message: isOptimal ? 'Optimal checkout!' : 'Valid checkout', 
    isOptimal 
  };
};

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