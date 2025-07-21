import { useState, useEffect } from 'react';
import { BrailleCell } from '@/types/braille';
import { letterToBraillePatternFunc, braillePatternToLetter } from '@/lib/brailleMappings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface CellEditorProps {
  cell: BrailleCell;
  onUpdate: (cell: BrailleCell) => void;
  onClose: () => void;
}

const BRAILLE_DOT_POSITIONS = [
  { x: 30, y: 20, dot: 1 },
  { x: 30, y: 45, dot: 2 },
  { x: 30, y: 70, dot: 3 },
  { x: 60, y: 20, dot: 4 },
  { x: 60, y: 45, dot: 5 },
  { x: 60, y: 70, dot: 6 },
];

export const CellEditor = ({ cell, onUpdate, onClose }: CellEditorProps) => {
  const [currentLetter, setCurrentLetter] = useState(cell.letter || ' ');
  const [currentDots, setCurrentDots] = useState<number[]>(cell.dots || []);
  const [origin, setOrigin] = useState<'manual' | 'automatic'>((cell as any).origin || 'automatic');

  useEffect(() => {
    setCurrentLetter(cell.letter || ' ');
    setCurrentDots(cell.dots || []);
    setOrigin((cell as any).origin || 'automatic');
  }, [cell]);

  const handleLetterChange = (newLetter: string) => {
    if (newLetter.length > 1) return;
    
    const letter = newLetter.toLowerCase() || ' ';
    setCurrentLetter(letter);
    
    // Atualizar pontos automaticamente
    const pattern = letterToBraillePatternFunc(letter);
    setCurrentDots(pattern);
    setOrigin('manual');
  };

  const handleDotToggle = (dotNumber: number) => {
    const newDots = currentDots.includes(dotNumber)
      ? currentDots.filter(d => d !== dotNumber)
      : [...currentDots, dotNumber].sort();
    
    setCurrentDots(newDots);
    
    // Atualizar letra automaticamente
    const letter = braillePatternToLetter(newDots);
    setCurrentLetter(letter);
    setOrigin('manual');
  };

  const handleSave = () => {
    const updatedCell: BrailleCell & { origin: 'manual' | 'automatic' } = {
      ...cell,
      letter: currentLetter,
      dots: currentDots,
      origin
    };
    onUpdate(updatedCell);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Editar Célula</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Entrada de letra */}
          <div>
            <label className="text-sm font-medium block mb-2">Letra</label>
            <Input
              value={currentLetter}
              onChange={(e) => handleLetterChange(e.target.value)}
              maxLength={1}
              className="text-center text-lg"
              placeholder="Digite uma letra"
            />
          </div>

          {/* Visualização dos pontos braille */}
          <div>
            <label className="text-sm font-medium block mb-2">Pontos Braille</label>
            <div className="relative bg-muted rounded border p-4 mx-auto" style={{ width: '100px', height: '100px' }}>
              {BRAILLE_DOT_POSITIONS.map(({ x, y, dot }) => (
                <button
                  key={dot}
                  onClick={() => handleDotToggle(dot)}
                  className={`absolute w-4 h-4 rounded-full border-2 transition-all ${
                    currentDots.includes(dot)
                      ? 'bg-primary border-primary'
                      : 'bg-background border-muted-foreground/50 hover:border-primary'
                  }`}
                  style={{ left: x - 8, top: y - 8 }}
                  title={`Ponto ${dot}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Pontos ativos: {currentDots.join(', ') || 'Nenhum'}
            </p>
          </div>

          {/* Info sobre origem */}
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Origem:</span> {origin === 'manual' ? 'Manual' : 'Automático'}
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1">
              Salvar
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};