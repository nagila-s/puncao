import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { BrailleGrid as BrailleGridType } from "@/types/braille";
import { useDrawing } from "@/hooks/useDrawing";

export interface BrailleGridProps {
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
  hasClipboard: boolean;
  onSelectionChange: (selection: any) => void;
}

const CELL_WIDTH = 20;
const CELL_HEIGHT = 30;
const DOT_RADIUS = 2;

export type BrailleGridRef = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  getMousePosition: (
    event: React.MouseEvent<HTMLCanvasElement>
  ) => { x: number; y: number };
};

export const BrailleGrid = forwardRef<BrailleGridRef, BrailleGridProps>(
  function BrailleGrid(
    {
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
      onGridChange,
      hasClipboard,
      onSelectionChange,
    },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { isDrawing, startDrawing, continueDrawing, finishDrawing, cancelDrawing } =
      useDrawing(grid, onGridChange || (() => {}));

    useImperativeHandle(
      ref,
      () => ({
        canvasRef,
        getMousePosition: (event: React.MouseEvent<HTMLCanvasElement>) => {
          const canvas = canvasRef.current!;
          const rect = canvas.getBoundingClientRect();
          return {
            x: (event.clientX - rect.left) / zoom,
            y: (event.clientY - rect.top) / zoom,
          };
        },
      }),
      [zoom]
    );

    useEffect(() => {
      onSelectionChange?.(selection);
    }, [selection]);

    // CORREÇÃO: Effect para limpar seleção quando muda ferramenta
    useEffect(() => {
      // Se mudou para uma ferramenta que não é select e há seleção ativa, limpar
      if (selectedTool !== "select" && selection?.hasSelection && selection.clearSelection) {
        console.log("🔴 Ferramenta mudou para", selectedTool, "- limpando seleção");
        selection.clearSelection();
      }
    }, [selectedTool, selection?.hasSelection, selection?.clearSelection]);

    // CORREÇÃO: Effect para ESC e outros eventos de teclado
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // ESC para limpar seleção
        if (e.key === 'Escape' && selection?.hasSelection && selection.clearSelection) {
          console.log("🔴 ESC pressionado - limpando seleção");
          selection.clearSelection();
          e.preventDefault();
        }
        
        // Setas para mover seleção (só se ferramenta select estiver ativa)
        if (selectedTool === "select" && selection?.hasSelection && selection.moveSelection && 
            ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
          selection.moveSelection(direction);
        }
      };

      // Adicionar listener de teclado
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [selectedTool, selection?.hasSelection, selection?.clearSelection, selection?.moveSelection]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const scaledCellW = CELL_WIDTH * zoom;
      const scaledCellH = CELL_HEIGHT * zoom;

      canvas.width = grid.width * scaledCellW;
      canvas.height = grid.height * scaledCellH;

      const root = getComputedStyle(document.documentElement);
      const drawingAreaColor = root.getPropertyValue("--drawing-area").trim();
      ctx.fillStyle = `hsl(${drawingAreaColor})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawGrid(ctx, grid, scaledCellW, scaledCellH, zoom);

      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const cell = grid.cells[y][x];
          if (!cell) continue;

          if (showLetters && cell.letter && cell.letter !== " ") {
            drawLetter(ctx, cell, x, y, scaledCellW, scaledCellH, zoom);
          } else if (cell.dots.length > 0) {
            drawDots(ctx, cell, x, y, scaledCellW, scaledCellH, zoom);
          }
        }
      }
    }, [grid, zoom, showLetters]);

    const drawGrid = (
      ctx: CanvasRenderingContext2D,
      g: BrailleGridType,
      cellW: number,
      cellH: number,
      z: number
    ) => {
      const root = getComputedStyle(document.documentElement);
      const drawingGridColor = root.getPropertyValue("--drawing-grid").trim();
      const brailleGridColor = root.getPropertyValue("--braille-grid").trim();

      ctx.strokeStyle = `hsl(${drawingGridColor})`;
      ctx.lineWidth = 1;

      for (let x = 0; x <= g.width; x++) {
        const xPos = x * cellW;
        ctx.beginPath();
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, g.height * cellH);
        ctx.stroke();
      }
      for (let y = 0; y <= g.height; y++) {
        const yPos = y * cellH;
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(g.width * cellW, yPos);
        ctx.stroke();
      }

      if (z >= 1) {
        ctx.fillStyle = `hsl(${brailleGridColor})`;
        for (let y = 0; y < g.height; y++) {
          for (let x = 0; x < g.width; x++) {
            const cx = x * cellW;
            const cy = y * cellH;
            const dots = [
              { x: cx + cellW * 0.3, y: cy + cellH * 0.2 },
              { x: cx + cellW * 0.3, y: cy + cellH * 0.5 },
              { x: cx + cellW * 0.3, y: cy + cellH * 0.8 },
              { x: cx + cellW * 0.7, y: cy + cellH * 0.2 },
              { x: cx + cellW * 0.7, y: cy + cellH * 0.5 },
              { x: cx + cellW * 0.7, y: cy + cellH * 0.8 },
            ];
            dots.forEach((p) => {
              ctx.beginPath();
              ctx.arc(p.x, p.y, 1 * z, 0, Math.PI * 2);
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
      cellW: number,
      cellH: number,
      z: number
    ) => {
      const cx = x * cellW;
      const cy = y * cellH;

      const positions = [
        { x: cx + cellW * 0.3, y: cy + cellH * 0.2 },
        { x: cx + cellW * 0.3, y: cy + cellH * 0.5 },
        { x: cx + cellW * 0.3, y: cy + cellH * 0.8 },
        { x: cx + cellW * 0.7, y: cy + cellH * 0.2 },
        { x: cx + cellW * 0.7, y: cy + cellH * 0.5 },
        { x: cx + cellW * 0.7, y: cy + cellH * 0.8 },
      ];

      const root = getComputedStyle(document.documentElement);
      const foreground = root.getPropertyValue("--foreground").trim();
      const accent = root.getPropertyValue("--accent").trim();

      ctx.fillStyle = `hsl(${foreground})`;
      cell.dots.forEach((dotNum: number) => {
        const i = dotNum - 1;
        const p = positions[i];
        if (!p) return;
        ctx.beginPath();
        ctx.arc(p.x, p.y, DOT_RADIUS * z, 0, Math.PI * 2);
        ctx.fill();
      });

      if (cell.isActive) {
        ctx.strokeStyle = `hsl(${accent})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx + 1, cy + 1, cellW - 2, cellH - 2);
      }
    };

    const drawLetter = (
      ctx: CanvasRenderingContext2D,
      cell: any,
      x: number,
      y: number,
      cellW: number,
      cellH: number,
      z: number
    ) => {
      const cx = x * cellW;
      const cy = y * cellH;

      const root = getComputedStyle(document.documentElement);
      const foreground = root.getPropertyValue("--foreground").trim();
      const accent = root.getPropertyValue("--accent").trim();

      ctx.fillStyle = `hsl(${foreground})`;
      ctx.font = `${14 * z}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cell.letter || " ", cx + cellW / 2, cy + cellH / 2);

      if (cell.isActive) {
        ctx.strokeStyle = `hsl(${accent})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx + 1, cy + 1, cellW - 2, cellH - 2);
      }
    };

    const getMousePosition = (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / zoom,
        y: (event.clientY - rect.top) / zoom,
      };
    };

    // CORREÇÃO 1: Função para determinar se deve iniciar seleção/drag
    const shouldHandleSelectionOrDrag = (pos: { x: number; y: number }) => {
      // Se não é ferramenta select, não maneja seleção
      if (selectedTool !== "select") return false;

      // Se há células selecionadas, verifica se clicou em uma delas
      if (selection?.hasSelection) {
        const cellX = Math.floor(pos.x / CELL_WIDTH);
        const cellY = Math.floor(pos.y / CELL_HEIGHT);
        const cellKey = `${cellX},${cellY}`;
        
        return selection.selectedCells.has(cellKey);
      }

      // Se não há seleção, sempre permite iniciar nova seleção
      return true;
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      console.log("🟡 [BrailleGrid] handleMouseDown chamado, ferramenta:", selectedTool);
      const pos = getMousePosition(e);

      // CORREÇÃO 2: Priorizar seleção/drag quando apropriado
      if (selectedTool === "select") {
        const shouldHandleSelection = shouldHandleSelectionOrDrag(pos);
        
        if (shouldHandleSelection && selection?.hasSelection) {
          // Se há seleção e clicou numa célula selecionada, tentar iniciar drag
          const cellX = Math.floor(pos.x / CELL_WIDTH);
          const cellY = Math.floor(pos.y / CELL_HEIGHT);
          const cellKey = `${cellX},${cellY}`;
          
          if (selection.selectedCells.has(cellKey)) {
            console.log("🔵 Tentando iniciar drag");
            // Tentar iniciar drag através do selection hook
            const dragStarted = selection.startDrag && selection.startDrag(pos.x, pos.y);
            if (dragStarted) {
              console.log("✅ Drag iniciado com sucesso");
              e.stopPropagation();
              return;
            }
          }
        }
        
        // Se não iniciou drag, delegar para o DrawingArea (seleção)
        console.log("🔵 Delegando para DrawingArea (seleção)");
        onMouseDown(e);
        return;
      }

      // CORREÇÃO 3: Sempre limpar seleção para outras ferramentas
      if (selection?.hasSelection && selection.clearSelection) {
        console.log("🔴 Limpando seleção - ferramenta não é select");
        selection.clearSelection();
        // Forçar re-render para garantir que a seleção visual suma
        setTimeout(() => {
          onSelectionChange?.(selection);
        }, 0);
      }

      if (selectedTool === "pencil" || selectedTool === "eraser") {
        startDrawing(pos.x, pos.y, selectedTool);
        e.stopPropagation();
      } else if (selectedTool === "text" || selectedTool === "fill") {
        const cellX = Math.floor(pos.x / CELL_WIDTH);
        const cellY = Math.floor(pos.y / CELL_HEIGHT);
        if (
          cellX >= 0 &&
          cellX < grid.width &&
          cellY >= 0 &&
          cellY < grid.height
        ) {
          onCellClick(cellX, cellY, e);
        }
      }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      // CORREÇÃO 4: Priorizar drag se está acontecendo
      if (selectedTool === "select" && selection?.isDragging) {
        const pos = getMousePosition(e);
        console.log("🔵 Atualizando drag");
        if (selection.updateDrag) {
          selection.updateDrag(pos.x, pos.y);
        }
        e.stopPropagation();
        return;
      }
      
      if ((selectedTool === "pencil" || selectedTool === "eraser") && isDrawing) {
        const pos = getMousePosition(e);
        continueDrawing(pos.x, pos.y, selectedTool);
        e.stopPropagation();
      } else if (selectedTool === "select") {
        // Para a ferramenta select, delegamos para o DrawingArea
        onMouseMove(e);
      }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
      console.log("🟡 [BrailleGrid] handleMouseUp chamado, ferramenta:", selectedTool);
      
      // CORREÇÃO 5: Finalizar drag se estava acontecendo
      if (selectedTool === "select" && selection?.isDragging) {
        console.log("🔵 Finalizando drag");
        if (selection.finishDrag) {
          selection.finishDrag();
        }
        e.stopPropagation();
        return;
      }
      
      if ((selectedTool === "pencil" || selectedTool === "eraser") && isDrawing) {
        finishDrawing();
        e.stopPropagation();
      } else if (selectedTool === "select") {
        // Para select, só fazemos click em célula se NÃO estava selecionando (arraste)
        if (!selection?.isSelecting && !selection?.isDragging) {
          const pos = getMousePosition(e);
          const cellX = Math.floor(pos.x / CELL_WIDTH);
          const cellY = Math.floor(pos.y / CELL_HEIGHT);

          if (
            cellX >= 0 &&
            cellX < grid.width &&
            cellY >= 0 &&
            cellY < grid.height
          ) {
            onCellClick(cellX, cellY, e);
          }
        }
        
        // Sempre delegamos para o DrawingArea para finalizar seleção
        onMouseUp(e);
      }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if ((selectedTool === "pencil" || selectedTool === "eraser") && isDrawing) {
        cancelDrawing();
      }
      
      // CORREÇÃO 6: Cancelar drag se sair do canvas
      if (selectedTool === "select" && selection?.isDragging) {
        console.log("🔴 Cancelando drag por mouse leave");
        if (selection.cancelDrag) {
          selection.cancelDrag();
        }
      }
      
      if (selectedTool === "select") {
        onMouseLeave(e);
      }
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
            imageRendering: "pixelated",
            cursor: (() => {
              if (selectedTool === "pencil") return "crosshair";
              if (selectedTool === "select") {
                if (selection?.isDragging) return "grabbing";
                if (selection?.hasSelection) return "grab";
                return "default";
              }
              return "pointer";
            })(),
          }}
        />

        {/* CORREÇÃO 7: Visual melhorado para drag */}
        {(function () {
          const hasSelectedCells = selection?.selectedCells?.size > 0;
          const selectingNow =
            selection?.isSelecting &&
            selection?.selectionStart &&
            selection?.selectionEnd;

          const selectedSingleCell =
            !selection?.isSelecting &&
            selection?.selectedCells?.size === 1
              ? String(Array.from(selection.selectedCells)[0])
              : null;

          const [onlyX, onlyY] = selectedSingleCell
            ? selectedSingleCell.split(",").map(Number)
            : [null, null];

          console.log("🟨 brailleGrid - selection props:", {
            isSelecting: selection?.isSelecting,
            start: selection?.selectionStart,
            end: selection?.selectionEnd,
            selectedCells: selection?.selectedCells,
            isDragging: selection?.isDragging,
          });

          return (hasSelectedCells || selectingNow || selectedSingleCell) && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Overlay durante seleção por arraste */}
              {selection?.isSelecting &&
              selection?.selectionStart &&
              selection?.selectionEnd ? (
                <div
                  className="border-2 border-yellow-400 bg-yellow-400/20 absolute"
                  style={{
                    left: `${
                      Math.min(
                        selection.selectionStart.x,
                        selection.selectionEnd.x
                      ) * CELL_WIDTH * zoom
                    }px`,
                    top: `${
                      Math.min(
                        selection.selectionStart.y,
                        selection.selectionEnd.y
                      ) * CELL_HEIGHT * zoom
                    }px`,
                    width: `${
                      Math.abs(
                        selection.selectionEnd.x - selection.selectionStart.x + 1
                      ) * CELL_WIDTH * zoom
                    }px`,
                    height: `${
                      Math.abs(
                        selection.selectionEnd.y - selection.selectionStart.y + 1
                      ) * CELL_HEIGHT * zoom
                    }px`,
                  }}
                />
              ) : null}

              {/* Células selecionadas normais */}
              {!selection?.isDragging && selection?.selectedCells?.size > 0 &&
                Array.from(selection.selectedCells).map((key: string) => {
                  const [x, y] = key.split(",").map(Number);
                  return (
                    <div
                      key={key}
                      className="border-2 border-yellow-400 bg-yellow-400/20 absolute"
                      style={{
                        left: `${x * CELL_WIDTH * zoom}px`,
                        top: `${y * CELL_HEIGHT * zoom}px`,
                        width: `${CELL_WIDTH * zoom}px`,
                        height: `${CELL_HEIGHT * zoom}px`,
                      }}
                    />
                  );
                })}

              {/* Preview durante drag */}
              {selection?.isDragging && selection?.dragOffset && selection?.selectedCells &&
                Array.from(selection.selectedCells).map((key: string) => {
                  const [x, y] = key.split(",").map(Number);
                  const newX = x + selection.dragOffset.x;
                  const newY = y + selection.dragOffset.y;
                  
                  // Verificar se a nova posição é válida
                  const isValid = newX >= 0 && newX < grid.width && newY >= 0 && newY < grid.height;
                  
                  return (
                    <div
                      key={`drag-${key}`}
                      className={`absolute border-2 ${
                        isValid 
                          ? 'border-gray-400 bg-gray-300' 
                          : 'border-gray-500 bg-gray-400'
                      } bg-opacity-40`}
                      style={{
                        left: `${newX * CELL_WIDTH * zoom}px`,
                        top: `${newY * CELL_HEIGHT * zoom}px`,
                        width: `${CELL_WIDTH * zoom}px`,
                        height: `${CELL_HEIGHT * zoom}px`,
                      }}
                    />
                  );
                })}
            </div>
          );
        })()}
      </div>
    );
  }
);