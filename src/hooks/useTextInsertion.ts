import { useCallback } from 'react';
import { BrailleGrid } from '@/types/braille';
import { letterToBraillePatternFunc } from '@/lib/brailleMappings';

export const useTextInsertion = (grid: BrailleGrid, onGridChange: (grid: BrailleGrid) => void) => {
  
  const insertText = useCallback((text: string, startX: number, startY: number) => {
    const newGrid = JSON.parse(JSON.stringify(grid));
    const characters = text.toLowerCase().split('');
    
    let currentX = startX;
    let currentY = startY;
    
    characters.forEach((char) => {
      // Quebra de linha manual
      if (char === '\n') {
        currentX = startX;
        currentY++;
        return;
      }
      
      // Quebra automática de linha
      if (currentX >= grid.width) {
        currentX = startX;
        currentY++;
      }
      
      // Verifica se ainda está dentro da grade
      if (currentY >= grid.height) {
        return; // Para de inserir se sair da grade
      }
      
      // Insere o caractere
      if (currentX >= 0 && currentX < grid.width && currentY >= 0 && currentY < grid.height) {
        const dots = letterToBraillePatternFunc(char);
        newGrid.cells[currentY][currentX] = {
          x: currentX,
          y: currentY,
          dots,
          letter: char,
          isActive: false,
          origin: 'automatic'
        };
      }
      
      currentX++;
    });
    
    onGridChange(newGrid);
  }, [grid, onGridChange]);
  
  return {
    insertText
  };
};