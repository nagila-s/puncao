/**
 * Converte bitmap de contornos (edges binary) em BrailleGrid.
 * Função pura: redimensiona logicamente para o grid, avalia os 6 pontos por célula
 * e preenche dots + letter (findBestMatchingLetter) + origin = 'automatic'.
 */
import type { BrailleGrid, BrailleCell } from '@/types/braille';
import { findBestMatchingLetter } from '@/lib/brailleMappings';
import { CELL_WIDTH, CELL_HEIGHT } from '@/lib/constants';

// Posições dos pontos Braille na célula (em percentual 0–1), alinhado com useDrawing
const BRAILLE_DOT_POSITIONS = [
  { x: 0.3, y: 0.2, dot: 1 },
  { x: 0.3, y: 0.5, dot: 2 },
  { x: 0.3, y: 0.8, dot: 3 },
  { x: 0.7, y: 0.2, dot: 4 },
  { x: 0.7, y: 0.5, dot: 5 },
  { x: 0.7, y: 0.8, dot: 6 },
];

export interface EdgesToBrailleParams {
  /** Raio da janela de amostragem em pixels (imagem fonte). */
  dotRadius?: number;
  /** Limiar 0–1: proporção de pixels pretos na janela para acender o ponto. */
  thresholdDot?: number;
}

/**
 * Amostra cobertura de pixels "pretos" (valor > 127) numa janela circular de raio dotRadius
 * em torno de (sx, sy). Para desenhos simples com linhas finas: acende o ponto se
 * (a) a proporção de pretos >= thresholdDot OU (b) existe pelo menos 1 pixel preto (evita perder traços finos).
 */
function sampleCoverage(
  edgesBinary: Uint8Array,
  width: number,
  height: number,
  sx: number,
  sy: number,
  dotRadius: number,
  thresholdDot: number
): boolean {
  if (dotRadius <= 0) {
    const x = Math.floor(sx);
    const y = Math.floor(sy);
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    return edgesBinary[y * width + x] > 127;
  }
  const r = Math.max(1, Math.ceil(dotRadius));
  let count = 0;
  let total = 0;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > dotRadius * dotRadius) continue;
      const x = Math.floor(sx + dx);
      const y = Math.floor(sy + dy);
      total++;
      if (x >= 0 && x < width && y >= 0 && y < height && edgesBinary[y * width + x] > 127) count++;
    }
  }
  if (total === 0) return false;
  const ratio = count / total;
  if (ratio >= thresholdDot) return true;
  if (count >= 1 && total <= 9) return true;
  return false;
}

/**
 * Converte bitmap de contornos (edges binary) para BrailleGrid.
 * - edgesBinary: imagem binária (0 ou 255), dimensions edgesWidth x edgesHeight.
 * - gridWidth, gridHeight: dimensões da grade em células.
 * - cellW, cellH: tamanho lógico de cada célula em pixels (ex.: 20, 30).
 * - params: dotRadius (px na imagem fonte), thresholdDot (0–1).
 */
export function edgesToBrailleGrid(
  edgesBinary: Uint8Array,
  edgesWidth: number,
  edgesHeight: number,
  gridWidth: number,
  gridHeight: number,
  cellW: number,
  cellH: number,
  params: EdgesToBrailleParams = {}
): BrailleGrid {
  const dotRadius = Math.max(0, params.dotRadius ?? 2.5);
  const thresholdDot = Math.max(0, Math.min(1, params.thresholdDot ?? 0.1));

  const logicalWidth = gridWidth * cellW;
  const logicalHeight = gridHeight * cellH;

  const cells: BrailleCell[][] = [];
  for (let cy = 0; cy < gridHeight; cy++) {
    cells[cy] = [];
    for (let cx = 0; cx < gridWidth; cx++) {
      const dots: number[] = [];
      for (const pos of BRAILLE_DOT_POSITIONS) {
        const lx = (cx + pos.x) * cellW;
        const ly = (cy + pos.y) * cellH;
        const sx = (lx / logicalWidth) * edgesWidth;
        const sy = (ly / logicalHeight) * edgesHeight;
        if (sampleCoverage(edgesBinary, edgesWidth, edgesHeight, sx, sy, dotRadius, thresholdDot)) {
          dots.push(pos.dot);
        }
      }
      const letter = findBestMatchingLetter(dots);
      cells[cy][cx] = {
        x: cx,
        y: cy,
        dots,
        letter,
        origin: 'automatic',
      };
    }
  }
  return { width: gridWidth, height: gridHeight, cells };
}
