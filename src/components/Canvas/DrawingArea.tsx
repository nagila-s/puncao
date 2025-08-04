
import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { BrailleGrid, BrailleGridRef } from './BrailleGrid';
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
  const brailleGridRef = useRef<BrailleGridRef>(null);
  
  // Estado para controlar seleção
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickPos, setLastClickPos] = useState<{ x: number; y: number } | null>(null);

  const currentResolution = {
    width: grid.width,
    height: grid.height,
    label: grid.width === 28 && grid.height === 34 ? '28x34 (padrão)' : 'Personalizado'
  };

  const handleZoomReset = () => {
    onZoomChange(1);
  };

  // Função para obter coordenadas da célula a partir das coordenadas do mouse
  const getCellCoordinates = (mouseX: number, mouseY: number) => {
    const cellX = Math.floor(mouseX / CELL_WIDTH);
    const cellY = Math.floor(mouseY / CELL_HEIGHT);
    return { cellX, cellY };
  };

  // Função para verificar se é um clique simples (não arrasto)
  const isSimpleClick = (startPos: { x: number; y: number }, endPos: { x: number; y: number }, timeDiff: number) => {
    const distance = Math.sqrt(
      Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2)
    );
    return distance < 5 && timeDiff < 300; // 5px de tolerância e 300ms
  };

  // Handlers de mouse para a ferramenta 'select'
  const handleSelectMouseDown = (e: React.MouseEvent) => {
    if (selectedTool !== 'select') return;
    
    const canvas = brailleGridRef.current?.canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    console.log('DrawingArea: handleSelectMouseDown', { x, y, selectedTool });
    
    setIsSelecting(true);
    setSelectionStart({ x, y });
    setLastClickTime(Date.now());
    setLastClickPos({ x, y });
    
    // Iniciar seleção
    selection?.startSelection?.(x, y);
  };

  const handleSelectMouseMove = (e: React.MouseEvent) => {
    if (selectedTool !== 'select' || !isSelecting) return;
    
    const canvas = brailleGridRef.current?.canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    console.log('DrawingArea: handleSelectMouseMove', { x, y, isSelecting });
    
    // Atualizar seleção
    selection?.updateSelection?.(x, y);
  };

  const handleSelectMouseUp = (e: React.MouseEvent) => {
    if (selectedTool !== 'select') return;
    
    const canvas = brailleGridRef.current?.canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    console.log('DrawingArea: handleSelectMouseUp', { x, y, isSelecting });
    
    // Verificar se é um clique simples
    if (isSelecting && selectionStart && lastClickPos && lastClickTime) {
      const timeDiff = Date.now() - lastClickTime;
      const isClick = isSimpleClick(selectionStart, { x, y }, timeDiff);
      
      console.log('DrawingArea: Checking if simple click', { 
        isClick, 
        timeDiff, 
        startPos: selectionStart, 
        endPos: { x, y } 
      });
      
      if (isClick) {
        // É um clique simples - selecionar célula individual
        const { cellX, cellY } = getCellCoordinates(x, y);
        console.log('DrawingArea: Simple click detected, selecting cell', { cellX, cellY });
        
        if (cellX >= 0 && cellX < grid.width && cellY >= 0 && cellY < grid.height) {
          onCellClick(cellX, cellY, e);
        }
      } else {
        // É um arrasto - finalizar seleção retangular
        console.log('DrawingArea: Drag detected, finishing selection');
        selection?.finishSelection?.();
      }
    }
    
    setIsSelecting(false);
    setSelectionStart(null);
  };

  const handleSelectMouseLeave = (e: React.MouseEvent) => {
    if (selectedTool !== 'select') return;
    
    console.log('DrawingArea: handleSelectMouseLeave');
    setIsSelecting(false);
    setSelectionStart(null);
    selection?.finishSelection?.();
  };

  // Handlers de mouse para outras ferramentas (passados para BrailleGrid)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Este handler não é mais usado para 'select'
    if (selectedTool === 'select') return;
    
    const canvas = e.currentTarget as HTMLElement;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    selection?.startSelection?.(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectedTool === 'select') return;
    
    const canvas = e.currentTarget as HTMLElement;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    selection?.updateSelection?.(x, y);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (selectedTool === 'select') return;
    
    selection?.finishSelection?.();
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (selectedTool === 'select') return;
    
    selection?.finishSelection?.();
  };

  // Adicionar/remover event listeners do canvas para a ferramenta 'select'
  useEffect(() => {
    const canvas = brailleGridRef.current?.canvasRef.current;
    if (!canvas || selectedTool !== 'select') return;

    console.log('DrawingArea: Adding select event listeners to canvas');

    const handleMouseDown = (e: MouseEvent) => handleSelectMouseDown(e as any);
    const handleMouseMove = (e: MouseEvent) => handleSelectMouseMove(e as any);
    const handleMouseUp = (e: MouseEvent) => handleSelectMouseUp(e as any);
    const handleMouseLeave = (e: MouseEvent) => handleSelectMouseLeave(e as any);

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      console.log('DrawingArea: Removing select event listeners from canvas');
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [selectedTool, isSelecting, selectionStart, lastClickTime, lastClickPos, zoom, grid.width, grid.height]);

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
            ref={brailleGridRef}
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
      {/*</div><div className="border-t border-border px-3 py-2 bg-card">*/}
      {/*Added different div to fix footer */}
      <div className="fixed bottom-0 left-0 w-full border-t border-border px-3 py-2 bg-card z-50">
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
