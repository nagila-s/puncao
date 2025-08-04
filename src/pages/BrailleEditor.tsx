
import { useState, useCallback, useEffect } from 'react';
import { AppSidebar } from '@/components/Sidebar/AppSidebar';
import { DrawingArea } from '@/components/Canvas/DrawingArea';
import { CellEditor } from '@/components/CellEditor/CellEditor';
import { HelpModal } from '@/components/HelpModal/HelpModal';
import { Tool, BrailleGrid, BrailleCell } from '@/types/braille';
import { useSelection } from '@/hooks/useSelection';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTextInsertion } from '@/hooks/useTextInsertion';
import { useTextOverlay } from '@/hooks/useTextOverlay';
import { useShapes } from '@/hooks/useShapes';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const createEmptyGrid = (characters: number, lines: number): BrailleGrid => {
  const cells: BrailleCell[][] = [];
  for (let y = 0; y < lines; y++) {
    cells[y] = [];
    for (let x = 0; x < characters; x++) {
      cells[y][x] = {
        x,
        y,
        dots: [],
        letter: ' ',
        isActive: false
      };
    }
  }
  return { width: characters, height: lines, cells };
};

export const BrailleEditor = () => {
  const [selectedTool, setSelectedTool] = useState<Tool>('pencil');
  const [zoom, setZoom] = useState(1);
  const [grid, setGrid] = useState<BrailleGrid>(() => createEmptyGrid(34, 28)); // 34 caracteres, 28 linhas
  const [history, setHistory] = useState<BrailleGrid[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const [showLetters, setShowLetters] = useState(false);
  const [editingCell, setEditingCell] = useState<BrailleCell | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const { toast } = useToast();

  // Gerenciar histórico (undo/redo)
  const addToHistory = useCallback((newGrid: BrailleGrid) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newGrid)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setGrid(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setGrid(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  }, [history, historyIndex]);

  const handleToolChange = useCallback((tool: Tool) => {
    setSelectedTool(tool);
  }, []);

  const handleResolutionChange = useCallback((resolution: { width: number; height: number; label: string }) => {
    // width = caracteres, height = linhas
    const newGrid = createEmptyGrid(resolution.width, resolution.height);
    setGrid(newGrid);
    addToHistory(newGrid);
  }, [addToHistory]);

  const handleGridChange = useCallback((newGrid: BrailleGrid) => {
    setGrid(newGrid);
    addToHistory(newGrid);
  }, [addToHistory]);

  const handleToggleHelp = useCallback(() => {
    setShowHelp(!showHelp);
  }, [showHelp]);

  const handleToggleView = useCallback(() => {
    setShowLetters(!showLetters);
  }, [showLetters]);

  const handleCellDoubleClick = useCallback((x: number, y: number) => {
    const cell = grid.cells[y][x];
    setEditingCell(cell);
  }, [grid]);

  // Selection and clipboard functionality  
  const selection = useSelection(grid, handleGridChange);
  const textInsertion = useTextInsertion(grid, handleGridChange);
  const textOverlay = useTextOverlay();
  const shapes = useShapes(grid, handleGridChange);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Detectar tecla Shift
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        console.log('Shift pressed');
        setIsShiftPressed(true);
        // Don't prevent default for Shift alone to allow other shortcuts to work
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        console.log('Shift released');
        setIsShiftPressed(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleCellClick = useCallback((x: number, y: number, event?: React.MouseEvent) => {
    console.log('handleCellClick called:', x, y, 'isShiftPressed:', isShiftPressed, 'selectedTool:', selectedTool);
    
    const now = Date.now();
    const isDoubleClick = now - lastClickTime < 300;
    setLastClickTime(now);

    if (isDoubleClick) {
      handleCellDoubleClick(x, y);
      return;
    }

    // Se Shift pressionado com lápis, usar ferramenta de linha
    if (isShiftPressed && selectedTool === 'pencil') {
      console.log('Shift + pencil detected, starting line mode');
      // Temporariamente mudar para ferramenta de linha
      setSelectedTool('line');
      return;
    }

    if (selectedTool === 'select') {
      const isCtrlPressed = event?.ctrlKey || event?.metaKey;
      console.log('BrailleEditor: Selecting cell with Ctrl pressed:', isCtrlPressed);
      selection.selectCell(x, y, isCtrlPressed);
      
      // Update grid to show active cells
      setGrid(prevGrid => {
        const newGrid = JSON.parse(JSON.stringify(prevGrid));
        
        // Clear all active states
        for (let row of newGrid.cells) {
          for (let cell of row) {
            cell.isActive = false;
          }
        }
        
        // Set active cells based on selection
        console.log('BrailleEditor: Setting active cells based on selection:', selection.selectedCells.size);
        selection.selectedCells.forEach(cellKey => {
          const [cellX, cellY] = cellKey.split(',').map(Number);
          if (cellX >= 0 && cellX < grid.width && cellY >= 0 && cellY < grid.height) {
            newGrid.cells[cellY][cellX].isActive = true;
            console.log('BrailleEditor: Set cell as active:', { cellX, cellY });
          }
        });
        
        return newGrid;
      });
    } else if (selectedTool === 'eraser') {
      setGrid(prevGrid => {
        const newGrid = JSON.parse(JSON.stringify(prevGrid));
        const cell = newGrid.cells[y][x];
        
        cell.dots = [];
        cell.letter = ' ';
        cell.origin = 'manual';
        
        return newGrid;
      });
    } else if (selectedTool === 'text') {
      const text = prompt('Digite o texto:');
      if (text && text.trim()) {
        // Converter coordenadas de célula para pixel
        const pixelX = x * 20; // CELL_WIDTH
        const pixelY = y * 30; // CELL_HEIGHT
        textOverlay.addTextElement(text.trim(), pixelX, pixelY);
      }
    } else if (selectedTool === 'fill') {
      // Preencher área com flood fill
      console.log('Fill tool activated at cell:', x, y);
      const newGrid = JSON.parse(JSON.stringify(grid));
      shapes.floodFill(newGrid, x, y);
      console.log('Calling handleGridChange with filled grid');
      handleGridChange(newGrid);
    }
    // Note: pencil tool agora é gerenciado pelo hook useDrawing
  }, [selectedTool, lastClickTime, handleCellDoubleClick, selection, grid, textOverlay, shapes, handleGridChange, isShiftPressed]);

  const handleCellEditUpdate = useCallback((updatedCell: BrailleCell) => {
    const newGrid = JSON.parse(JSON.stringify(grid));
    newGrid.cells[updatedCell.y][updatedCell.x] = updatedCell;
    handleGridChange(newGrid);
    setEditingCell(null);
  }, [grid, handleGridChange]);

  const handleMoveSelection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (selection.selectedCells.size !== 1) return;
    
    const cellKey = Array.from(selection.selectedCells)[0];
    const [currentX, currentY] = cellKey.split(',').map(Number);
    
    let newX = currentX;
    let newY = currentY;
    
    switch (direction) {
      case 'up': newY = Math.max(0, currentY - 1); break;
      case 'down': newY = Math.min(grid.height - 1, currentY + 1); break;
      case 'left': newX = Math.max(0, currentX - 1); break;
      case 'right': newX = Math.min(grid.width - 1, currentX + 1); break;
    }
    
    if (newX !== currentX || newY !== currentY) {
      selection.selectCell(newX, newY);
    }
  }, [selection, grid]);

  const handleEnterEdit = useCallback(() => {
    if (selection.selectedCells.size === 1) {
      const cellKey = Array.from(selection.selectedCells)[0];
      const [x, y] = cellKey.split(',').map(Number);
      handleCellDoubleClick(x, y);
    }
  }, [selection.selectedCells, handleCellDoubleClick]);

  const handlePasteAtCursor = useCallback(() => {
    console.log('handlePasteAtCursor called:', {
      selectedCellsSize: selection.selectedCells.size,
      hasClipboard: selection.hasClipboard,
      selectedCells: Array.from(selection.selectedCells)
    });
    
    if (selection.selectedCells.size === 1) {
      const cellKey = Array.from(selection.selectedCells)[0];
      const [x, y] = cellKey.split(',').map(Number);
      console.log('Pasting at position:', { x, y });
      selection.pasteClipboard(x, y);
    } else {
      console.log('Cannot paste: no single cell selected');
    }
  }, [selection]);

  // Função para copiar letras da grade
  const handleCopyLetters = useCallback(async () => {
    try {
      console.log('BrailleEditor: Starting copy letters operation');
      const lines: string[] = [];
      
      for (let y = 0; y < grid.height; y++) {
        let line = '';
        for (let x = 0; x < grid.width; x++) {
          const cell = grid.cells[y][x];
          // Se a célula tem uma letra válida, usa ela, senão usa espaço
          const letter = cell.letter && cell.letter !== ' ' ? cell.letter : ' ';
          line += letter;
        }
        lines.push(line);
      }
      
      const textContent = lines.join('\n');
      console.log('BrailleEditor: Extracted text content length:', textContent.length);
      
      // Verificar se a API de clipboard está disponível
      if (!navigator.clipboard) {
        console.error('BrailleEditor: Clipboard API not available');
        throw new Error('Clipboard API not available');
      }
      
      await navigator.clipboard.writeText(textContent);
      console.log('BrailleEditor: Successfully copied to clipboard');
      
      toast({
        title: "Figura copiada",
        description: "Conteúdo em letras copiado para a área de transferência",
        duration: 2000,
      });
    } catch (error) {
      console.error('BrailleEditor: Error copying to clipboard:', error);
      toast({
        title: "Erro",
        description: "Não foi possível copiar para a área de transferência",
        variant: "destructive",
        duration: 2000,
      });
    }
  }, [grid, toast]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onCopy: selection.copySelectedCells,
    onPaste: handlePasteAtCursor,
    onCut: selection.cutSelectedCells,
    onDelete: () => {
      if (textOverlay.selectedElementId) {
        textOverlay.deleteSelected();
      } else {
        selection.deleteSelectedCells();
      }
    },
    onToggleView: handleToggleView,
    onMoveSelection: handleMoveSelection,
    onEnterEdit: handleEnterEdit,
    onCopyLetters: handleCopyLetters,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    hasSelection: selection.hasSelection,
    hasClipboard: selection.hasClipboard
  });

  // Additional keyboard shortcut for debug panel (Ctrl/Cmd + D)
  useEffect(() => {
    const handleDebugKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        setShowDebug(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleDebugKey);
    return () => document.removeEventListener('keydown', handleDebugKey);
  }, []);

  // Debug panel for troubleshooting keyboard shortcuts
  const debugInfo = {
    hasSelection: selection.hasSelection,
    selectedCellsCount: selection.selectedCells.size,
    hasClipboard: selection.hasClipboard,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    isShiftPressed,
    selectedTool
  };

  console.log('Debug info:', debugInfo);

