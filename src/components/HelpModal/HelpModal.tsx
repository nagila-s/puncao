import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal = ({ onClose }: HelpModalProps) => {
  const shortcuts = [
    { action: 'Desfazer', shortcut: 'Ctrl + Z' },
    { action: 'Refazer', shortcut: 'Ctrl + Shift + Z' },
    { action: 'Copiar', shortcut: 'Ctrl + C' },
    { action: 'Colar', shortcut: 'Ctrl + V' },
    { action: 'Recortar', shortcut: 'Ctrl + X' },
    { action: 'Deletar conteúdo', shortcut: 'Del' },
    { action: 'Alternar modo de visualização', shortcut: 'Ctrl + `' },
    { action: 'Mover seleção', shortcut: '← ↑ → ↓' },
    { action: 'Editar célula selecionada', shortcut: 'Enter' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Ajuda - Editor Braille</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Atalhos de teclado */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Atalhos de Teclado</h3>
            <div className="grid gap-2">
              {shortcuts.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-muted rounded">
                  <span className="text-sm">{item.action}</span>
                  <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
                    {item.shortcut}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Como usar */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Como Usar</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Ferramenta Lápis:</strong> Clique e arraste para ativar pontos individuais nas células Braille.
              </div>
              <div>
                <strong>Ferramenta Seleção:</strong> Clique para selecionar células individuais ou arraste para selecionar uma área.
              </div>
              <div>
                <strong>Edição Manual:</strong> Clique duas vezes em uma célula ou pressione Enter com uma célula selecionada para abrir o editor manual.
              </div>
              <div>
                <strong>Copiar/Colar:</strong> Selecione células e use Ctrl+C para copiar. Use Ctrl+V para colar na posição do cursor.
              </div>
              <div>
                <strong>Visualização:</strong> Use Ctrl+` para alternar entre mostrar pontos Braille ou letras correspondentes.
              </div>
            </div>
          </div>

          {/* Padrões Braille básicos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Padrões Braille Básicos</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-muted p-3 rounded text-center">
                <div className="font-mono text-lg mb-1">a</div>
                <div className="text-xs text-muted-foreground">Ponto 1</div>
              </div>
              <div className="bg-muted p-3 rounded text-center">
                <div className="font-mono text-lg mb-1">b</div>
                <div className="text-xs text-muted-foreground">Pontos 1,2</div>
              </div>
              <div className="bg-muted p-3 rounded text-center">
                <div className="font-mono text-lg mb-1">c</div>
                <div className="text-xs text-muted-foreground">Pontos 1,4</div>
              </div>
              <div className="bg-muted p-3 rounded text-center">
                <div className="font-mono text-lg mb-1">d</div>
                <div className="text-xs text-muted-foreground">Pontos 1,4,5</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t">
          <Button onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};