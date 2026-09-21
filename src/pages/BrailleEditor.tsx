// src/pages/BrailleEditor.tsx
import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppSidebar } from '@/components/Sidebar/AppSidebar';
import { DrawingArea } from '@/components/Canvas/DrawingArea';
import { CellEditor } from '@/components/CellEditor/CellEditor';
import { HelpModal } from '@/components/HelpModal/HelpModal';
import { ImageImportModal } from '@/components/ImageImportModal/ImageImportModal';
import { AppHeader } from '@/components/layout/AppHeader';
import { Tool, BrailleGrid, BrailleCell, OverlayReferenceImage, EraserUnit } from '@/types/braille';
import { clampEraserSize } from '@/lib/eraserBrush';
import { useSelection } from '@/hooks/useSelection';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useShapes, isShapeTool } from '@/hooks/useShapes';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider } from "@/components/ui/sidebar";
import { writeTextToGrid } from '@/lib/textPlacement';
import { gridToLetters } from '@/lib/encoding';
import { fetchDrawingById, upsertDraftDrawing } from '@/lib/drawings';

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

const resizeGridKeepingContent = (
  currentGrid: BrailleGrid,
  newWidth: number,
  newHeight: number
): BrailleGrid => {
  const resizedGrid = createEmptyGrid(newWidth, newHeight);
  const maxY = Math.min(currentGrid.height, newHeight);
  const maxX = Math.min(currentGrid.width, newWidth);

  for (let y = 0; y < maxY; y++) {
    for (let x = 0; x < maxX; x++) {
      const sourceCell = currentGrid.cells[y]?.[x];
      if (!sourceCell) continue;

      resizedGrid.cells[y][x] = {
        ...sourceCell,
        x,
        y,
        dots: [...sourceCell.dots],
        isActive: false
      };
    }
  }

  return resizedGrid;
};

