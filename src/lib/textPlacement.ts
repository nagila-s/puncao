// src/lib/textPlacement.ts
import type { BrailleGrid } from "@/types/braille";
import { letterToBraillePatternFunc } from "@/lib/brailleMappings";

/**
 * Escreve um texto na grade a partir da célula (startX,startY).
 * - cada caractere ocupa 1 célula
 * - \n quebra linha
 * - faz wrap para a linha seguinte ao atingir a largura
 * - clampa no limite inferior da grade
 */
export function writeTextToGrid(
  grid: BrailleGrid,
  startX: number,
  startY: number,
  text: string
): BrailleGrid {
  const newGrid: BrailleGrid = JSON.parse(JSON.stringify(grid));
  let x = startX;
  let y = startY;

  for (const ch of text) {
    if (ch === "\n") {
      x = startX;
      y += 1;
      if (y >= newGrid.height) break;
      continue;
    }

    if (x >= newGrid.width) {
      x = 0;
      y += 1;
    }
    if (y >= newGrid.height) break;

    const cell = newGrid.cells[y][x];
    cell.letter = ch;
    cell.dots = letterToBraillePatternFunc(ch);
    (cell as any).origin = "text";

    x += 1;
  }

  return newGrid;
}
