import { useState, useCallback } from 'react';

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
}

export const useTextOverlay = () => {
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const addTextElement = useCallback((text: string, x: number, y: number) => {
    const id = `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newElement: TextElement = {
      id,
      text,
      x,
      y
    };
    
    setTextElements(prev => [...prev, newElement]);
    setSelectedElementId(id);
    return id;
  }, []);

  const updateTextElement = useCallback((id: string, text: string, x: number, y: number) => {
    setTextElements(prev => 
      prev.map(element => 
        element.id === id 
          ? { ...element, text, x, y }
          : element
      )
    );
  }, []);

  const deleteTextElement = useCallback((id: string) => {
    setTextElements(prev => prev.filter(element => element.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  }, [selectedElementId]);

  const selectElement = useCallback((id: string) => {
    setSelectedElementId(id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElementId(null);
  }, []);

  const deleteSelected = useCallback(() => {
    if (selectedElementId) {
      deleteTextElement(selectedElementId);
    }
  }, [selectedElementId, deleteTextElement]);

  return {
    textElements,
    selectedElementId,
    addTextElement,
    updateTextElement,
    deleteTextElement,
    selectElement,
    clearSelection,
    deleteSelected
  };
};