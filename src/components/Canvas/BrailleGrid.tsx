import { useEffect, useRef } from 'react';
import { BrailleGrid as BrailleGridType } from '@/types/braille';
import { useDrawing } from '@/hooks/useDrawing';

interface BrailleGridProps {
  grid: BrailleGridType;
  zoom: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  onCellClick: (x: number, y: number, event?: React.MouseEvent) => void;
  showLetters: boolean;
  selection: any;
  selectedTool: any;
  onGridChange?: (grid: BrailleGridType) => void;
}

// Configurações da célula braille
const CELL_WIDTH = 20;
const CELL_HEIGHT = 30;
const DOT_RADIUS = 2;

export const BrailleGrid: React.FC<BrailleGridProps> = ({
  grid,
  zoom,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onCellClick,
  showLetters,
  selection,
  selectedTool,
  onGridChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const {
    isDrawing,
    startDrawing,
    continueDrawing,
    finishDrawing,
    cancelDrawing
  } = useDrawing(grid, onGridChange || (() => {}));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas
    const scaledCellWidth = CELL_WIDTH * zoom;
    const scaledCellHeight = CELL_HEIGHT * zoom;
    
    canvas.width = grid.width * scaledCellWidth;
    canvas.height = grid.height * scaledCellHeight;
    
    // Limpar canvas - obter cor real das variáveis CSS
    const rootStyles = getComputedStyle(document.documentElement);
    const drawingAreaColor = rootStyles.getPropertyValue('--drawing-area').trim();
    ctx.fillStyle = `hsl(${drawingAreaColor})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenhar grade
    drawGrid(ctx, grid, scaledCellWidth, scaledCellHeight, zoom);
    
    // Desenhar células
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const cell = grid.cells[y][x];
        if (cell) {
          if (showLetters && cell.letter && cell.letter !== ' ') {
            drawLetter(ctx, cell, x, y, scaledCellWidth, scaledCellHeight, zoom);
          } else if (cell.dots.length > 0) {
            drawDots(ctx, cell, x, y, scaledCellWidth, scaledCellHeight, zoom);
          }
        }
      }
    }

  }, [grid, zoom, showLetters]);

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    grid: BrailleGridType,
    cellWidth: number,
    cellHeight: number,
    zoom: number
  ) => {
    // Obter cores das variáveis CSS
    const rootStyles = getComputedStyle(document.documentElement);
    const drawingGridColor = rootStyles.getPropertyValue('--drawing-grid').trim();
    const brailleGridColor = rootStyles.getPropertyValue('--braille-grid').trim();
    
    ctx.strokeStyle = `hsl(${drawingGridColor})`;
    ctx.lineWidth = 1;

    // Linhas verticais
    for (let x = 0; x <= grid.width; x++) {
      const xPos = x * cellWidth;
      ctx.beginPath();
      ctx.moveTo(xPos, 0);
      ctx.lineTo(xPos, grid.height * cellHeight);
      ctx.stroke();
    }

    // Linhas horizontais
    for (let y = 0; y <= grid.height; y++) {
      const yPos = y * cellHeight;
      ctx.beginPath();
      ctx.moveTo(0, yPos);
      ctx.lineTo(grid.width * cellWidth, yPos);
      ctx.stroke();
    }

    // Desenhar pontos de referência da grade braille (mais discretos)
    if (zoom >= 1) {
      ctx.fillStyle = `hsl(${brailleGridColor})`;
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const cellX = x * cellWidth;
          const cellY = y * cellHeight;
          
          // Desenhar os 6 pontos de referência de uma célula braille
          const dotPositions = [
            { x: cellX + cellWidth * 0.3, y: cellY + cellHeight * 0.2 }, // ponto 1
            { x: cellX + cellWidth * 0.3, y: cellY + cellHeight * 0.5 }, // ponto 2
            { x: cellX + cellWidth * 0.3, y: cellY + cellHeight * 0.8 }, // ponto 3
            { x: cellX + cellWidth * 0.7, y: cellY + cellHeight * 0.2 }, // ponto 4
            { x: cellX + cellWidth * 0.7, y: cellY + cellHeight * 0.5 }, // ponto 5
            { x: cellX + cellWidth * 0.7, y: cellY + cellHeight * 0.8 }, // ponto 6
          ];
          
          dotPositions.forEach(pos => {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 1 * zoom, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      }
    }
  };

  const drawDots = (
    ctx: CanvasRenderingContext2D,
    cell: any,
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    zoom: number
  ) => {
    const cellX = x * cellWidth;
    const cellY = y * cellHeight;
    
    const dotPositions = [
      { x: cellX + cellWidth * 0.3, y: cellY + cellHeight * 0.2 }, // ponto 1
      { x: cellX + cellWidth * 0.3, y: cellY + cellHeight * 0.5 }, // ponto 2
      { x: cellX + cellWidth * 0.3, y: cellY + cellHeight * 0.8 }, // ponto 3
      { x: cellX + cellWidth * 0.7, y: cellY + cellHeight * 0.2 }, // ponto 4
      { x: cellX + cellWidth * 0.7, y: cellY + cellHeight * 0.5 }, // ponto 5
      { x: cellX + cellWidth * 0.7, y: cellY + cellHeight * 0.8 }, // ponto 6
    ];

    const rootStyles = getComputedStyle(document.documentElement);
    const foregroundColor = rootStyles.getPropertyValue('--foreground').trim();
    const accentColor = rootStyles.getPropertyValue('--accent').trim();
    
    ctx.fillStyle = `hsl(${foregroundColor})`;
    // cell.dots é um array de números (1-6) representando pontos ativos
    cell.dots.forEach((dotNumber: number) => {
      const dotIndex = dotNumber - 1; // converter para 0-indexado
      if (dotPositions[dotIndex]) {
        const pos = dotPositions[dotIndex];
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, DOT_RADIUS * zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if (cell.isActive) {
      ctx.strokeStyle = `hsl(${accentColor})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(cellX + 1, cellY + 1, cellWidth - 2, cellHeight - 2);
    }
  };

  const drawLetter = (
    ctx: CanvasRenderingContext2D,
    cell: any,
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    zoom: number
  ) => {
    const cellX = x * cellWidth;
    const cellY = y * cellHeight;
    
    const rootStyles = getComputedStyle(document.documentElement);
    const foregroundColor = rootStyles.getPropertyValue('--foreground').trim();
    const accentColor = rootStyles.getPropertyValue('--accent').trim();
    
    ctx.fillStyle = `hsl(${foregroundColor})`;
    ctx.font = `${14 * zoom}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillText(
      cell.letter || ' ',
      cellX + cellWidth / 2,
      cellY + cellHeight / 2
    );

    if (cell.isActive) {
      ctx.strokeStyle = `hsl(${accentColor})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(cellX + 1, cellY + 1, cellWidth - 2, cellHeight - 2);
    }
  };


  const getMousePosition = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / zoom,
      y: (event.clientY - rect.top) / zoom
    };
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('handleMouseDown called, selectedTool:', selectedTool);
    const pos = getMousePosition(event);
    console.log('mouse position:', pos);
    
    if (selectedTool === 'pencil' || selectedTool === 'eraser') {
      console.log('Starting drawing/erasing');
      startDrawing(pos.x, pos.y, selectedTool);
      event.stopPropagation(); // Evita propagação dupla
    } else if (selectedTool === 'select') {
      // Para seleção, usar coordenadas reais do evento
      onMouseDown(event);
    } else if (selectedTool === 'text') {
      const cellX = Math.floor(pos.x / CELL_WIDTH);
      const cellY = Math.floor(pos.y / CELL_HEIGHT);
      
      if (cellX >= 0 && cellX < grid.width && cellY >= 0 && cellY < grid.height) {
        onCellClick(cellX, cellY, event);
      }
    } else if (selectedTool === 'fill') {
      const cellX = Math.floor(pos.x / CELL_WIDTH);
      const cellY = Math.floor(pos.y / CELL_HEIGHT);
      
      if (cellX >= 0 && cellX < grid.width && cellY >= 0 && cellY < grid.height) {
        onCellClick(cellX, cellY, event);
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if ((selectedTool === 'pencil' || selectedTool === 'eraser') && isDrawing) {
      const pos = getMousePosition(event);
      continueDrawing(pos.x, pos.y, selectedTool);
      event.stopPropagation();
    } else if (selectedTool === 'select') {
      onMouseMove(event);
    }
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if ((selectedTool === 'pencil' || selectedTool === 'eraser') && isDrawing) {
      finishDrawing();
      event.stopPropagation();
    } else if (selectedTool === 'select') {
      onMouseUp(event);
    }
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if ((selectedTool === 'pencil' || selectedTool === 'eraser') && isDrawing) {
      cancelDrawing();
    }
    
    // Propagar evento para área de desenho
    onMouseLeave(event);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="border border-border cursor-crosshair"
        style={{
          imageRendering: 'pixelated',
          cursor: selectedTool === 'pencil' ? 'crosshair' : selectedTool === 'select' ? 'default' : 'pointer'
        }}
      />
      
      {/* Selection overlay */}
      {((selection.isSelecting && selection.selectionStart && selection.selectionEnd) || 
        (selection.hasSelection && selection.selectedCells.size > 0)) && (
        <div className="absolute inset-0 pointer-events-none">
          {selection.isSelecting && selection.selectionStart && selection.selectionEnd ? (
            // Retângulo durante seleção ativa
            <div 
              className="border-2 border-yellow-400 bg-yellow-400/20 absolute"
              style={{
                left: `${Math.min(selection.selectionStart.x, selection.selectionEnd.x) * CELL_WIDTH * zoom}px`,
                top: `${Math.min(selection.selectionStart.y, selection.selectionEnd.y) * CELL_HEIGHT * zoom}px`,
                width: `${Math.abs(selection.selectionEnd.x - selection.selectionStart.x + 1) * CELL_WIDTH * zoom}px`,
                height: `${Math.abs(selection.selectionEnd.y - selection.selectionStart.y + 1) * CELL_HEIGHT * zoom}px`,
              }}
            />
          ) : (
            // Retângulos para células selecionadas
            Array.from(selection.selectedCells).map((cellKey: string) => {
              const [x, y] = cellKey.split(',').map(Number);
              return (
                <div 
                  key={cellKey}
                  className="border-2 border-yellow-400 bg-yellow-400/20 absolute"
                  style={{
                    left: `${x * CELL_WIDTH * zoom}px`,
                    top: `${y * CELL_HEIGHT * zoom}px`,
                    width: `${CELL_WIDTH * zoom}px`,
                    height: `${CELL_HEIGHT * zoom}px`,
                  }}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
