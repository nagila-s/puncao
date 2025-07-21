import { useCallback, useState } from 'react';
import { BrailleGrid, BrailleCell, Tool } from '@/types/braille';
import { findBestMatchingLetter } from '@/lib/brailleMappings';

const CELL_WIDTH = 20;
const CELL_HEIGHT = 30;

export const useShapes = (grid: BrailleGrid, onGridChange: (grid: BrailleGrid) => void) => {
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const getCellCoordinates = (x: number, y: number) => {
    return {
      cellX: Math.floor(x / CELL_WIDTH),
      cellY: Math.floor(y / CELL_HEIGHT)
    };
  };

  const fillCell = (newGrid: BrailleGrid, cellX: number, cellY: number, pattern: number[]) => {
    if (cellX >= 0 && cellX < grid.width && cellY >= 0 && cellY < grid.height) {
      const cell = newGrid.cells[cellY][cellX];
      cell.dots = pattern;
      cell.letter = findBestMatchingLetter(pattern);
      cell.origin = 'manual';
    }
  };

  const drawLine = (newGrid: BrailleGrid, x1: number, y1: number, x2: number, y2: number, isShiftPressed = false) => {
    // Se Shift pressionado, força linha reta (horizontal, vertical ou diagonal 45°)
    if (isShiftPressed) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > absDy) {
        // Linha horizontal
        y2 = y1;
      } else if (absDy > absDx) {
        // Linha vertical
        x2 = x1;
      } else {
        // Diagonal 45°
        const maxDist = Math.max(absDx, absDy);
        x2 = x1 + Math.sign(dx) * maxDist;
        y2 = y1 + Math.sign(dy) * maxDist;
      }
    }

    const cells1 = getCellCoordinates(x1, y1);
    const cells2 = getCellCoordinates(x2, y2);

    // Algoritmo de Bresenham para linha
    const dx = Math.abs(cells2.cellX - cells1.cellX);
    const dy = Math.abs(cells2.cellY - cells1.cellY);
    const sx = cells1.cellX < cells2.cellX ? 1 : -1;
    const sy = cells1.cellY < cells2.cellY ? 1 : -1;
    let err = dx - dy;

    let currentX = cells1.cellX;
    let currentY = cells1.cellY;

    while (true) {
      // Padrão de linha vertical/horizontal
      const pattern = [1, 2, 3, 4, 5, 6]; // Preenche toda a célula para linha
      fillCell(newGrid, currentX, currentY, pattern);

      if (currentX === cells2.cellX && currentY === cells2.cellY) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        currentX += sx;
      }
      if (e2 < dx) {
        err += dx;
        currentY += sy;
      }
    }
  };

  const drawRectangle = (newGrid: BrailleGrid, x1: number, y1: number, x2: number, y2: number, isShiftPressed = false) => {
    const cells1 = getCellCoordinates(x1, y1);
    const cells2 = getCellCoordinates(x2, y2);

    let minX = Math.min(cells1.cellX, cells2.cellX);
    let maxX = Math.max(cells1.cellX, cells2.cellX);
    let minY = Math.min(cells1.cellY, cells2.cellY);
    let maxY = Math.max(cells1.cellY, cells2.cellY);

    // Se Shift pressionado, força quadrado perfeito
    if (isShiftPressed) {
      const size = Math.min(maxX - minX, maxY - minY);
      maxX = minX + size;
      maxY = minY + size;
    }

    // Desenha apenas o contorno
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (x === minX || x === maxX || y === minY || y === maxY) {
          const pattern = [1, 2, 3, 4, 5, 6]; // Contorno completo
          fillCell(newGrid, x, y, pattern);
        }
      }
    }
  };

  const drawCircle = (newGrid: BrailleGrid, x1: number, y1: number, x2: number, y2: number) => {
    const cells1 = getCellCoordinates(x1, y1);
    const cells2 = getCellCoordinates(x2, y2);

    const centerX = cells1.cellX;
    const centerY = cells1.cellY;
    const radius = Math.max(Math.abs(cells2.cellX - cells1.cellX), Math.abs(cells2.cellY - cells1.cellY));

    // Algoritmo de círculo usando pontos
    for (let angle = 0; angle < 360; angle += 5) {
      const rad = (angle * Math.PI) / 180;
      const x = Math.round(centerX + radius * Math.cos(rad));
      const y = Math.round(centerY + radius * Math.sin(rad));
      
      const pattern = [1, 4]; // Pontos laterais para representar círculo
      fillCell(newGrid, x, y, pattern);
    }
  };

  const drawTriangle = (newGrid: BrailleGrid, x1: number, y1: number, x2: number, y2: number) => {
    const cells1 = getCellCoordinates(x1, y1);
    const cells2 = getCellCoordinates(x2, y2);

    // Triângulo com três vértices
    const topX = cells1.cellX;
    const topY = cells1.cellY;
    const bottomLeftX = cells1.cellX - Math.abs(cells2.cellX - cells1.cellX);
    const bottomLeftY = cells2.cellY;
    const bottomRightX = cells1.cellX + Math.abs(cells2.cellX - cells1.cellX);
    const bottomRightY = cells2.cellY;

    // Desenha as três linhas do triângulo
    drawLine(newGrid, topX * CELL_WIDTH, topY * CELL_HEIGHT, bottomLeftX * CELL_WIDTH, bottomLeftY * CELL_HEIGHT);
    drawLine(newGrid, topX * CELL_WIDTH, topY * CELL_HEIGHT, bottomRightX * CELL_WIDTH, bottomRightY * CELL_HEIGHT);
    drawLine(newGrid, bottomLeftX * CELL_WIDTH, bottomLeftY * CELL_HEIGHT, bottomRightX * CELL_WIDTH, bottomRightY * CELL_HEIGHT);
  };

  const floodFill = (newGrid: BrailleGrid, startX: number, startY: number) => {
    console.log('floodFill called with:', startX, startY);
    if (startX < 0 || startX >= newGrid.width || startY < 0 || startY >= newGrid.height) {
      console.log('floodFill: coordinates out of bounds');
      return;
    }
    
    const startCell = newGrid.cells[startY][startX];
    console.log('floodFill: startCell:', startCell);
    const originalDots = JSON.stringify(startCell.dots.sort());
    const fillPattern = [1, 2, 3, 4, 5, 6]; // Preenche com todos os pontos
    const targetDots = JSON.stringify(fillPattern.sort());
    
    console.log('floodFill: originalDots:', originalDots, 'targetDots:', targetDots);
    
    // Se já está preenchido, não faz nada
    if (originalDots === targetDots) {
      console.log('floodFill: already filled, returning');
      return;
    }
    
    const stack = [{ x: startX, y: startY }];
    const visited = new Set<string>();
    let cellsFilled = 0;
    
    console.log('floodFill: starting flood fill algorithm');
    
    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const cellKey = `${x},${y}`;
      
      if (visited.has(cellKey)) continue;
      if (x < 0 || x >= newGrid.width || y < 0 || y >= newGrid.height) continue;
      
      const currentCell = newGrid.cells[y][x];
      const currentDots = JSON.stringify(currentCell.dots.sort());
      
      // Se não é igual ao padrão original, para (encontrou uma "parede")
      if (currentDots !== originalDots) continue;
      
      visited.add(cellKey);
      
      // Preenche a célula atual
      fillCell(newGrid, x, y, fillPattern);
      cellsFilled++;
      
      // Adiciona células vizinhas ao stack
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }
    
    console.log('floodFill: filled', cellsFilled, 'cells');
  };

  const startShape = useCallback((x: number, y: number) => {
    setIsDrawingShape(true);
    setStartPoint({ x, y });
  }, []);

  const finishShape = useCallback((x: number, y: number, tool: Tool, isShiftPressed = false) => {
    if (!isDrawingShape || !startPoint) return;

    const newGrid = JSON.parse(JSON.stringify(grid));

    switch (tool) {
      case 'line':
        drawLine(newGrid, startPoint.x, startPoint.y, x, y, isShiftPressed);
        break;
      case 'rectangle':
        drawRectangle(newGrid, startPoint.x, startPoint.y, x, y, isShiftPressed);
        break;
      case 'circle':
        drawCircle(newGrid, startPoint.x, startPoint.y, x, y);
        break;
      case 'triangle':
        drawTriangle(newGrid, startPoint.x, startPoint.y, x, y);
        break;
    }

    onGridChange(newGrid);
    setIsDrawingShape(false);
    setStartPoint(null);
  }, [isDrawingShape, startPoint, grid, onGridChange]);

  const cancelShape = useCallback(() => {
    setIsDrawingShape(false);
    setStartPoint(null);
  }, []);

  return {
    isDrawingShape,
    startShape,
    finishShape,
    cancelShape,
    startPoint,
    floodFill
  };
};