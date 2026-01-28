// src/lib/textPlacement.ts
import type { BrailleGrid } from "@/types/braille";
import { letterToBraillePatternFunc, brailleIndicators, digitToLetter } from "@/lib/brailleMappings";

function isDigit(ch: string): boolean {
  return ch.length === 1 && ch >= "0" && ch <= "9";
}

/**
 * Escreve um texto na grade a partir da célula (startX,startY).
 * - cada caractere ocupa 1 célula (exceto dígito: ocupa 2 = sinal de número + letra a–j)
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

    if (isDigit(ch)) {
      const cellSign = newGrid.cells[y][x];
      cellSign.dots = [...brailleIndicators.NUMBER];
      cellSign.letter = "#";
      (cellSign as any).origin = "text";
      x += 1;
      if (x >= newGrid.width) {
        x = 0;
        y += 1;
      }
      if (y >= newGrid.height) break;
    }

    const cell = newGrid.cells[y][x];
    const letter = isDigit(ch) ? digitToLetter[ch] : ch;
    cell.letter = letter;
    cell.dots = letterToBraillePatternFunc(letter);
    (cell as any).origin = "text";

    x += 1;
  }

  return newGrid;
}