return (
  <SidebarProvider defaultOpen={true}>
    <div className="min-h-screen w-full flex flex-col bg-background">
      {/* Header com logo e título */}
      <div className="h-12 bg-[#F0C930] border-b flex items-center px-4 flex-shrink-0">
        {/*<SidebarTrigger className="mr-4" />*/}
        <img
          src="/logo-puncao.png"
          alt="Logo Punção"
          className="h-7 w-auto mr-2"
        />
        <h1 className="titulo-principal text-foreground">Punção</h1>
      </div>

        {/* Layout principal */}
        <div className="flex w-full flex-1 min-h-0">
          <AppSidebar
            selectedTool={selectedTool}
            onToolChange={handleToolChange}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onToggleHelp={handleToggleHelp}
            onCopy={selection.copySelectedCells}
            onCut={selection.cutSelectedCells}
            onPaste={handlePasteAtCursor}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            hasSelection={selection.hasSelection}
            hasClipboard={selection.hasClipboard}
          />
          
          <main className="flex-1">
            <DrawingArea
              grid={grid}
              zoom={zoom}
              selectedTool={selectedTool}
              showLetters={showLetters}
              selection={selection}
              textOverlay={textOverlay}
              onZoomChange={setZoom}
              onResolutionChange={handleResolutionChange}
              onCellClick={handleCellClick}
              onGridChange={handleGridChange}
              onToggleLetters={handleToggleView}
            />
          </main>
        </div>

        {/* Modals */}
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        
        {editingCell && (
          <CellEditor
            cell={editingCell}
            onUpdate={handleCellEditUpdate}
            onClose={() => setEditingCell(null)}
          />
        )}

        {/* Debug Panel - Remove this after fixing the issue */}
        {showDebug && (
          <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50">
            <div className="mb-2 font-bold">Debug Panel (Ctrl+D to toggle)</div>
            <div>Selection: {selection.hasSelection ? 'Yes' : 'No'}</div>
            <div>Selected: {selection.selectedCells.size}</div>
            <div>Clipboard: {selection.hasClipboard ? 'Yes' : 'No'}</div>
            <div>Can Undo: {historyIndex > 0 ? 'Yes' : 'No'}</div>
            <div>Can Redo: {historyIndex < history.length - 1 ? 'Yes' : 'No'}</div>
            <div>Shift: {isShiftPressed ? 'Pressed' : 'No'}</div>
            <div>Tool: {selectedTool}</div>
            <div className="mt-4 space-y-1">
              <button 
                onClick={handleUndo} 
                disabled={historyIndex <= 0}
                className="block w-full px-2 py-1 bg-blue-600 disabled:bg-gray-600 rounded text-xs"
              >
                Test Undo
              </button>
              <button 
                onClick={handleRedo} 
                disabled={historyIndex >= history.length - 1}
                className="block w-full px-2 py-1 bg-green-600 disabled:bg-gray-600 rounded text-xs"
              >
                Test Redo
              </button>
              <button 
                onClick={selection.copySelectedCells} 
                disabled={!selection.hasSelection}
                className="block w-full px-2 py-1 bg-yellow-600 disabled:bg-gray-600 rounded text-xs"
              >
                Test Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </SidebarProvider>
  );
};
