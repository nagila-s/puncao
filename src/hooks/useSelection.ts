import { useState, useCallback } from 'react';
import { BrailleGrid, BrailleCell } from '@/types/braille';

export interface SelectionArea {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface ClipboardData {
  cells: (BrailleCell & { origin?: 'manual' | 'automatic' })[][];
  width: number;
  height: number;
}

const CELL_WIDTH = 20;
const CELL_HEIGHT = 30;

export const useSelection = (grid: BrailleGrid, onGridChange: (grid: BrailleGrid) => void) => {
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  
  // Estado para drag & drop
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  const getCellKey = (x: number, y: number) => `${x},${y}`;

  // Função para mover seleção com setas direcionais
  const moveSelection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (selectedCells.size === 0) return;

    const cellCoords = Array.from(selectedCells).map(key => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    });

    const minX = Math.min(...cellCoords.map(c => c.x));
    const maxX = Math.max(...cellCoords.map(c => c.x));
    const minY = Math.min(...cellCoords.map(c => c.y));
    const maxY = Math.max(...cellCoords.map(c => c.y));

    let deltaX = 0;
    let deltaY = 0;

    switch (direction) {
      case 'up':
        deltaY = -1;
        break;
      case 'down':
        deltaY = 1;
        break;
      case 'left':
        deltaX = -1;
        break;
      case 'right':
        deltaX = 1;
        break;
    }

    // Verificar se o movimento é possível
    const newMinX = minX + deltaX;
    const newMaxX = maxX + deltaX;
    const newMinY = minY + deltaY;
    const newMaxY = maxY + deltaY;

    if (newMinX < 0 || newMaxX >= grid.width || newMinY < 0 || newMaxY >= grid.height) {
      return; // Movimento não é possível
    }

    // Criar nova grade com o conteúdo movido
    const newGrid = JSON.parse(JSON.stringify(grid));
    
    // Primeiro, limpar as células originais
    selectedCells.forEach(cellKey => {
      const [x, y] = cellKey.split(',').map(Number);
      newGrid.cells[y][x] = {
        x,
        y,
        dots: [],
        letter: ' ',
        isActive: false
      };
    });

    // Depois, mover o conteúdo para as novas posições
    selectedCells.forEach(cellKey => {
      const [x, y] = cellKey.split(',').map(Number);
      const newX = x + deltaX;
      const newY = y + deltaY;
      
      if (newX >= 0 && newX < grid.width && newY >= 0 && newY < grid.height) {
        newGrid.cells[newY][newX] = {
          ...grid.cells[y][x],
          x: newX,
          y: newY
        };
      }
    });

    // Atualizar seleção para as novas posições
    const newSelectedCells = new Set<string>();
    selectedCells.forEach(cellKey => {
      const [x, y] = cellKey.split(',').map(Number);
      const newX = x + deltaX;
      const newY = y + deltaY;
      newSelectedCells.add(getCellKey(newX, newY));
    });