export const BrailleEditor = () => {
  const [selectedTool, setSelectedTool] = useState<Tool>('pencil');
  const [eraserUnit, setEraserUnit] = useState<EraserUnit>('dots');
  const [eraserSize, setEraserSize] = useState(1);
  const [toolBeforeImageImport, setToolBeforeImageImport] = useState<Tool>('pencil');
  const [zoom, setZoom] = useState(1);
  const [grid, setGrid] = useState<BrailleGrid>(() => createEmptyGrid(34, 28)); // 34 caracteres, 28 linhas
  const [history, setHistory] = useState<BrailleGrid[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const [showLetters, setShowLetters] = useState(false);
  const [editingCell, setEditingCell] = useState<BrailleCell | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [overlayImage, setOverlayImage] = useState<OverlayReferenceImage | null>(null);
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.4);
  const [currentDrawingId, setCurrentDrawingId] = useState<string | null>(null);
  const loadedDrawingRef = useRef<string | null>(null);
  const loadedOwnerRef = useRef<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile } = useAuth();
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
    const newGrid = resizeGridKeepingContent(grid, resolution.width, resolution.height);
    setGrid(newGrid);
    addToHistory(newGrid);
  }, [grid, addToHistory]);

  const handleGridChange = useCallback((newGrid: BrailleGrid) => {
    setGrid(newGrid);
    addToHistory(newGrid);
  }, [addToHistory]);

  const handleToggleHelp = useCallback(() => {
    setShowHelp(!showHelp);
  }, [showHelp]);

  const handleToggleView = useCallback(() => {
    setShowLetters((current) => !current);
  }, []);

  const handleCellDoubleClick = useCallback((x: number, y: number) => {
    const cell = grid.cells[y][x];
    setEditingCell(cell);
  }, [grid]);

  // Selection / shapes
  const selection = useSelection(grid, handleGridChange);
  const shapes = useShapes(grid, handleGridChange);

  const handleToolChange = useCallback((tool: Tool) => {
    if (selection.isSelecting) {
      return;
    }
    if (tool === 'image_import') {
      setToolBeforeImageImport(selectedTool);
    }
    if (selection.hasSelection && (tool === 'fill' || tool === 'eraser')) {
      if (tool === 'fill') selection.fillSelectedCells();
      else selection.deleteSelectedCells();
    }
    setSelectedTool(tool);
  }, [selection, selectedTool]);


  // >>> Inserção de texto vinda da caixa inline no DrawingArea
  const handleInsertText = useCallback((cellX: number, cellY: number, text: string) => {
    const newGrid = writeTextToGrid(grid, cellX, cellY, text);
    setGrid(newGrid);
    addToHistory(newGrid);
  }, [grid, addToHistory]);

  // Clique em célula (usado para select/fill; MODO TEXTO é tratado no DrawingArea)
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
    } else if (selectedTool === 'fill') {
      if (selection.hasSelection) {
        selection.fillSelectedCells();
        return;
      }
      const newGrid = JSON.parse(JSON.stringify(grid));
      shapes.floodFill(newGrid, x, y);
      handleGridChange(newGrid);
    }
  }, [selectedTool, lastClickTime, handleCellDoubleClick, selection, grid, shapes, handleGridChange]);

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

  // Copiar letras da grade e salvar como não publicado quando houver login
  const handleCopyLetters = useCallback(async () => {
    let copied = false;
    try {
      const textContent = gridToLetters(grid, '\r\n');
      await navigator.clipboard.writeText(textContent);
      copied = true;
    } catch (error) {
      console.error('[CopyLetters] Erro ao copiar:', error);
    }

    if (!user) {
      toast({
        title: copied ? 'Figura copiada' : 'Erro',
        description: copied
          ? 'Entre para salvar em Meus desenhos.'
          : 'Não foi possível copiar para a área de transferência. Entre para salvar o desenho.',
        variant: copied ? 'default' : 'destructive',
        duration: 2500,
      });
      return;
    }

    const { drawing, error } = await upsertDraftDrawing({
      id: currentDrawingId,
      ownerId: user.id,
      authorName: profile?.display_name || user.email || '',
      grid,
    });

    if (error || !drawing) {
      toast({
        title: copied ? 'Copiado, mas não salvo' : 'Não foi possível salvar',
        description: error || 'Não foi possível gravar em Meus desenhos.',
        variant: 'destructive',
      });
      return;
    }

    setCurrentDrawingId(drawing.id);
    loadedDrawingRef.current = drawing.id;
    loadedOwnerRef.current = drawing.owner_id;
    if (searchParams.get('d') !== drawing.id) {
      setSearchParams({ d: drawing.id }, { replace: true });
    }

    toast({
      title: copied ? 'Desenho copiado para a área de transferência' : 'Salvo em Meus desenhos',
      description: copied
        ? (
          <>
            Agora você também pode encontrar este desenho em <strong>Meus desenhos</strong>.
          </>
        )
        : 'A cópia para a área de transferência falhou, mas o desenho foi salvo como não publicado.',
      duration: 4000,
    });
  }, [grid, toast, user, profile, currentDrawingId, searchParams, setSearchParams]);

  const handleNewDrawing = useCallback(() => {
    const empty = createEmptyGrid(34, 28);
    setGrid(empty);
    setHistory([JSON.parse(JSON.stringify(empty))]);
    setHistoryIndex(0);
    setCurrentDrawingId(null);
    loadedDrawingRef.current = null;
    loadedOwnerRef.current = null;
    setOverlayImage(null);
    setOverlayEnabled(false);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    const drawingId = searchParams.get('d');
    if (!drawingId) {
      return;
    }

    const applyOwnership = (ownerId: string, id: string) => {
      if (user && ownerId === user.id) {
        setCurrentDrawingId(id);
      } else {
        setCurrentDrawingId(null);
      }
    };

    if (loadedDrawingRef.current === drawingId && loadedOwnerRef.current) {
      applyOwnership(loadedOwnerRef.current, drawingId);
      return;
    }

    let cancelled = false;
    loadedDrawingRef.current = drawingId;

    void fetchDrawingById(drawingId).then((drawing) => {
      if (cancelled) return;
      if (!drawing) {
        if (user) {
          toast({
            title: 'Desenho não encontrado',
            description: 'Ele pode ser privado ou ainda não publicado.',
            variant: 'destructive',
          });
        }
        return;
      }

      loadedOwnerRef.current = drawing.owner_id;
      setGrid(drawing.grid);
      setHistory([JSON.parse(JSON.stringify(drawing.grid))]);
      setHistoryIndex(0);
      applyOwnership(drawing.owner_id, drawing.id);
    });

    return () => {
      cancelled = true;
    };
  }, [searchParams, user, toast]);

  // ── Teclado para formas: Enter confirma, Esc cancela ──
  // Registado ANTES do useKeyboardShortcuts para ter prioridade na fase capture.
  useEffect(() => {
    const handleShapeKeyDown = (e: KeyboardEvent) => {
      if (!shapes.isPlacingShape) return;

      // Não roubar Enter/Esc de inputs, textareas ou modais abertos
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.closest('[role="dialog"]')
      ) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopImmediatePropagation(); // impede que o handler genérico processe
        const newGrid = shapes.confirmShape();
        if (newGrid) {
          handleGridChange(newGrid);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        shapes.cancelShape();
      }
    };

    document.addEventListener('keydown', handleShapeKeyDown, true); // capture
    return () => document.removeEventListener('keydown', handleShapeKeyDown, true);
  }, [shapes.isPlacingShape, shapes.confirmShape, shapes.cancelShape, handleGridChange]);

  // Cancelar forma ao mudar de ferramenta
  useEffect(() => {
    if (!isShapeTool(selectedTool) && shapes.isPlacingShape) {
      shapes.cancelShape();
    }
  }, [selectedTool, shapes.isPlacingShape, shapes.cancelShape]);

  // Atalhos de teclado
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onCopy: selection.copySelectedCells,
    onPaste: handlePasteAtCursor,
    onCut: selection.cutSelectedCells,
    onDelete: selection.deleteSelectedCells,
    onClearSelection: selection.clearSelection,
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

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen w-full flex flex-col bg-background">
        <AppHeader />

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
            eraserUnit={eraserUnit}
            eraserSize={eraserSize}
            onEraserUnitChange={setEraserUnit}
            onEraserSizeChange={(size) => setEraserSize(clampEraserSize(size))}
          />

          <main className="flex-1">
            <DrawingArea
              grid={grid}
              zoom={zoom}
              selectedTool={selectedTool}
              showLetters={showLetters}
              overlayImage={overlayImage}
              overlayEnabled={overlayEnabled}
              overlayOpacity={overlayOpacity}
              selection={selection}
              onZoomChange={setZoom}
              onResolutionChange={handleResolutionChange}
              onCellClick={handleCellClick}
              onGridChange={handleGridChange}
              onToggleLetters={handleToggleView}
              onInsertText={handleInsertText}
              onSelectionChange={() => {}}
              shapes={shapes}
              onOverlayEnabledChange={setOverlayEnabled}
              onOverlayOpacityChange={setOverlayOpacity}
              onCopyLetters={handleCopyLetters}
              onNewDrawing={handleNewDrawing}
              eraserUnit={eraserUnit}
              eraserSize={eraserSize}
            />
          </main>
        </div>

        {/* Modals */}
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        {selectedTool === 'image_import' && (
          <ImageImportModal
            gridWidth={grid.width}
            gridHeight={grid.height}
            onApply={(newGrid, referenceImage) => {
              setGrid(newGrid);
              addToHistory(newGrid);
              if (referenceImage.dataUrl) {
                setOverlayImage(referenceImage);
                setOverlayEnabled(true);
              }
              setSelectedTool(toolBeforeImageImport);
            }}
            onClose={() => setSelectedTool(toolBeforeImageImport)}
          />
        )}
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
            <div>Tool: {selectedTool}</div>
          </div>
        )}
      </div>
    </SidebarProvider>
  );
};