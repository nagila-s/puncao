// src/components/Canvas/DrawingArea.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { BrailleGrid } from './BrailleGrid';
import { ZoomControls } from '../Controls/ZoomControls';
import { ResolutionControls } from '../Controls/ResolutionControls';
import { CopyLetters } from '../Controls/CopyLetters';
import { BrailleGrid as BrailleGridType } from '@/types/braille';

interface DrawingAreaProps {
  grid: BrailleGridType;
  zoom: number;
  selectedTool: string;
  showLetters?: boolean;
  selection?: any;
  textOverlay?: any;
  onZoomChange: (zoom: number) => void;
  onResolutionChange: (resolution: { width: number; height: number; label: string }) => void;
  onCellClick: (x: number, y: number, event?: React.MouseEvent) => void;
  onGridChange: (grid: BrailleGridType) => void;
  onToggleLetters?: () => void;
  onInsertText?: (cellX: number, cellY: number, text: string) => void; // <- usado para gravar no grid
}

const CELL_WIDTH = 20;
const CELL_HEIGHT = 30;

type TextBoxState = {
  cellX: number;
  cellY: number;
  left: number; // px
  top: number;  // px
  value: string;
};

export const DrawingArea = ({
  grid,
  zoom,
  selectedTool,
  showLetters: propShowLetters,
  selection,
  textOverlay,
  onZoomChange,
  onResolutionChange,
  onCellClick,
  onGridChange,
  onToggleLetters,
  onInsertText
}: DrawingAreaProps) => {
  const [showLetters, setShowLetters] = useState(propShowLetters || false);

  // --- Caixa de texto inline ---
  const [textBox, setTextBox] = useState<TextBoxState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlurOnceRef = useRef(false); // evita commit duplo quando clicamos para abrir outra caixa

  // foco automático quando a caixa aparece
  useEffect(() => {
    if (textBox && inputRef.current) {
      const el = inputRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [textBox]);

  const currentResolution = useMemo(
    () => ({
      width: grid.width,
      height: grid.height,
      label: grid.width === 34 && grid.height === 28 ? '34x28 (padrão)' : 'Personalizado',
    }),
    [grid.width, grid.height]
  );

  const handleZoomReset = () => onZoomChange(1);

  // Seleção com mouse (como já estava)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool !== 'select') return;
    const canvas = e.currentTarget as HTMLElement;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    selection?.startSelection?.(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectedTool !== 'select') return;
    const canvas = e.currentTarget as HTMLElement;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    selection?.updateSelection?.(x, y);
  };

  const handleMouseUp = (_e: React.MouseEvent) => {
    if (selectedTool !== 'select') return;
    selection?.finishSelection?.();
  };

  const handleMouseLeave = (_e: React.MouseEvent) => {
    if (selectedTool !== 'select') return;
    selection?.finishSelection?.();
  };

  // Helpers da caixa
  const openTextBoxAt = (cellX: number, cellY: number) => {
    const left = cellX * CELL_WIDTH * zoom;
    const top = cellY * CELL_HEIGHT * zoom;
    setTextBox({ cellX, cellY, left, top, value: '' });
  };

  const commitCurrentBox = () => {
    if (!textBox) return;
    const value = textBox.value.trim();
    if (value && onInsertText) {
      onInsertText(textBox.cellX, textBox.cellY, value);
    }
    setTextBox(null);
  };

  // Intercepta clique no grid no modo "texto"
  const onGridCellClick = (x: number, y: number, event?: React.MouseEvent) => {
    if (selectedTool === 'text') {
      event?.preventDefault();
      event?.stopPropagation();

      // Se já há uma caixa:
      if (textBox) {
        // Clique na MESMA célula: apenas foca de novo
        if (textBox.cellX === x && textBox.cellY === y) {
          inputRef.current?.focus();
          return;
        }
        // Clique em OUTRA célula: confirma a atual e abre a nova na mesma interação
        skipBlurOnceRef.current = true; // o blur da input vai acontecer, mas ignoramos 1x
        commitCurrentBox();
        // abrir a nova na próxima “tick” evita conflito de focus/blur
        setTimeout(() => openTextBoxAt(x, y), 0);
        return;
      }

      // Não havia caixa: abre normalmente
      openTextBoxAt(x, y);
      return;
    }

    // Outras ferramentas seguem o fluxo normal
    onCellClick(x, y, event);
  };

  // Handlers da input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitCurrentBox();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setTextBox(null);
    }
  };

  const handleInputBlur = () => {
    // Se acabamos de clicar no grid para abrir outra caixa, ignorar este blur
    if (skipBlurOnceRef.current) {
      skipBlurOnceRef.current = false;
      return;
    }
    commitCurrentBox();
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Barra de controles */}
      <div className="border-b border-border p-3 bg-card">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ZoomControls
              zoom={zoom}
              onZoomChange={onZoomChange}
              onZoomReset={handleZoomReset}
            />

            <ResolutionControls
              resolution={currentResolution}
              onResolutionChange={onResolutionChange}
            />

            <CopyLetters grid={grid} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleLetters || (() => setShowLetters(!showLetters))}
              className="flex items-center gap-2 px-3 py-1 border border-border 
                       bg-background hover:bg-muted transition-colors text-sm"
              title={(propShowLetters ?? showLetters) ? 'Mostrar pontos' : 'Mostrar letras'}
            >
              {(propShowLetters ?? showLetters) ? <EyeOff size={16} /> : <Eye size={16} />}
              {(propShowLetters ?? showLetters) ? 'Pontos' : 'Letras'}
            </button>
          </div>
        </div>
      </div>

      {/* Área de desenho */}
      <div className="flex-1 overflow-auto p-4 bg-drawing-area">
        <div className="inline-block relative">
          <BrailleGrid
            grid={grid}
            zoom={zoom}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onCellClick={onGridCellClick}   // <- intercepta para o modo texto
            showLetters={propShowLetters ?? showLetters}
            selection={selection}
            selectedTool={selectedTool}
            onGridChange={onGridChange}
          />

          {/* Caixa de texto inline */}
          {textBox && selectedTool === 'text' && (
            <div
              className="absolute"
              style={{
                left: textBox.left,
                top: textBox.top,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                pointerEvents: 'auto',
                zIndex: 20,
              }}
              onMouseDown={(e) => e.stopPropagation()} // não deixa o clique “furar” pro canvas
            >
              <input
                ref={inputRef}
                type="text"
                value={textBox.value}
                onChange={(e) =>
                  setTextBox((prev) => (prev ? { ...prev, value: e.target.value } : prev))
                }
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                className="h-[28px] w-[200px] rounded-md border border-border bg-white px-2 text-sm shadow
                           focus:outline-none focus:ring-2 focus:ring-[#F0C930]"
                placeholder="Digite o texto…"
                style={{ height: CELL_HEIGHT - 2 }}
              />
            </div>
          )}

          {/* (Opcional) Overlay antigo — manter vazio para compatibilidade */}
          {textOverlay?.textElements?.map((element: any) => (
            <div key={element.id} />
          ))}
        </div>
      </div>

      {/* Status bar fixa */}
      <div className="fixed bottom-0 left-0 w-full border-t border-border px-3 py-2 bg-card z-50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>Grade: {grid.width}×{grid.height} células</div>
          <div>Zoom: {Math.round(zoom * 100)}%</div>
          <div>Modo: {(propShowLetters ?? showLetters) ? 'Letras' : 'Pontos'}</div>
          <div>
            Ferramenta: {
              selectedTool === 'pencil' ? 'Lápis (desenhar)' :
              selectedTool === 'text' ? 'Texto' :
              selectedTool === 'select' ? 'Selecionar' :
              selectedTool
            }
          </div>
        </div>
      </div>
    </div>
  );
};
