// Mapeamento completo de caracteres para pontos braille em português brasileiro
// Cada array representa os pontos ativos (1-6) de uma célula braille
// Pontos: 1=topo-esquerda, 2=meio-esquerda, 3=baixo-esquerda, 4=topo-direita, 5=meio-direita, 6=baixo-direita

export const letterToBraillePattern: Record<string, number[]> = {
  // LETRAS BÁSICAS
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

  // LETRAS COM ACENTO AGUDO (á, é, í, ó, ú)
  // Prefixo para acento agudo: [1, 2, 3, 5, 6]
  'á': [1, 2, 3, 5, 6], 
  'é': [1, 2, 3, 4, 5, 6],
  'í': [3, 4],
  'ó': [3, 4, 6],
  'ú': [2, 3, 4, 5, 6], 
  'ý': [6],

  // LETRAS COM ACENTO CIRCUNFLEXO (â, ê, ô)
  'â': [1, 6],
  'ê': [1, 2, 6],
  'ô': [1, 4, 5, 6],
  'î': [1, 4, 6],
  'û': [1, 5, 6],


  // LETRAS COM ACENTO GRAVE (à)
  'à': [1, 2, 4, 6], 
  'è': [2, 3, 4, 6], 

  // LETRAS COM TIL (ã, õ)
  'ã': [3, 4, 5],
  'õ': [2, 4, 6],

  // LETRA COM CEDILHA (ç)
  'ç': [1, 2, 3, 4, 6],

    // LETRA COM trema
  'ÿ': [2, 5, 6],               // divisão
  'ü': [1, 2, 5, 6],            // u com trema
  'ï': [1, 2, 4, 5, 6],            // u com trema

  // PONTUAÇÕES E SÍMBOLOS
  ' ': [],                   // espaço vazio
  '.': [3],                  // ponto final
  ',': [2],                  // vírgula
  ';': [2, 3],               // ponto e vírgula
  ':': [2, 5],               // dois pontos
  '?': [2, 6],               // ponto de interrogação
  '!': [2, 3, 5],            // ponto de exclamação
  '"': [2, 3, 6],            // aspas
  "'": [3],                  // apóstrofo
  '-': [3, 6],               // hífen/travessão
  '(': [1, 2, 6],            // parênteses esquerdo
  ')': [3, 4, 5],            // parênteses direito
  '[': [1, 2, 3, 5, 6],      // colchete esquerdo
  ']': [2, 3, 4, 5, 6],      // colchete direito
  '{': [4, 6],               // chave esquerda
  '}': [3, 5, 6],            // chave direita
  '@': [1, 5, 6],            // arroba (pode precisar de duas células)
  '#': [3, 4, 5, 6],         // hashtag
  '$': [5, 6],               // cifrão
  '*': [3, 5],               // asterisco
  '+': [2, 3, 5],            // mais
  '=': [2, 3, 5, 6],         // igual
  '^': [4],                  // circunflexo
  '~': [5],                  // til
  '_': [4, 5, 6],            // til
  '¬': [4, 5],                // negação lógica
 
};

// Mapeamento inverso para letras maiúsculas (precedidas pelo indicador maiúscula: [4, 6])
export const uppercaseMapping: Record<string, string> = {
  'A': 'a', 'B': 'b', 'C': 'c', 'D': 'd', 'E': 'e', 'F': 'f', 'G': 'g', 'H': 'h', 'I': 'i', 'J': 'j',
  'K': 'k', 'L': 'l', 'M': 'm', 'N': 'n', 'O': 'o', 'P': 'p', 'Q': 'q', 'R': 'r', 'S': 's', 'T': 't',
  'U': 'u', 'V': 'v', 'W': 'w', 'X': 'x', 'Y': 'y', 'Z': 'z',
  'Á': 'á', 'É': 'é', 'Í': 'í', 'Ó': 'ó', 'Ú': 'ú',
  'Â': 'â', 'Ê': 'ê', 'Ô': 'ô', 'À': 'à', 'Ã': 'ã', 'Õ': 'õ', 'Ç': 'ç'
};

// Indicadores especiais
export const brailleIndicators = {
  UPPERCASE: [4, 6],          // indicador de letra maiúscula
  NUMBER: [3, 4, 5, 6],       // indicador numérico
};

/** Em Braille, número = sinal + letra a–j (1=a, 2=b, … 0=j). Mapeamento dígito → letra (inserção e cópia). */
export const digitToLetter: Record<string, string> = {
  "0": "j", "1": "a", "2": "b", "3": "c", "4": "d",
  "5": "e", "6": "f", "7": "g", "8": "h", "9": "i",
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

// Converte letra para padrão de pontos braille (com suporte a maiúsculas)
export const letterToBraillePatternFunc = (letter: string): number[] => {
  // Se for maiúscula, retorna o padrão da minúscula (indicador de maiúscula deve ser tratado separadamente)
  const lowerCase = letter.toLowerCase();
  return letterToBraillePattern[lowerCase] || [];
};

// Verifica se um caractere é maiúsculo
export const isUppercase = (char: string): boolean => {
  return char !== char.toLowerCase() && char === char.toUpperCase();
};

// Verifica se um caractere é um número
export const isNumber = (char: string): boolean => {
  return /[0-9]/.test(char);
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

// Função auxiliar para converter texto completo para braille (considerando indicadores)
export const textToBraille = (text: string): number[][] => {
  const result: number[][] = [];
  let previousWasNumber = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // Verifica se é maiúscula
    if (isUppercase(char)) {
      result.push(brailleIndicators.UPPERCASE);
      result.push(letterToBraillePatternFunc(char));
    }
    // Verifica se é número
    else if (isNumber(char)) {
      // Adiciona indicador numérico apenas no primeiro número de uma sequência
      if (!previousWasNumber) {
        result.push(brailleIndicators.NUMBER);
      }
      result.push(letterToBraillePatternFunc(char));
      previousWasNumber = true;
      continue;
    }
    // Caractere normal
    else {
      result.push(letterToBraillePatternFunc(char));
    }
    
    previousWasNumber = false;
  }
  
  return result;
};