/**
 * useShapes.ts
 *
 * Hook de gestão do modo de inserção de formas geométricas.
 *
 * Fluxo:
 *   mouseDown  →  define anchorCell, ativa isPlacingShape
 *   mouseMove  →  atualiza currentCell, recalcula preview (Map de dots)
 *   mouseUp    →  trava o preview (modo ajuste)
 *   Enter      →  aplica no grid, entra no histórico, sai do modo
 *   Esc        →  cancela, limpa preview, não altera o grid
 *
 * Durante o placing, NUNCA chama onGridChange.
 */

import { useCallback, useMemo, useState } from 'react';
import { BrailleGrid, Tool } from '@/types/braille';
import { findBestMatchingLetter } from '@/lib/brailleMappings';
import { CELL_WIDTH, CELL_HEIGHT } from '@/lib/constants';
import { shapeToDotsMap, ShapeType } from '@/lib/shapeRasterizer';
import { applyDotsMapToGrid } from '@/lib/gridOperations';

// ─── Ferramentas que ativam o sistema de formas ─────────────────

const SHAPE_TOOLS: readonly string[] = ['line', 'rectangle', 'circle', 'triangle'];

export function isShapeTool(tool: Tool): boolean {
  return SHAPE_TOOLS.includes(tool);
}

function toolToShapeType(tool: Tool): ShapeType | null {
  if (isShapeTool(tool)) return tool as ShapeType;
  return null;
}

// ─── Interface pública ──────────────────────────────────────────

export interface ShapePlacingState {
  isPlacingShape: boolean;
  shapeType: ShapeType | null;
  anchorCell: { x: number; y: number } | null;
  currentCell: { x: number; y: number } | null;
  previewDotsMap: Map<string, number[]>;
  isLocked: boolean;
  boundingBox: { x0: number; y0: number; x1: number; y1: number } | null;

  handleShapeMouseDown: (pixelX: number, pixelY: number, tool: Tool) => void;
  handleShapeMouseMove: (pixelX: number, pixelY: number) => void;
  handleShapeMouseUp: () => void;

  /** Aplica a forma no grid. Retorna o novo grid ou null se nada a aplicar. */
  confirmShape: () => BrailleGrid | null;
  /** Cancela a inserção sem alterar o grid. */
  cancelShape: () => void;

  /** Flood fill legado (mantido para compatibilidade). */
  floodFill: (targetGrid: BrailleGrid, startX: number, startY: number) => void;
}

// ─── Hook ───────────────────────────────────────────────────────

