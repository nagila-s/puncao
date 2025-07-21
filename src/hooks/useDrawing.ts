import { useState, useCallback } from 'react';
import { BrailleGrid, BrailleCell } from '@/types/braille';
import { findBestMatchingLetter, letterToBraillePatternFunc } from '@/lib/brailleMappings';

const CELL_WIDTH = 20;
const CELL_HEIGHT = 30;

// Posições dos pontos braille na célula (em percentual)
const BRAILLE_DOT_POSITIONS = [
  { x: 0.3, y: 0.2, dot: 1 }, // ponto 1
  { x: 0.3, y: 0.5, dot: 2 }, // ponto 2  
  { x: 0.3, y: 0.8, dot: 3 }, // ponto 3
  { x: 0.7, y: 0.2, dot: 4 }, // ponto 4
  { x: 0.7, y: 0.5, dot: 5 }, // ponto 5
  { x: 0.7, y: 0.8, dot: 6 }, // ponto 6
];

export const useDrawing = (grid: BrailleGrid, onGridChange: (grid: BrailleGrid) => void) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPaintedPoint, setLastPaintedPoint] = useState<{cellX: number, cellY: number, dotIndex: number} | null>(null);

  // Determina qual ponto braille está sendo tocado pelo mouse
  const getBrailleDotAtPosition = (x: number, y: number) => {
    const cellX = Math.floor(x / CELL_WIDTH);
    const cellY = Math.floor(y / CELL_HEIGHT);
    
    if (cellX < 0 || cellX >= grid.width || cellY < 0 || cellY >= grid.height) {
      return null;
    }

    // Coordenadas relativas dentro da célula
    const relativeX = (x - cellX * CELL_WIDTH) / CELL_WIDTH;
    const relativeY = (y - cellY * CELL_HEIGHT) / CELL_HEIGHT;

    // Encontra o ponto braille mais próximo
    let closestDot = null;
    let closestDistance = Infinity;
    const PROXIMITY_THRESHOLD = 0.25; // Raio de proximidade para ativar um ponto

    BRAILLE_DOT_POSITIONS.forEach((pos, index) => {
      const distance = Math.sqrt(
        Math.pow(relativeX - pos.x, 2) + Math.pow(relativeY - pos.y, 2)
      );
      
      if (distance < closestDistance && distance < PROXIMITY_THRESHOLD) {
        closestDistance = distance;
        closestDot = { cellX, cellY, dotIndex: index + 1 }; // pontos braille são 1-indexados
      }
    });

    return closestDot;
  };

  // Pinta um ponto específico (apenas ativa, nunca desativa)
  const paintDot = useCallback((cellX: number, cellY: number, dotIndex: number) => {
    console.log('paintDot called:', cellX, cellY, dotIndex);
    const newGrid = JSON.parse(JSON.stringify(grid));
    const cell = newGrid.cells[cellY][cellX];
    console.log('current cell:', cell);
    
    // Apenas adiciona o ponto, nunca remove
    const currentDots = new Set(cell.dots || []);
    currentDots.add(dotIndex);
    
    const newDots = Array.from(currentDots).sort() as number[];
    cell.dots = newDots;
    
    // Atualiza a letra correspondente
    const suggestedLetter = findBestMatchingLetter(newDots);
    cell.letter = suggestedLetter;
    
    console.log('updated cell:', cell);
    console.log('calling onGridChange with newGrid');
    onGridChange(newGrid);
  }, [grid, onGridChange]);

  // Remove um ponto específico (para borracha)
  const eraseDot = useCallback((cellX: number, cellY: number, dotIndex: number) => {
    const newGrid = JSON.parse(JSON.stringify(grid));
    const cell = newGrid.cells[cellY][cellX];
    
    // Remove o ponto
    const currentDots = new Set(cell.dots || []);
    currentDots.delete(dotIndex);
    
    const newDots = Array.from(currentDots).sort() as number[];
    cell.dots = newDots;
    
    // Atualiza a letra correspondente
    const suggestedLetter = findBestMatchingLetter(newDots);
    cell.letter = suggestedLetter;
    
    onGridChange(newGrid);
  }, [grid, onGridChange]);

  const startDrawing = useCallback((x: number, y: number, tool: string = 'pencil') => {
    console.log('startDrawing called with:', x, y, tool);
    setIsDrawing(true);
    const dotPosition = getBrailleDotAtPosition(x, y);
    console.log('dotPosition:', dotPosition);
    
    if (dotPosition) {
      console.log('Painting/Erasing dot at:', dotPosition);
      if (tool === 'eraser') {
        eraseDot(dotPosition.cellX, dotPosition.cellY, dotPosition.dotIndex);
      } else {
        paintDot(dotPosition.cellX, dotPosition.cellY, dotPosition.dotIndex);
      }
      setLastPaintedPoint(dotPosition);
    }
  }, [paintDot, eraseDot]);

  const continueDrawing = useCallback((x: number, y: number, tool: string = 'pencil') => {
    if (!isDrawing) return;
    
    const dotPosition = getBrailleDotAtPosition(x, y);
    
    if (dotPosition) {
      // Só pinta se for um ponto diferente do último pintado
      const isNewPoint = !lastPaintedPoint || 
        lastPaintedPoint.cellX !== dotPosition.cellX ||
        lastPaintedPoint.cellY !== dotPosition.cellY ||
        lastPaintedPoint.dotIndex !== dotPosition.dotIndex;
        
      if (isNewPoint) {
        if (tool === 'eraser') {
          eraseDot(dotPosition.cellX, dotPosition.cellY, dotPosition.dotIndex);
        } else {
          paintDot(dotPosition.cellX, dotPosition.cellY, dotPosition.dotIndex);
        }
        setLastPaintedPoint(dotPosition);
      }
    }
  }, [isDrawing, lastPaintedPoint, paintDot, eraseDot]);

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