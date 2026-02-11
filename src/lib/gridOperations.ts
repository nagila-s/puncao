/**
 * gridOperations.ts
 *
 * Função pura e reutilizável para aplicar um mapa de dots a um grid.
 * Usada tanto pelas formas geométricas quanto (futuramente) pelo texto,
 * garantindo um único ponto de entrada para modificar cells.dots
 * sem duplicar regras de histórico.
 */

import { BrailleGrid, BrailleCell } from '@/types/braille';
import { findBestMatchingLetter } from './brailleMappings';

/**
 * Aplica um mapa de dots sobre um grid (modo overwrite).
 *
 * - Apenas células presentes no mapa são modificadas.
 * - Células fora do mapa permanecem intactas.
 * - Retorna um **novo** grid (deep clone).
 *
 * @param grid       Grid de origem (não mutado)
 * @param dotsMap    Map<"x,y", number[]>  —  dots 1-indexed
 * @param origin     Origem a gravar na célula ('automatic' | 'manual' | 'text')
 */
export function applyDotsMapToGrid(
  grid: BrailleGrid,
  dotsMap: Map<string, number[]>,
  origin: BrailleCell['origin'] = 'automatic'
): BrailleGrid {
  const newGrid: BrailleGrid = JSON.parse(JSON.stringify(grid));

  for (const [key, dots] of dotsMap) {
    const [x, y] = key.split(',').map(Number);
    if (x >= 0 && x < newGrid.width && y >= 0 && y < newGrid.height) {
      const cell = newGrid.cells[y][x];
      cell.dots = [...dots];
      cell.letter = findBestMatchingLetter(dots);
      cell.origin = origin;
    }
  }

  return newGrid;
}
