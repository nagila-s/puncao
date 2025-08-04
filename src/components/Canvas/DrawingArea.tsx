
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
  
  // Estado para controlar drag & drop
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);

  // Sincronizar estado de drag com o hook de seleção
  useEffect(() => {
    console.log('DrawingArea: useEffect - selection.isDragging:', selection?.isDragging, 'isDraggingSelection:', isDraggingSelection);
    
    if (!selection?.isDragging && isDraggingSelection) {
      console.log('DrawingArea: Syncing drag state - resetting local drag state');
      setIsDraggingSelection(false);
      setDragStartPos(null);
    }
  }, [selection?.isDragging, isDraggingSelection]);

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
    console.log('DrawingArea: handleSelectMouseDown called with tool:', selectedTool);
    
    if (selectedTool !== 'select') {
      console.log('DrawingArea: Tool is not select, current tool:', selectedTool);
      console.log('DrawingArea: Please click the "Select" button (mouse icon) in the sidebar first');
      return;
    }
    
    const canvas = brailleGridRef.current?.canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    const selectedCellsSize = selection.selectedCells.size;
    
    console.log('DrawingArea: handleSelectMouseDown', { 
      x, y, selectedTool, 
      selectedCellsSize
    });
    
    // Verificar se há células selecionadas para iniciar drag
    if (selectedCellsSize > 0) {
      const { cellX, cellY } = getCellCoordinates(x, y);
      const cellKey = `${cellX},${cellY}`;
      
      console.log('DrawingArea: Checking if click is on selected cell:', { 
        cellX, cellY, cellKey, 
        isSelected: selection.selectedCells.has(cellKey),
        selectedCells: Array.from(selection.selectedCells)
      });
      
      if (selection.selectedCells.has(cellKey)) {
        // Iniciar drag & drop
        console.log('DrawingArea: Starting drag & drop');
        setIsDraggingSelection(true);
        setDragStartPos({ x, y });
        selection.startDrag(x, y);
        return;
      } else {
        console.log('DrawingArea: Click not on selected cell, starting normal selection');
      }
    }
    
    // Caso contrário, iniciar seleção normal
    console.log('DrawingArea: Starting normal selection');
    setIsSelecting(true);
    setSelectionStart({ x, y });
    setLastClickTime(Date.now());
    setLastClickPos({ x, y });
    
    // Iniciar seleção
    selection?.startSelection?.(x, y);
  };

  const handleSelectMouseMove = (e: React.MouseEvent) => {
    if (selectedTool !== 'select') return;
    
    const canvas = brailleGridRef.current?.canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    const selectedCellsSize = selection.selectedCells.size;
    
    console.log('DrawingArea: handleSelectMouseMove', { 
      x, y, isSelecting, isDraggingSelection,
      selectedCellsSize
    });
    
    // Se estiver fazendo drag & drop (só se há seleção válida)
    if ((isDraggingSelection || selection?.isDragging) && selectedCellsSize > 0) {
      console.log('DrawingArea: Updating drag');
      selection.updateDrag(x, y);
      return;
    }
    
    // Se estiver fazendo seleção
    if (isSelecting) {
      console.log('DrawingArea: Updating selection');
      selection?.updateSelection?.(x, y);
    }
  };

  const handleSelectMouseUp = (e: React.MouseEvent) => {
    if (selectedTool !== 'select') return;
    
    const canvas = brailleGridRef.current?.canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    const selectedCellsSize = selection.selectedCells.size;
    
    console.log('DrawingArea: handleSelectMouseUp', { 
      x, y, isSelecting, isDraggingSelection,
      selectedCellsSize,
      selectionIsDragging: selection?.isDragging
    });
    
    // Se estiver fazendo drag & drop (só se há seleção válida)
    if ((isDraggingSelection || selection?.isDragging) && selectedCellsSize > 0) {
      console.log('DrawingArea: Finishing drag - calling selection.finishDrag()');
      selection.finishDrag();
      console.log('DrawingArea: After finishDrag - setting local state to false');
      setIsDraggingSelection(false);
      setDragStartPos(null);
      return;
    }
    
    // Se estava tentando fazer drag mas não havia seleção, cancelar
    if (isDraggingSelection) {
      console.log('DrawingArea: Cancelling invalid drag');
      selection?.cancelDrag?.();
      setIsDraggingSelection(false);
      setDragStartPos(null);
      return;
    }
    
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
    
    const selectedCellsSize = selection.selectedCells.size;
    
    console.log('DrawingArea: handleSelectMouseLeave', {
      isDraggingSelection,
      selectedCellsSize
    });
    
    // Se estiver fazendo drag & drop (só se há seleção válida)
    if ((isDraggingSelection || selection?.isDragging) && selectedCellsSize > 0) {
      console.log('DrawingArea: Cancelling drag on mouse leave');
      selection.cancelDrag();
      setIsDraggingSelection(false);
      setDragStartPos(null);
      return;
    }
    
    // Se estava tentando fazer drag mas não havia seleção, cancelar
    if (isDraggingSelection) {
      console.log('DrawingArea: Cancelling invalid drag on mouse leave');
      selection?.cancelDrag?.();
      setIsDraggingSelection(false);
      setDragStartPos(null);
      return;
    }
    
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
            onMouseDown={selectedTool === 'select' ? handleSelectMouseDown : handleMouseDown}
            onMouseMove={selectedTool === 'select' ? handleSelectMouseMove : handleMouseMove}
            onMouseUp={selectedTool === 'select' ? handleSelectMouseUp : handleMouseUp}
            onMouseLeave={selectedTool === 'select' ? handleSelectMouseLeave : handleMouseLeave}
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
