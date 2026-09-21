import { useState, useCallback } from 'react';
import { BrailleGrid, EraserUnit } from '@/types/braille';
import { findBestMatchingLetter } from '@/lib/brailleMappings';
import {
  clampEraserSize,
  getCellBlock,
  getCellUnderCursor,
  getDotsInEraserBrush,
  getNearestDot,
} from '@/lib/eraserBrush';

export interface DrawingOptions {
  eraserUnit?: EraserUnit;
  eraserSize?: number;
}

export const useDrawing = (
  grid: BrailleGrid,
  onGridChange: (grid: BrailleGrid) => void,
  options: DrawingOptions = {}
) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPaintedPoint, setLastPaintedPoint] = useState<{cellX: number, cellY: number, dotIndex: number} | null>(null);

  const paintDot = useCallback((cellX: number, cellY: number, dotIndex: number) => {
    const newGrid = JSON.parse(JSON.stringify(grid));
    const cell = newGrid.cells[cellY][cellX];
    
    const currentDots = new Set(cell.dots || []);
    currentDots.add(dotIndex);
    
    const newDots = Array.from(currentDots).sort() as number[];
    cell.dots = newDots;
    cell.letter = findBestMatchingLetter(newDots);
    
    onGridChange(newGrid);
  }, [grid, onGridChange]);

  const applyEraser = useCallback((x: number, y: number) => {
    const unit = options.eraserUnit ?? 'dots';
    const size = clampEraserSize(options.eraserSize ?? 1);
    const newGrid: BrailleGrid = JSON.parse(JSON.stringify(grid));
    let changed = false;

    if (unit === 'cells') {
      const cell = getCellUnderCursor(x, y, grid);
      if (!cell) return;

      for (const target of getCellBlock(cell.cellX, cell.cellY, size, grid)) {
        const current = newGrid.cells[target.y][target.x];
        if (current.dots.length === 0 && (!current.letter || current.letter === ' ')) continue;
        current.dots = [];
        current.letter = ' ';
        current.origin = 'manual';
        changed = true;
      }
    } else {
      const targets = getDotsInEraserBrush(x, y, size, grid);
      for (const target of targets) {
        const current = newGrid.cells[target.cellY][target.cellX];
        if (!current.dots.includes(target.dotIndex)) continue;
        current.dots = current.dots.filter((dot) => dot !== target.dotIndex);
        current.letter = findBestMatchingLetter(current.dots);
        current.origin = 'manual';
        changed = true;
      }
    }

    if (changed) onGridChange(newGrid);
  }, [grid, onGridChange, options.eraserSize, options.eraserUnit]);

  const startDrawing = useCallback((x: number, y: number, tool: string = 'pencil') => {
    setIsDrawing(true);

    if (tool === 'eraser') {
      applyEraser(x, y);
      return;
    }

    const dotPosition = getNearestDot(x, y, grid);
    if (dotPosition) {
      paintDot(dotPosition.cellX, dotPosition.cellY, dotPosition.dotIndex);
      setLastPaintedPoint(dotPosition);
    }
  }, [applyEraser, paintDot, grid]);

  const continueDrawing = useCallback((x: number, y: number, tool: string = 'pencil') => {
    if (!isDrawing) return;

    if (tool === 'eraser') {
      applyEraser(x, y);
      return;
    }
    
    const dotPosition = getNearestDot(x, y, grid);
    
    if (dotPosition) {
      const isNewPoint = !lastPaintedPoint || 
        lastPaintedPoint.cellX !== dotPosition.cellX ||
        lastPaintedPoint.cellY !== dotPosition.cellY ||
        lastPaintedPoint.dotIndex !== dotPosition.dotIndex;
        
      if (isNewPoint) {
        paintDot(dotPosition.cellX, dotPosition.cellY, dotPosition.dotIndex);
        setLastPaintedPoint(dotPosition);
      }
    }
  }, [isDrawing, lastPaintedPoint, paintDot, applyEraser, grid]);

  const finishDrawing = useCallback(() => {
    setIsDrawing(false);
    setLastPaintedPoint(null);
  }, []);

  const cancelDrawing = useCallback(() => {
    setIsDrawing(false);
    setLastPaintedPoint(null);
  }, []);

  return {
    isDrawing,
    startDrawing,
    continueDrawing,
    finishDrawing,
    cancelDrawing
  };
};
