// src/pages/BrailleEditor.tsx
import { useState, useCallback, useEffect } from 'react';
import { AppSidebar } from '@/components/Sidebar/AppSidebar';
import { DrawingArea } from '@/components/Canvas/DrawingArea';
import { CellEditor } from '@/components/CellEditor/CellEditor';
import { HelpModal } from '@/components/HelpModal/HelpModal';
import { Tool, BrailleGrid, BrailleCell } from '@/types/braille';
import { useSelection } from '@/hooks/useSelection';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTextOverlay } from '@/hooks/useTextOverlay';
import { useShapes } from '@/hooks/useShapes';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider } from "@/components/ui/sidebar";
import { writeTextToGrid } from '@/lib/textPlacement';

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

  // Selection / overlay / shapes
  const selection = useSelection(grid, handleGridChange);
  const textOverlay = useTextOverlay();
  const shapes = useShapes(grid, handleGridChange);

  const handleToolChange = useCallback((tool: Tool) => {
    if (selection.isSelecting) {
      console.log("🚫 tentativa de trocar ferramenta durante seleção");
      return;
    }
    console.log("🛠️ ferramenta alterada para:", tool);
    setSelectedTool(tool);
  }, [selection.isSelecting]);

  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Detectar tecla Shift
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
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

  // >>> Inserção de texto vinda da caixa inline no DrawingArea
  const handleInsertText = useCallback((cellX: number, cellY: number, text: string) => {
    const newGrid = writeTextToGrid(grid, cellX, cellY, text);
    setGrid(newGrid);
    addToHistory(newGrid);
  }, [grid, addToHistory]);

  // Clique em célula (usado para select/eraser/fill; MODO TEXTO é tratado no DrawingArea)
  const handleCellClick = useCallback((x: number, y: number, event?: React.MouseEvent) => {
    // No modo "text" quem controla é o DrawingArea (caixa inline).
    if (selectedTool === 'text') return;

    const now = Date.now();
    const isDoubleClick = now - lastClickTime < 300;
    setLastClickTime(now);

    // Duplo-clique abre editor de célula apenas quando NÃO é texto
    if (isDoubleClick) {
      handleCellDoubleClick(x, y);
      return;
    }

    if (selectedTool === 'select') {
      const isCtrlPressed = event?.ctrlKey || event?.metaKey;
      selection.selectCell(x, y, isCtrlPressed);

      // Atualiza visual de células ativas
      setGrid(prevGrid => {
        const newGrid = JSON.parse(JSON.stringify(prevGrid));
        for (const row of newGrid.cells) {
          for (const cell of row) {
            cell.isActive = false;
          }
        }
        selection.selectedCells.forEach(cellKey => {
          const [cellX, cellY] = cellKey.split(',').map(Number);
          if (cellX >= 0 && cellX < grid.width && cellY >= 0 && cellY < grid.height) {
            newGrid.cells[cellY][cellX].isActive = true;
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
    } else if (selectedTool === 'fill') {
      const newGrid = JSON.parse(JSON.stringify(grid));
      shapes.floodFill(newGrid, x, y);
      handleGridChange(newGrid);
    } else if (selectedTool === 'pencil' && isShiftPressed) {
      // Shift + pencil → modo linha (comportamento anterior)
      setSelectedTool('line');
    }
  }, [selectedTool, lastClickTime, handleCellDoubleClick, selection, grid, shapes, handleGridChange, isShiftPressed]);

  const handleCellEditUpdate = useCallback((updatedCell: BrailleCell) => {
    const newGrid = JSON.parse(JSON.stringify(grid));
    newGrid.cells[updatedCell.y][updatedCell.x] = updatedCell;
    handleGridChange(newGrid);
    setEditingCell(null);
  }, [grid, handleGridChange]);

  const handleMoveSelection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    // Se há seleção múltipla/retângulo, mover o conteúdo
    if (selection.hasSelection) {
      selection.moveSelection(direction);
      return;
    }

    // Cursor de seleção (uma única célula)
    if (selection.selectedCells.size !== 1) return;

    const cellKey = Array.from(selection.selectedCells)[0];
    const [currentX, currentY] = cellKey.split(',').map(Number);

    let newX = currentX;
    let newY = currentY;

    switch (direction) {
      case 'up':
        newY = Math.max(0, currentY - 1);
        break;
      case 'down':
        newY = Math.min(grid.height - 1, currentY + 1);
        break;
      case 'left':
        newX = Math.max(0, currentX - 1);
        break;
      case 'right':
        newX = Math.min(grid.width - 1, currentX + 1);
        break;
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
    if (selection.selectedCells.size === 1) {
      const cellKey = Array.from(selection.selectedCells)[0];
      const [x, y] = cellKey.split(',').map(Number);
      selection.pasteClipboard(x, y);
    }
  }, [selection]);

  // Copiar letras da grade
  const handleCopyLetters = useCallback(async () => {
    try {
      const lines: string[] = [];
      for (let y = 0; y < grid.height; y++) {
        let line = '';
        for (let x = 0; x < grid.width; x++) {
          const cell = grid.cells[y][x];
          const letter = cell.letter && cell.letter !== ' ' ? cell.letter : ' ';
          line += letter;
        }
        lines.push(line);
      }
      const textContent = lines.join('\n');
      await navigator.clipboard.writeText(textContent);
      toast({
        title: "Figura copiada",
        description: "Conteúdo em letras copiado para a área de transferência",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar para a área de transferência",
        variant: "destructive",
        duration: 2000,
      });
    }
  }, [grid, toast]);

  // Atalhos de teclado
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

  // Painel de debug (Ctrl/Cmd + D)
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
        {/* Header */}
        <div className="h-12 bg-[#F0C930] border-b flex items-center px-4 flex-shrink-0">
          <img src="/logo-puncao.png" alt="Logo Punção" className="h-7 w-auto mr-2" />
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
              onInsertText={handleInsertText}
              onSelectionChange={(selection) => {
                console.log('🔶 nova seleção:', selection);
              }}
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

        {/* Debug Panel (temporário) */}
        {showDebug && (
          <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50">
            <div className="mb-2 font-bold">Debug Panel (Ctrl+D para alternar)</div>
            <div>Selection: {selection.hasSelection ? 'Yes' : 'No'}</div>
            <div>Selected: {selection.selectedCells.size}</div>
            <div>Clipboard: {selection.hasClipboard ? 'Yes' : 'No'}</div>
            <div>Can Undo: {historyIndex > 0 ? 'Yes' : 'No'}</div>
            <div>Can Redo: {historyIndex < history.length - 1 ? 'Yes' : 'No'}</div>
            <div>Shift: {isShiftPressed ? 'Pressed' : 'No'}</div>
            <div>Tool: {selectedTool}</div>
          </div>
        )}
      </div>
    </SidebarProvider>
  );
};