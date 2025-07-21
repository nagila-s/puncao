import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrailleGrid } from '@/types/braille';
import { useToast } from '@/hooks/use-toast';

interface CopyLettersProps {
  grid: BrailleGrid;
}

export const CopyLetters = ({ grid }: CopyLettersProps) => {
  const { toast } = useToast();

  const extractLettersFromGrid = (): string => {
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
    
    return lines.join('\n');
  };

  const copyToClipboard = async () => {
    try {
      const textContent = extractLettersFromGrid();
      await navigator.clipboard.writeText(textContent);
      
      toast({
        title: "Figura copiada",
        description: "Conteúdo em letras copiado para a área de transferência",
        duration: 2000,
      });
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível copiar para a área de transferência",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={copyToClipboard}
      className="flex items-center gap-2"
      title="Copiar letras da grade (Ctrl+Shift+C)"
    >
      <Copy size={16} />
      Copiar Letras
    </Button>
  );
};