    setSelectedCells(newSelectedCells);
    onGridChange(newGrid);
  }, [selectedCells, grid, onGridChange]);

  // Função para iniciar drag & drop
  const startDrag = useCallback((x: number, y: number) => {
    console.log('startDrag called:', { x, y, selectedCellsSize: selectedCells.size });
    
    if (selectedCells.size === 0) {
      console.log('No cells selected, cannot start drag');
      return;
    }
    
    const cellX = Math.floor(x / CELL_WIDTH);
    const cellY = Math.floor(y / CELL_HEIGHT);
    
    // Verificar se o clique foi em uma célula selecionada
    const cellKey = getCellKey(cellX, cellY);
    console.log('Checking if click is on selected cell:', { cellX, cellY, cellKey, isSelected: selectedCells.has(cellKey) });
    
    if (!selectedCells.has(cellKey)) {
      console.log('Click not on selected cell, cannot start drag');
      return;
    }
    
    console.log('Starting drag from cell:', { cellX, cellY });
    setIsDragging(true);
    setDragStart({ x: cellX, y: cellY });
    setDragOffset({ x: 0, y: 0 });
  }, [selectedCells]);

  // Função para atualizar drag & drop
  const updateDrag = useCallback((x: number, y: number) => {
    if (!isDragging || !dragStart) {
      console.log('Not dragging or no drag start, ignoring updateDrag');
      return;
    }
    
    const cellX = Math.floor(x / CELL_WIDTH);
    const cellY = Math.floor(y / CELL_HEIGHT);
    
    const deltaX = cellX - dragStart.x;
    const deltaY = cellY - dragStart.y;
    
    console.log('Updating drag:', { cellX, cellY, deltaX, deltaY });
    setDragOffset({ x: deltaX, y: deltaY });
  }, [isDragging, dragStart]);

  // Função para finalizar drag & drop
  const finishDrag = useCallback(() => {
    console.log('finishDrag called, isDragging:', isDragging, 'dragOffset:', dragOffset);
    
    // Sempre resetar o estado de drag primeiro
    setIsDragging(false);
    setDragStart(null);
    setDragOffset(null);
    
    if (!isDragging) {
      console.log('Not dragging, nothing to finish');
      return;
    }
    
    const { x: deltaX, y: deltaY } = dragOffset || { x: 0, y: 0 };
    
    console.log('Drag finished with offset:', { deltaX, deltaY });
    
    if (deltaX === 0 && deltaY === 0) {
      // Sem movimento, apenas finalizar drag
      console.log('No movement detected, just finishing drag');
      return;
    }

    // Verificar se o movimento é possível
    const cellCoords = Array.from(selectedCells).map(key => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    });

    const minX = Math.min(...cellCoords.map(c => c.x));
    const maxX = Math.max(...cellCoords.map(c => c.x));
    const minY = Math.min(...cellCoords.map(c => c.y));
    const maxY = Math.max(...cellCoords.map(c => c.y));

    const newMinX = minX + deltaX;
    const newMaxX = maxX + deltaX;
    const newMinY = minY + deltaY;
    const newMaxY = maxY + deltaY;

    if (newMinX < 0 || newMaxX >= grid.width || newMinY < 0 || newMaxY >= grid.height) {
      // Movimento não é possível, apenas finalizar drag
      console.log('Movement not possible, cancelling drag');
      return;
    }

    // Mover o conteúdo
    const newGrid = JSON.parse(JSON.stringify(grid));
    
    // Primeiro, limpar as células originais
    selectedCells.forEach(cellKey => {
      const [x, y] = cellKey.split(',').map(Number);
      newGrid.cells[y][x] = {
        x,
        y,
        dots: [],
        letter: ' ',
        isActive: false
      };
    });

    // Depois, mover o conteúdo para as novas posições
    selectedCells.forEach(cellKey => {
      const [x, y] = cellKey.split(',').map(Number);
      const newX = x + deltaX;
      const newY = y + deltaY;
      
      if (newX >= 0 && newX < grid.width && newY >= 0 && newY < grid.height) {
        newGrid.cells[newY][newX] = {
          ...grid.cells[y][x],
          x: newX,
          y: newY
        };
      }
    });

    // Atualizar seleção para as novas posições
    const newSelectedCells = new Set<string>();
    selectedCells.forEach(cellKey => {
      const [x, y] = cellKey.split(',').map(Number);
      const newX = x + deltaX;
      const newY = y + deltaY;
      newSelectedCells.add(getCellKey(newX, newY));
    });

    setSelectedCells(newSelectedCells);
    onGridChange(newGrid);
    
    console.log('Finished dragging, moved selection by:', { deltaX, deltaY });
  }, [isDragging, dragOffset, selectedCells, grid, onGridChange]);

  // Função para cancelar drag & drop
  const cancelDrag = useCallback(() => {
    console.log('cancelDrag called, isDragging:', isDragging);
    
    // Sempre resetar o estado de drag
    setIsDragging(false);
    setDragStart(null);
    setDragOffset(null);
    
    console.log('Drag cancelled');
  }, [isDragging]);

  const startSelection = useCallback((x: number, y: number) => {
    const cellX = Math.floor(x / CELL_WIDTH);
    const cellY = Math.floor(y / CELL_HEIGHT);
    
    if (cellX >= 0 && cellX < grid.width && cellY >= 0 && cellY < grid.height) {
      setSelectionStart({ x: cellX, y: cellY });
      setSelectionEnd({ x: cellX, y: cellY });
      setIsSelecting(true);
      setSelectedCells(new Set()); // Limpa seleção anterior
    }
  }, [grid]);

  const updateSelection = useCallback((x: number, y: number) => {
    if (!isSelecting || !selectionStart) return;
    
    const cellX = Math.max(0, Math.min(grid.width - 1, Math.floor(x / CELL_WIDTH)));
    const cellY = Math.max(0, Math.min(grid.height - 1, Math.floor(y / CELL_HEIGHT)));
    
    setSelectionEnd({ x: cellX, y: cellY });
    
    // Atualiza células selecionadas com base na área retangular
    const newSelectedCells = new Set<string>();
    const minX = Math.min(selectionStart.x, cellX);
    const maxX = Math.max(selectionStart.x, cellX);
    const minY = Math.min(selectionStart.y, cellY);
    const maxY = Math.max(selectionStart.y, cellY);
    
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        newSelectedCells.add(`${x},${y}`);
      }
    }
    
    setSelectedCells(newSelectedCells);
  }, [isSelecting, selectionStart, grid]);

  const finishSelection = useCallback(() => {
    setIsSelecting(false);
    // Mantém as células selecionadas após finalizar
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCells(new Set());
    setIsSelecting(false);
    setSelectionStart(null);
  }, []);

  const selectCell = useCallback((x: number, y: number, addToSelection = false) => {
    const cellKey = getCellKey(x, y);
    if (addToSelection) {
      setSelectedCells(prev => {
        const newSet = new Set(prev);
        if (newSet.has(cellKey)) {
          newSet.delete(cellKey);
        } else {
          newSet.add(cellKey);
        }
        return newSet;
      });
    } else {
      setSelectedCells(new Set([cellKey]));
    }
  }, []);

  const copySelectedCells = useCallback(() => {
    if (selectedCells.size === 0) return;

    const cellCoords = Array.from(selectedCells).map(key => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    });

    const minX = Math.min(...cellCoords.map(c => c.x));
    const maxX = Math.max(...cellCoords.map(c => c.x));
    const minY = Math.min(...cellCoords.map(c => c.y));
    const maxY = Math.max(...cellCoords.map(c => c.y));

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const cells: (BrailleCell & { origin?: 'manual' | 'automatic' })[][] = [];

    for (let y = 0; y < height; y++) {
      cells[y] = [];
      for (let x = 0; x < width; x++) {
        const sourceX = minX + x;
        const sourceY = minY + y;
        const cellKey = getCellKey(sourceX, sourceY);
        
        if (selectedCells.has(cellKey)) {
          cells[y][x] = { ...grid.cells[sourceY][sourceX] };
        } else {
          cells[y][x] = {
            x: sourceX,
            y: sourceY,
            dots: [],
            letter: ' ',
            isActive: false
          };
        }
      }
    }

    setClipboard({ cells, width, height });
  }, [selectedCells, grid.cells]);

  const cutSelectedCells = useCallback(() => {
    copySelectedCells();
    
    const newGrid = JSON.parse(JSON.stringify(grid));
    selectedCells.forEach(cellKey => {
      const [x, y] = cellKey.split(',').map(Number);
      if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
        newGrid.cells[y][x] = {
          x,
          y,
          dots: [],
          letter: ' ',
          isActive: false
        };
      }
    });
    
    onGridChange(newGrid);
    clearSelection();
  }, [copySelectedCells, selectedCells, grid, onGridChange, clearSelection]);

  const pasteClipboard = useCallback((targetX: number, targetY: number) => {
    if (!clipboard) return;

    const newGrid = JSON.parse(JSON.stringify(grid));
    
    for (let y = 0; y < clipboard.height; y++) {
      for (let x = 0; x < clipboard.width; x++) {
        const pasteX = targetX + x;
        const pasteY = targetY + y;
        
        if (pasteX >= 0 && pasteX < grid.width && pasteY >= 0 && pasteY < grid.height) {
          const sourceCell = clipboard.cells[y][x];
          newGrid.cells[pasteY][pasteX] = {
            ...sourceCell,
            x: pasteX,
            y: pasteY,
            isActive: false
          };
        }
      }
    }
    
    onGridChange(newGrid);
  }, [clipboard, grid, onGridChange]);

  const deleteSelectedCells = useCallback(() => {
    const newGrid = JSON.parse(JSON.stringify(grid));
    selectedCells.forEach(cellKey => {
      const [x, y] = cellKey.split(',').map(Number);
      if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
        newGrid.cells[y][x] = {
          x,
          y,
          dots: [],
          letter: ' ',
          isActive: false
        };
      }
    });
    
    onGridChange(newGrid);
    clearSelection();
  }, [selectedCells, grid, onGridChange, clearSelection]);

  return {
    selectedCells,
    clipboard,
    isSelecting,
    selectionStart,
    selectionEnd,
    startSelection,
    updateSelection,
    finishSelection,
    clearSelection,
    selectCell,
    copySelectedCells,
    cutSelectedCells,
    pasteClipboard,
    deleteSelectedCells,
    hasClipboard: clipboard !== null,
    hasSelection: selectedCells.size > 0,
    isDragging,
    dragStart,
    dragOffset,
    startDrag,
    updateDrag,
    finishDrag,
    cancelDrag,
    moveSelection
  };
};