export const useShapes = (
  grid: BrailleGrid,
  _onGridChange: (grid: BrailleGrid) => void
): ShapePlacingState => {

  // Estado de placing
  const [isPlacingShape, setIsPlacingShape] = useState(false);
  const [shapeType, setShapeType] = useState<ShapeType | null>(null);
  const [anchorCell, setAnchorCell] = useState<{ x: number; y: number } | null>(null);
  const [currentCell, setCurrentCell] = useState<{ x: number; y: number } | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  /** Posição fracional do clique dentro da célula âncora (0..1). Usado para snap de linhas. */
  const [anchorFrac, setAnchorFrac] = useState<{ x: number; y: number } | null>(null);

  // ── Preview (reativo) ──

  const previewDotsMap = useMemo<Map<string, number[]>>(() => {
    if (!isPlacingShape || !shapeType || !anchorCell || !currentCell) {
      return new Map();
    }
    const params: import('@/lib/shapeRasterizer').ShapeParams = {};
    if (shapeType === 'line' && anchorFrac) {
      params.anchorFrac = anchorFrac;
    }
    return shapeToDotsMap(shapeType, anchorCell, currentCell, grid.width, grid.height, params);
  }, [isPlacingShape, shapeType, anchorCell, currentCell, anchorFrac, grid.width, grid.height]);

  const boundingBox = useMemo(() => {
    if (!isPlacingShape || !anchorCell || !currentCell) return null;
    return {
      x0: Math.min(anchorCell.x, currentCell.x),
      y0: Math.min(anchorCell.y, currentCell.y),
      x1: Math.max(anchorCell.x, currentCell.x),
      y1: Math.max(anchorCell.y, currentCell.y),
    };
  }, [isPlacingShape, anchorCell, currentCell]);

  // ── Mouse handlers ──

  const handleShapeMouseDown = useCallback((pixelX: number, pixelY: number, tool: Tool) => {
    const st = toolToShapeType(tool);
    if (!st) return;

    const cellX = Math.floor(pixelX / CELL_WIDTH);
    const cellY = Math.floor(pixelY / CELL_HEIGHT);

    if (cellX < 0 || cellX >= grid.width || cellY < 0 || cellY >= grid.height) return;

    // Posição fracional dentro da célula (0..1) — usado para snap de linhas
    const fracX = (pixelX - cellX * CELL_WIDTH) / CELL_WIDTH;
    const fracY = (pixelY - cellY * CELL_HEIGHT) / CELL_HEIGHT;

    // Se já está locked, novo mouseDown cancela o anterior e recomeça
    setIsPlacingShape(true);
    setShapeType(st);
    setAnchorCell({ x: cellX, y: cellY });
    setCurrentCell({ x: cellX, y: cellY });
    setAnchorFrac({ x: fracX, y: fracY });
    setIsLocked(false);
  }, [grid.width, grid.height]);

  const handleShapeMouseMove = useCallback((pixelX: number, pixelY: number) => {
    if (!isPlacingShape || isLocked) return;

    const cellX = Math.min(Math.max(0, Math.floor(pixelX / CELL_WIDTH)), grid.width - 1);
    const cellY = Math.min(Math.max(0, Math.floor(pixelY / CELL_HEIGHT)), grid.height - 1);

    setCurrentCell({ x: cellX, y: cellY });
  }, [isPlacingShape, isLocked, grid.width, grid.height]);

  const handleShapeMouseUp = useCallback(() => {
    if (!isPlacingShape || isLocked) return;
    setIsLocked(true); // Trava o preview para ajuste
  }, [isPlacingShape, isLocked]);

  // ── Confirm / Cancel ──

  const resetState = useCallback(() => {
    setIsPlacingShape(false);
    setShapeType(null);
    setAnchorCell(null);
    setCurrentCell(null);
    setAnchorFrac(null);
    setIsLocked(false);
  }, []);

  const confirmShape = useCallback((): BrailleGrid | null => {
    if (!isPlacingShape || previewDotsMap.size === 0) {
      resetState();
      return null;
    }

    // Aplica dots no grid usando a função pura partilhada
    const newGrid = applyDotsMapToGrid(grid, previewDotsMap, 'automatic');

    resetState();
    return newGrid;
  }, [isPlacingShape, previewDotsMap, grid, resetState]);

  const cancelShape = useCallback(() => {
    resetState();
  }, [resetState]);

  // ── Flood fill (legado, mantido sem alterações) ──

  const fillCell = (targetGrid: BrailleGrid, cellX: number, cellY: number, pattern: number[]) => {
    if (cellX >= 0 && cellX < targetGrid.width && cellY >= 0 && cellY < targetGrid.height) {
      const cell = targetGrid.cells[cellY][cellX];
      cell.dots = [...pattern];
      cell.letter = findBestMatchingLetter(pattern);
      cell.origin = 'manual';
    }
  };

  const floodFill = (targetGrid: BrailleGrid, startX: number, startY: number) => {
    if (startX < 0 || startX >= targetGrid.width || startY < 0 || startY >= targetGrid.height) {
      return;
    }

    const startCell = targetGrid.cells[startY][startX];
    const originalDots = JSON.stringify([...startCell.dots].sort());
    const fillPattern = [1, 2, 3, 4, 5, 6];
    const targetDots = JSON.stringify([...fillPattern].sort());

    if (originalDots === targetDots) return;

    const stack = [{ x: startX, y: startY }];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const cellKey = `${x},${y}`;

      if (visited.has(cellKey)) continue;
      if (x < 0 || x >= targetGrid.width || y < 0 || y >= targetGrid.height) continue;

      const currentCell = targetGrid.cells[y][x];
      const currentDots = JSON.stringify([...currentCell.dots].sort());
      if (currentDots !== originalDots) continue;

      visited.add(cellKey);
      fillCell(targetGrid, x, y, fillPattern);

      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }
  };

  // ── Retorno ──

  return {
    isPlacingShape,
    shapeType,
    anchorCell,
    currentCell,
    previewDotsMap,
    isLocked,
    boundingBox,

    handleShapeMouseDown,
    handleShapeMouseMove,
    handleShapeMouseUp,

    confirmShape,
    cancelShape,

    floodFill,
  };
};
