
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { BrailleGrid } from './BrailleGrid';
import { ZoomControls } from '../Controls/ZoomControls';
import { ResolutionControls } from '../Controls/ResolutionControls';
import { CopyLetters } from '../Controls/CopyLetters';
import { TextElement } from '../TextOverlay/TextElement';
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
}

const CELL_WIDTH = 20;
const CELL_HEIGHT = 30;

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
  onToggleLetters
}: DrawingAreaProps) => {
  const [showLetters, setShowLetters] = useState(propShowLetters || false);

  const currentResolution = {
    width: grid.width,
    height: grid.height,
    label: grid.width === 28 && grid.height === 34 ? '28x34 (padrão)' : 'Personalizado'
  };

  const handleZoomReset = () => {
    onZoomChange(1);
  };

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

  const handleMouseUp = (e: React.MouseEvent) => {
    if (selectedTool !== 'select') return;
    
    selection?.finishSelection?.();
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (selectedTool !== 'select') return;
    
    selection?.finishSelection?.();
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
            onCellClick={onCellClick}
            showLetters={propShowLetters ?? showLetters}
            selection={selection}
            selectedTool={selectedTool}
            onGridChange={onGridChange}
          />
          
          {/* Text overlay elements */}
          {textOverlay?.textElements.map((element: any) => (
            <TextElement
              key={element.id}
              id={element.id}
              text={element.text}
              x={element.x}
              y={element.y}
              zoom={zoom}
              onUpdate={textOverlay.updateTextElement}
              onDelete={textOverlay.deleteTextElement}
              isSelected={textOverlay.selectedElementId === element.id}
              onSelect={textOverlay.selectElement}
            />
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="border-t border-border px-3 py-2 bg-card">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Grade: {grid.width}×{grid.height} células
          </div>
          <div>
            Zoom: {Math.round(zoom * 100)}%
          </div>
          <div>
            Modo: {(propShowLetters ?? showLetters) ? 'Letras' : 'Pontos'}
          </div>
          <div>
            Ferramenta: {selectedTool === 'pencil' ? 'Lápis (desenhar)' : 'Selecionar'}
          </div>
        </div>
      </div>
    </div>
  );
};
