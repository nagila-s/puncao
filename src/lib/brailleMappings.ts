
// Mapeamento de letras para pontos braille
// Cada array representa os pontos ativos (1-6) de uma célula braille
// Pontos: 1=topo-esquerda, 2=meio-esquerda, 3=baixo-esquerda, 4=topo-direita, 5=meio-direita, 6=baixo-direita

export const letterToBraillePattern: Record<string, number[]> = {
  'a': [1],
  'b': [1, 2],
  'c': [1, 4],
  'd': [1, 4, 5],
  'e': [1, 5],
  'f': [1, 2, 4],
  'g': [1, 2, 4, 5],
  'h': [1, 2, 5],
  'i': [2, 4],
  'j': [2, 4, 5],
  'k': [1, 3],
  'l': [1, 2, 3],
  'm': [1, 3, 4],
  'n': [1, 3, 4, 5],
  'o': [1, 3, 5],
  'p': [1, 2, 3, 4],
  'q': [1, 2, 3, 4, 5],
  'r': [1, 2, 3, 5],
  's': [2, 3, 4],
  't': [2, 3, 4, 5],
  'u': [1, 3, 6],
  'v': [1, 2, 3, 6],
  'w': [2, 4, 5, 6],
  'x': [1, 3, 4, 6],
  'y': [1, 3, 4, 5, 6],
  'z': [1, 3, 5, 6],
  ' ': [], // espaço vazio
  '.': [2, 5, 6],
  ',': [2],
  '?': [2, 6],
  '!': [2, 3, 5],
  ';': [2, 3],
  ':': [2, 5],
  '-': [3, 6],
  '⠿': [1, 2, 3, 4, 5, 6], // todos os pontos (usado como placeholder)
};

// Converte pontos braille para matriz 3x2 (usado para visualização)
export const dotsToMatrix = (dots: number[]): boolean[][] => {
  const matrix = [
    [false, false], // linha 1: pontos 1, 4
    [false, false], // linha 2: pontos 2, 5
    [false, false], // linha 3: pontos 3, 6
  ];

  dots.forEach(dot => {
    switch (dot) {
      case 1: matrix[0][0] = true; break;
      case 2: matrix[1][0] = true; break;
      case 3: matrix[2][0] = true; break;
      case 4: matrix[0][1] = true; break;
      case 5: matrix[1][1] = true; break;
      case 6: matrix[2][1] = true; break;
    }
  });

  return matrix;
};

// Converte matriz 3x2 para array de pontos
export const matrixToDots = (matrix: boolean[][]): number[] => {
  const dots: number[] = [];
  
  if (matrix[0][0]) dots.push(1);
  if (matrix[1][0]) dots.push(2);
  if (matrix[2][0]) dots.push(3);
  if (matrix[0][1]) dots.push(4);
  if (matrix[1][1]) dots.push(5);
  if (matrix[2][1]) dots.push(6);

  return dots;
};

// Converte padrão de pontos braille para letra correspondente
export const braillePatternToLetter = (targetDots: number[]): string => {
  if (targetDots.length === 0) return ' ';
  
  // Procura correspondência exata primeiro
  for (const [letter, dots] of Object.entries(letterToBraillePattern)) {
    if (targetDots.length === dots.length && targetDots.every(dot => dots.includes(dot))) {
      return letter;
    }
  }
  
  // Se não encontrar correspondência exata, retorna espaço
  return ' ';
};

// Converte letra para padrão de pontos braille
export const letterToBraillePatternFunc = (letter: string): number[] => {
  return letterToBraillePattern[letter.toLowerCase()] || [];
};

// Encontra a letra que melhor corresponde a um padrão de pontos
export const findBestMatchingLetter = (targetDots: number[]): string => {
  if (targetDots.length === 0) return ' ';

  let bestMatch = ' ';
  let bestScore = Infinity;

  Object.entries(letterToBraillePattern).forEach(([letter, dots]) => {
    // Calcula distância Hamming entre os padrões
    const score = calculateHammingDistance(targetDots, dots);
    
    if (score < bestScore) {
      bestScore = score;
      bestMatch = letter;
    }
  });

  return bestMatch;
};

// Calcula distância Hamming entre dois conjuntos de pontos
const calculateHammingDistance = (dots1: number[], dots2: number[]): number => {
  const set1 = new Set(dots1);
  const set2 = new Set(dots2);
  
  // Pontos que estão em um conjunto mas não no outro
  const difference = new Set([...set1, ...set2]);
  set1.forEach(dot => {
    if (set2.has(dot)) {
      difference.delete(dot);
    }
  });
  
  return difference.size;
};

