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
}

// Medidas da célula/grade
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
    },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { isDrawing, startDrawing, continueDrawing, finishDrawing, cancelDrawing } =
      useDrawing(grid, onGridChange || (() => {}));

    // expõe ref e utilitário de coordenadas para o pai
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

    // desenho do canvas
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const scaledCellW = CELL_WIDTH * zoom;
      const scaledCellH = CELL_HEIGHT * zoom;

      canvas.width = grid.width * scaledCellW;
      canvas.height = grid.height * scaledCellH;

      // cores do tema
      const root = getComputedStyle(document.documentElement);
      const drawingAreaColor = root.getPropertyValue("--drawing-area").trim();
      ctx.fillStyle = `hsl(${drawingAreaColor})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // grade
      drawGrid(ctx, grid, scaledCellW, scaledCellH, zoom);

      // conteúdo das células
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

      // verticais
      for (let x = 0; x <= g.width; x++) {
        const xPos = x * cellW;
        ctx.beginPath();
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, g.height * cellH);
        ctx.stroke();
      }
      // horizontais
      for (let y = 0; y <= g.height; y++) {
        const yPos = y * cellH;
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(g.width * cellW, yPos);
        ctx.stroke();
      }

      // pontos de referência da célula
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

    // util coords locais
    const getMousePosition = (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / zoom,
        y: (event.clientY - rect.top) / zoom,
      };
    };

    // handlers
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getMousePosition(e);

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
      } else if (selectedTool === "select") {
        onMouseDown(e);
      }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if ((selectedTool === "pencil" || selectedTool === "eraser") && isDrawing) {
        const pos = getMousePosition(e);
        continueDrawing(pos.x, pos.y, selectedTool);
        e.stopPropagation();
      } else if (selectedTool === "select") {
        onMouseMove(e);
      }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if ((selectedTool === "pencil" || selectedTool === "eraser") && isDrawing) {
        finishDrawing();
        e.stopPropagation();
      } else if (selectedTool === "select") {
        onMouseUp(e);
      }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if ((selectedTool === "pencil" || selectedTool === "eraser") && isDrawing) {
        cancelDrawing();
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

        {/* overlay da seleção */}
        {(() => {
          const hasSelectedCells = selection?.selectedCells?.size > 0;
          const selectingNow =
            selection?.isSelecting &&
            selection?.selectionStart &&
            selection?.selectionEnd;
          return hasSelectedCells || selectingNow;
        })() && (
          <div className="absolute inset-0 pointer-events-none">
            {selection.isSelecting &&
            selection.selectionStart &&
            selection.selectionEnd ? (
              <div
                className="border-2 border-yellow-400 bg-yellow-400/20 absolute"
                style={{
                  left: `${
                    Math.min(selection.selectionStart.x, selection.selectionEnd.x) *
                    CELL_WIDTH *
                    zoom
                  }px`,
                  top: `${
                    Math.min(selection.selectionStart.y, selection.selectionEnd.y) *
                    CELL_HEIGHT *
                    zoom
                  }px`,
                  width: `${
                    Math.abs(
                      selection.selectionEnd.x - selection.selectionStart.x + 1
                    ) *
                    CELL_WIDTH *
                    zoom
                  }px`,
                  height: `${
                    Math.abs(
                      selection.selectionEnd.y - selection.selectionStart.y + 1
                    ) *
                    CELL_HEIGHT *
                    zoom
                  }px`,
                }}
              />
            ) : (
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
              })
            )}
          </div>
        )}
      </div>
    );
  }
);
