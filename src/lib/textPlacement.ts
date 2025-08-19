// src/lib/textPlacement.ts
import type { BrailleGrid } from '@/types/braille';
import { letterToBraillePattern, uppercaseMapping } from '@/lib/brailleMappings';

// Converte um caractere em padrão de pontos usando O mapping existente
function getDotsForChar(ch: string): number[] {
  // Se for maiúscula e existir mapeamento para minúscula equivalente:
  const lowered = uppercaseMapping[ch] ?? ch.toLowerCase();
  return letterToBraillePattern[lowered] ?? [];
}

/**
 * Escreve texto na grade a partir de (startX,startY), preenchendo
 * tanto `cell.letter` quanto `cell.dots`.
 * - Respeita quebras de linha "\n"
 * - Faz wrap para a próxima linha ao ultrapassar a largura
 */
export function writeTextToGridWithDots(
  grid: BrailleGrid,
  startX: number,
  startY: number,
  text: string
): BrailleGrid {
  const newGrid: BrailleGrid = JSON.parse(JSON.stringify(grid));
  let x = startX;
  let y = startY;

  for (const ch of text) {
    if (ch === '\n') {
      y += 1;
      x = 0;
      if (y >= newGrid.height) break;
      continue;
    }

    if (x >= newGrid.width) {
      x = 0;
      y += 1;
      if (y >= newGrid.height) break;
    }

    const dots = getDotsForChar(ch);
    const cell = newGrid.cells[y][x];

    cell.letter = ch;   // para quando “Mostrar letras” estiver ativado
    cell.dots = dots;   // para visualizar pontos (modo padrão)

    x += 1;
  }

  return newGrid;
}
