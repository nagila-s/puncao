import { BrailleGrid } from '@/types/braille';
import { CELL_HEIGHT, CELL_WIDTH } from '@/lib/constants';
import { DOT_POSITIONS } from '@/lib/shapeRasterizer';

export const ERASER_SIZE_MIN = 1;
export const ERASER_SIZE_MAX = 5;

const DOT_PROXIMITY = 0.25;

export type EraserDotTarget = {
  cellX: number;
  cellY: number;
  dotIndex: number;
};

export function clampEraserSize(size: number): number {
  return Math.min(ERASER_SIZE_MAX, Math.max(ERASER_SIZE_MIN, Math.round(size)));
}

export function getCellUnderCursor(x: number, y: number, grid: Pick<BrailleGrid, 'width' | 'height'>) {
  const cellX = Math.floor(x / CELL_WIDTH);
  const cellY = Math.floor(y / CELL_HEIGHT);
  if (cellX < 0 || cellX >= grid.width || cellY < 0 || cellY >= grid.height) {
    return null;
  }
  return { cellX, cellY };
}

export function getCellBlockBounds(cellX: number, cellY: number, size: number) {
  const brushSize = clampEraserSize(size);
  const half = Math.floor((brushSize - 1) / 2);
  return {
    x: cellX - half,
    y: cellY - half,
    width: brushSize,
    height: brushSize,
  };
}

export function getCellBlock(
  cellX: number,
  cellY: number,
  size: number,
  grid: Pick<BrailleGrid, 'width' | 'height'>
): { x: number; y: number }[] {
  const bounds = getCellBlockBounds(cellX, cellY, size);
  const cells: { x: number; y: number }[] = [];

  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
      if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
}

export function getDotRadiusPx(size: number): number {
  const brushSize = clampEraserSize(size);
  if (brushSize <= 1) {
    return Math.min(CELL_WIDTH, CELL_HEIGHT) * DOT_PROXIMITY;
  }
  return (brushSize * Math.min(CELL_WIDTH, CELL_HEIGHT)) / 2;
}

export function getNearestDot(
  x: number,
  y: number,
  grid: Pick<BrailleGrid, 'width' | 'height'>,
  proximity = DOT_PROXIMITY
): EraserDotTarget | null {
  const cell = getCellUnderCursor(x, y, grid);
  if (!cell) return null;

  const relativeX = (x - cell.cellX * CELL_WIDTH) / CELL_WIDTH;
  const relativeY = (y - cell.cellY * CELL_HEIGHT) / CELL_HEIGHT;

  let closest: EraserDotTarget | null = null;
  let closestDistance = Infinity;

  DOT_POSITIONS.forEach((pos, index) => {
    const distance = Math.hypot(relativeX - pos.x, relativeY - pos.y);
    if (distance < closestDistance && distance < proximity) {
      closestDistance = distance;
      closest = { cellX: cell.cellX, cellY: cell.cellY, dotIndex: index + 1 };
    }
  });

  return closest;
}

export function getDotsInEraserBrush(
  x: number,
  y: number,
  size: number,
  grid: Pick<BrailleGrid, 'width' | 'height'>
): EraserDotTarget[] {
  const brushSize = clampEraserSize(size);
  if (brushSize <= 1) {
    const nearest = getNearestDot(x, y, grid);
    return nearest ? [nearest] : [];
  }

  const radius = getDotRadiusPx(brushSize);
  const radiusSq = radius * radius;
  const minCellX = Math.max(0, Math.floor((x - radius) / CELL_WIDTH));
  const maxCellX = Math.min(grid.width - 1, Math.floor((x + radius) / CELL_WIDTH));
  const minCellY = Math.max(0, Math.floor((y - radius) / CELL_HEIGHT));
  const maxCellY = Math.min(grid.height - 1, Math.floor((y + radius) / CELL_HEIGHT));

  const hits: EraserDotTarget[] = [];
  for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      DOT_POSITIONS.forEach((pos, index) => {
        const dx = cellX * CELL_WIDTH + pos.x * CELL_WIDTH - x;
        const dy = cellY * CELL_HEIGHT + pos.y * CELL_HEIGHT - y;
        if (dx * dx + dy * dy <= radiusSq) {
          hits.push({ cellX, cellY, dotIndex: index + 1 });
        }
      });
    }
  }

  return hits;
}
