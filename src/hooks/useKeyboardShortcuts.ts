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
      return;
    }

    const { ctrlKey, metaKey, shiftKey, key } = event;
    const isModifierPressed = ctrlKey || metaKey;

    // Atalhos com Ctrl/Cmd
    if (isModifierPressed) {
      switch (key.toLowerCase()) {
        case 'z':
          event.preventDefault();
          if (shiftKey && canRedo) {
            onRedo();
          } else if (canUndo) {
            onUndo();
          }
          break;
        
        case 'y':
          event.preventDefault();
          if (canRedo) {
            onRedo();
          }
          break;
        
        case 'c':
          event.preventDefault();
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
          if (hasClipboard) {
            onPaste();
          }
          break;
        
        case 'x':
          event.preventDefault();
          if (hasSelection) {
            onCut();
          }
          break;
        
        case '`':
          event.preventDefault();
          onToggleView();
          break;
      }
    } else {
      // Atalhos sem modificadores
      switch (key) {
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          if (hasSelection) {
            onDelete();
          }
          break;
        
        case 'Enter':
          event.preventDefault();
          if (hasSelection) {
            onEnterEdit();
          }
          break;
        
        case 'ArrowUp':
          event.preventDefault();
          onMoveSelection('up');
          break;
        
        case 'ArrowDown':
          event.preventDefault();
          onMoveSelection('down');
          break;
        
        case 'ArrowLeft':
          event.preventDefault();
          onMoveSelection('left');
          break;
        
        case 'ArrowRight':
          event.preventDefault();
          onMoveSelection('right');
          break;
      }
    }
  }, [
    onUndo, onRedo, onCopy, onPaste, onCut, onDelete, onToggleView, onMoveSelection, onEnterEdit, onCopyLetters,
    canUndo, canRedo, hasSelection, hasClipboard
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};