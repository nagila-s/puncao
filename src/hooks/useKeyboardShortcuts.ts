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
    // Ignorar se o usuário está digitando em um campo de texto
    const target = event.target as HTMLElement;
    const inputType = target instanceof HTMLInputElement ? target.type : '';
    const isTextInput =
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      (target.tagName === 'INPUT' &&
        ['', 'text', 'search', 'email', 'password', 'url', 'tel', 'number'].includes(inputType));

    if (isTextInput) {
      return;
    }

    const { ctrlKey, metaKey, shiftKey, altKey, key, code } = event;
    const isModifierPressed = ctrlKey || metaKey;

    // Atalhos com Ctrl/Cmd
    if (isModifierPressed) {
      // Ctrl + ` — no ABNT a tecla física (à esquerda do 1) gera ' ou Dead, não `
      const isToggleLetters =
        !altKey &&
        (code === 'Backquote' ||
          key === '`' ||
          key === '~' ||
          key === '´' ||
          (key === 'Dead' &&
            (code === 'Backquote' || code === 'BracketLeft' || code === 'Quote' || code === 'Equal')));

      if (isToggleLetters) {
        event.preventDefault();
        event.stopPropagation();
        onToggleView();
        return;
      }

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