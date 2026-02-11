import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsProps {
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onCut: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
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
  onClearSelection,
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

    // Atalhos com Ctrl/Cmd
    if (isModifierPressed) {
      switch (key.toLowerCase()) {
        case 'z':
          event.preventDefault();
          event.stopPropagation();
          if (shiftKey && canRedo) {
            onRedo();
          } else if (canUndo) {
            onUndo();
          }
          break;
        
        case 'y':
          event.preventDefault();
          event.stopPropagation();
          if (canRedo) {
            onRedo();
          }
          break;
        
        case 'c':
          event.preventDefault();
          event.stopPropagation();
          if (shiftKey && onCopyLetters) {
            // Ctrl+Shift+C - Copiar letras
            onCopyLetters();
          } else if (hasSelection) {
            // Ctrl+C - Copiar seleção
            onCopy();
          }
          break;
        
        case 'v':
          event.preventDefault();
          event.stopPropagation();
          if (hasClipboard) {
            onPaste();
          }
          break;
        
        case 'x':
          event.preventDefault();
          event.stopPropagation();
          if (hasSelection) {
            onCut();
          }
          break;
        
        case '`':
          event.preventDefault();
          event.stopPropagation();
          onToggleView();
          break;
      }
    } else {
      // Atalhos sem modificadores
      switch (key) {
        case 'Escape':
          event.preventDefault();
          event.stopPropagation();
          if (hasSelection) {
            onClearSelection();
          }
          break;

        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          event.stopPropagation();
          if (hasSelection) {
            onDelete();
          }
          break;
        
        case 'Enter':
          event.preventDefault();
          event.stopPropagation();
          if (hasSelection) {
            onEnterEdit();
          }
          break;
        
        case 'ArrowUp':
          event.preventDefault();
          event.stopPropagation();
          onMoveSelection('up');
          break;
        
        case 'ArrowDown':
          event.preventDefault();
          event.stopPropagation();
          onMoveSelection('down');
          break;
        
        case 'ArrowLeft':
          event.preventDefault();
          event.stopPropagation();
          onMoveSelection('left');
          break;
        
        case 'ArrowRight':
          event.preventDefault();
          event.stopPropagation();
          onMoveSelection('right');
          break;
      }
    }
  }, [
    onUndo, onRedo, onCopy, onPaste, onCut, onDelete, onClearSelection, onToggleView, onMoveSelection, onEnterEdit, onCopyLetters,
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