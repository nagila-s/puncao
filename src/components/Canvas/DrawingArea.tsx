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
  hasClipboard?: boolean;
  onZoomChange: (zoom: number) => void;
  onResolutionChange: (resolution: { width: number; height: number; label: string }) => void;
  onCellClick: (x: number, y: number, event?: React.MouseEvent) => void;
  onGridChange: (grid: BrailleGridType) => void;
  onToggleLetters?: () => void;
  onInsertText?: (cellX: number, cellY: number, text: string) => void;
  onSelectionChange: (selection: any) => void;
}

const CELL_WIDTH = 20;
const CELL_HEIGHT = 30;

type TextBoxState = {
  cellX: number;
  cellY: number;
  left: number;
  top: number;
  value: string;
};

export const DrawingArea = ({
  grid,
  zoom,
  selectedTool,
  showLetters: propShowLetters,
  selection,
  textOverlay,
  hasClipboard = false,
  onZoomChange,
  onResolutionChange,
  onCellClick,
  onGridChange,
  onToggleLetters,
  onInsertText,
  onSelectionChange
}: DrawingAreaProps) => {
  const [showLetters, setShowLetters] = useState(propShowLetters || false);
  const [textBox, setTextBox] = useState<TextBoxState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlurOnceRef = useRef(false);

  useEffect(() => {
    if (textBox && inputRef.current) {
      const el = inputRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [textBox]);

  const currentResolution = useMemo(() => ({
    width: grid.width,
    height: grid.height,
    label: grid.width === 34 && grid.height === 28 ? '34x28 (padrão)' : 'Personalizado'
  }), [grid.width, grid.height]);

  const handleZoomReset = () => onZoomChange(1);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool !== 'select') return;
    if (!selection?.startSelection) return;
    
    console.log('🟢 handleMouseDown (select)', e.clientX, e.clientY);

    const canvas = e.currentTarget as HTMLElement;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    selection.startSelection(x, y);
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectedTool !== 'select') return;
    if (!selection?.updateSelection) return;
    if (!selection?.isSelecting) return;
    
    const canvas = e.currentTarget as HTMLElement;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    selection.updateSelection(x, y);
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (selectedTool !== 'select') return;
    console.log('🔴 handleMouseUp (DrawingArea) — finalizando seleção');
    selection?.finishSelection?.();
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (selectedTool !== 'select') return;
    selection?.finishSelection?.();
  };

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

  const onGridCellClick = (x: number, y: number, event?: React.MouseEvent) => {
    if (selectedTool === 'text') {
      event?.preventDefault();
      event?.stopPropagation();

      if (textBox) {
        if (textBox.cellX === x && textBox.cellY === y) {
          inputRef.current?.focus();
          return;
        }
        skipBlurOnceRef.current = true;
        commitCurrentBox();
        setTimeout(() => openTextBoxAt(x, y), 0);
        return;
      }
      openTextBoxAt(x, y);
      return;
    }

    onCellClick(x, y, event);
  };

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
    if (skipBlurOnceRef.current) {
      skipBlurOnceRef.current = false;
      return;
    }
    commitCurrentBox();
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="border-b border-border p-3 bg-card">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ZoomControls zoom={zoom} onZoomChange={onZoomChange} onZoomReset={handleZoomReset} />
            <ResolutionControls resolution={currentResolution} onResolutionChange={onResolutionChange} />
            <CopyLetters grid={grid} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleLetters || (() => setShowLetters(!showLetters))}
              className="flex items-center gap-2 px-3 py-1 border border-border bg-background hover:bg-muted transition-colors text-sm"
              title={(propShowLetters ?? showLetters) ? 'Mostrar pontos' : 'Mostrar letras'}
            >
              {(propShowLetters ?? showLetters) ? <EyeOff size={16} /> : <Eye size={16} />}
              {(propShowLetters ?? showLetters) ? 'Pontos' : 'Letras'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-drawing-area">
        <div className="inline-block relative">
          <BrailleGrid
            grid={grid}
            zoom={zoom}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onCellClick={onGridCellClick}
            showLetters={propShowLetters ?? showLetters}
            selection={selection}
            selectedTool={selectedTool}
            onGridChange={onGridChange}
            hasClipboard={hasClipboard}
            onSelectionChange={onSelectionChange}
          />

          {textBox && selectedTool === 'text' && (
            <div
              className="absolute"
              style={{
                left: textBox.left,
                top: textBox.top,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                pointerEvents: 'auto',
                zIndex: 20
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <input
                ref={inputRef}
                type="text"
                value={textBox.value}
                onChange={(e) => setTextBox((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                className="h-[28px] w-[200px] rounded-md border border-border bg-white px-2 text-sm shadow focus:outline-none focus:ring-2 focus:ring-[#F0C930]"
                placeholder="Digite o texto…"
                style={{ height: CELL_HEIGHT - 2 }}
              />
            </div>
          )}

          {textOverlay?.textElements?.map((element: any) => (
            <div key={element.id} />
          ))}
        </div>
      </div>

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