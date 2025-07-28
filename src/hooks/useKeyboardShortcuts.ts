import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsProps {
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onCut: () => void;
  onDelete: () => void;
  onToggleView: () => void;
  onMoveSelection: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onEnterEdit: () => void;
  onCopyLetters?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  hasClipboard: boolean;
}

export const useKeyboardShortcuts = ({
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onCut,
  onDelete,
  onToggleView,
  onMoveSelection,
  onEnterEdit,
  onCopyLetters,
  canUndo,
  canRedo,
  hasSelection,
  hasClipboard
}: KeyboardShortcutsProps) => {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignorar se o usuário está digitando em um input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      // Only block shortcuts if the user is actually typing (not just focused)
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isEditing = target.contentEditable === 'true' && target === document.activeElement;
      
      if (isTyping || isEditing) {
        return;
      }
    }

    const { ctrlKey, metaKey, shiftKey, key } = event;
    const isModifierPressed = ctrlKey || metaKey;

    // Debug logging for troubleshooting
    console.log('Keyboard shortcut detected:', { key, ctrlKey, metaKey, shiftKey, isModifierPressed });

    // Atalhos com Ctrl/Cmd
    if (isModifierPressed) {
      switch (key.toLowerCase()) {
        case 'z':
          event.preventDefault();
          event.stopPropagation();
          if (shiftKey && canRedo) {
            console.log('Executing Redo');
            onRedo();
          } else if (canUndo) {
            console.log('Executing Undo');
            onUndo();
          }
          break;
        
        case 'y':
          event.preventDefault();
          event.stopPropagation();
          if (canRedo) {
            console.log('Executing Redo (Y)');
            onRedo();
          }
          break;
        
        case 'c':
          event.preventDefault();
          event.stopPropagation();
          if (shiftKey && onCopyLetters) {
            // Ctrl+Shift+C - Copiar letras
            console.log('Executing Copy Letters');
            onCopyLetters();
          } else if (hasSelection) {
            // Ctrl+C - Copiar seleção
            console.log('Executing Copy Selection');
            onCopy();
          }
          break;
        
        case 'v':
          event.preventDefault();
          event.stopPropagation();
          if (hasClipboard) {
            console.log('Executing Paste');
            onPaste();
          }
          break;
        
        case 'x':
          event.preventDefault();
          event.stopPropagation();
          if (hasSelection) {
            console.log('Executing Cut');
            onCut();
          }
          break;
        
        case '`':
          event.preventDefault();
          event.stopPropagation();
          console.log('Executing Toggle View');
          onToggleView();
          break;
      }
    } else {
      // Atalhos sem modificadores
      switch (key) {
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          event.stopPropagation();
          if (hasSelection) {
            console.log('Executing Delete');
            onDelete();
          }
          break;
        
        case 'Enter':
          event.preventDefault();
          event.stopPropagation();
          if (hasSelection) {
            console.log('Executing Enter Edit');
            onEnterEdit();
          }
          break;
        
        case 'ArrowUp':
          event.preventDefault();
          event.stopPropagation();
          console.log('Executing Move Up');
          onMoveSelection('up');
          break;
        
        case 'ArrowDown':
          event.preventDefault();
          event.stopPropagation();
          console.log('Executing Move Down');
          onMoveSelection('down');
          break;
        
        case 'ArrowLeft':
          event.preventDefault();
          event.stopPropagation();
          console.log('Executing Move Left');
          onMoveSelection('left');
          break;
        
        case 'ArrowRight':
          event.preventDefault();
          event.stopPropagation();
          console.log('Executing Move Right');
          onMoveSelection('right');
          break;
      }
    }
  }, [
    onUndo, onRedo, onCopy, onPaste, onCut, onDelete, onToggleView, onMoveSelection, onEnterEdit, onCopyLetters,
    canUndo, canRedo, hasSelection, hasClipboard
  ]);

  useEffect(() => {
    // Use capture phase to ensure our handler runs first
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]);
};