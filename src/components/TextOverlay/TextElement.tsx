import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Check, X } from 'lucide-react';
import { letterToBraillePatternFunc } from '@/lib/brailleMappings';

const CELL_WIDTH = 20;
const CELL_HEIGHT = 30;

interface TextElementProps {
  id: string;
  text: string;
  x: number;
  y: number;
  zoom: number;
  onUpdate: (id: string, text: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const TextElement = ({
  id,
  text,
  x,
  y,
  zoom,
  onUpdate,
  onDelete,
  isSelected,
  onSelect
}: TextElementProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x, y });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Alinhar com a grade ao atualizar posição
    const newAlignedX = Math.round(x / CELL_WIDTH) * CELL_WIDTH;
    const newAlignedY = Math.round(y / CELL_HEIGHT) * CELL_HEIGHT;
    setPosition({ x: newAlignedX, y: newAlignedY });
  }, [x, y]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    onSelect(id);
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x * zoom,
      y: e.clientY - position.y * zoom
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const newX = (e.clientX - dragStart.x) / zoom;
    const newY = (e.clientY - dragStart.y) / zoom;
    
    // Alinhar com a grade durante o arraste
    const alignedNewX = Math.round(newX / CELL_WIDTH) * CELL_WIDTH;
    const alignedNewY = Math.round(newY / CELL_HEIGHT) * CELL_HEIGHT;
    
    setPosition({ x: alignedNewX, y: alignedNewY });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onUpdate(id, text, position.x, position.y);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
    setEditText(text);
  };

  const handleSaveEdit = () => {
    onUpdate(id, editText, position.x, position.y);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Função para renderizar texto como braille
  const renderBrailleText = (text: string) => {
    return text.split('').map((char, index) => {
      const dots = letterToBraillePatternFunc(char.toLowerCase());
      return (
        <div key={index} className="inline-block relative" style={{ width: CELL_WIDTH, height: CELL_HEIGHT }}>
          {dots.map(dotNumber => {
            // Usar as mesmas posições do BrailleGrid principal
            const dotPositions = [
              { x: CELL_WIDTH * 0.3, y: CELL_HEIGHT * 0.2 }, // ponto 1
              { x: CELL_WIDTH * 0.3, y: CELL_HEIGHT * 0.5 }, // ponto 2
              { x: CELL_WIDTH * 0.3, y: CELL_HEIGHT * 0.8 }, // ponto 3
              { x: CELL_WIDTH * 0.7, y: CELL_HEIGHT * 0.2 }, // ponto 4
              { x: CELL_WIDTH * 0.7, y: CELL_HEIGHT * 0.5 }, // ponto 5
              { x: CELL_WIDTH * 0.7, y: CELL_HEIGHT * 0.8 }, // ponto 6
            ];
            const pos = dotPositions[dotNumber - 1];
            if (!pos) return null;
            
            return (
              <div
                key={dotNumber}
                className="absolute bg-foreground rounded-full"
                style={{
                  left: pos.x - 2, // centrar o ponto (raio = 2)
                  top: pos.y - 2,  // centrar o ponto (raio = 2)
                  width: 4,       // DOT_RADIUS * 2
                  height: 4       // DOT_RADIUS * 2
                }}
              />
            );
          })}
        </div>
      );
    });
  };

  return (
    <div
      className={`absolute cursor-move select-none ${isSelected ? 'ring-2 ring-yellow-400' : ''}`}
      style={{
        left: `${position.x * zoom}px`,
        top: `${position.y * zoom}px`,
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
        zIndex: isSelected ? 10 : 5
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <div className="flex items-center gap-1 bg-white border border-border rounded p-1 shadow-lg">
          <Input
            ref={inputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-6 text-xs min-w-[100px]"
            style={{ fontSize: `${12}px` }}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSaveEdit}
            className="h-6 w-6 p-0"
          >
            <Check size={10} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancelEdit}
            className="h-6 w-6 p-0"
          >
            <X size={10} />
          </Button>
        </div>
      ) : (
        <div className="relative group">
          <div className="flex">
            {renderBrailleText(text)}
          </div>
          
          {isSelected && (
            <div className="absolute -top-8 left-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6 p-0 bg-white border"
              >
                <Edit size={10} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(id)}
                className="h-6 w-6 p-0 bg-white border text-destructive"
              >
                <Trash2 size={10} />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};