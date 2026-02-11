import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal = ({ onClose }: HelpModalProps) => {
  const shortcutsGeral = [
    { action: 'Desfazer', shortcut: 'Ctrl + Z' },
    { action: 'Refazer', shortcut: 'Ctrl + Shift + Z  ou  Ctrl + Y' },
    { action: 'Copiar seleção (dots)', shortcut: 'Ctrl + C' },
    { action: 'Copiar seleção (letras)', shortcut: 'Ctrl + Shift + C' },
    { action: 'Colar', shortcut: 'Ctrl + V' },
    { action: 'Recortar', shortcut: 'Ctrl + X' },
    { action: 'Deletar conteúdo', shortcut: 'Del  ou  Backspace' },
    { action: 'Limpar seleção', shortcut: 'Esc' },
    { action: 'Alternar pontos / letras', shortcut: 'Ctrl + `' },
    { action: 'Mover seleção', shortcut: '← ↑ → ↓' },
    { action: 'Editar célula selecionada', shortcut: 'Enter' },
  ];

  const shortcutsFormas = [
    { action: 'Confirmar forma (aplicar no grid)', shortcut: 'Enter' },
    { action: 'Cancelar forma (descartar)', shortcut: 'Esc' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Ajuda</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Ferramentas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Ferramentas</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Selecionar:</strong> Clique para selecionar uma célula ou arraste para selecionar uma área retangular.
                Com uma seleção ativa, use o mouse ou as setas do teclado para a mover. Pressione Enter para editar a célula.
              </div>
              <div>
                <strong>Texto:</strong> Clique numa célula para posicionar o cursor de texto e comece a digitar.
                As letras são convertidas automaticamente para braille. Use Backspace para apagar e as setas para navegar.
              </div>
              <div>
                <strong>Lápis:</strong> Clique e arraste para ativar pontos individuais nas células braille.
                Cada célula que o cursor toca recebe todos os 6 pontos.
              </div>
              <div>
                <strong>Borracha:</strong> Clique e arraste para limpar os pontos das células.
              </div>
              <div>
                <strong>Preenchimento:</strong> Clique numa célula para preencher toda a área contígua com a mesma cor (flood fill).
              </div>
            </div>
          </div>

          {/* Formas geométricas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Formas Geométricas</h3>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Para desenhar uma forma: selecione a ferramenta, clique e arraste sobre a grade para definir
                a área da forma. Ao soltar o botão do mouse, o preview fica travado para ajuste.
                Pressione <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">Enter</kbd> para
                aplicar ou <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">Esc</kbd> para cancelar.
              </p>
              <div>
                <strong>Retângulo:</strong> Desenha o contorno de um retângulo na área selecionada.
              </div>
              <div>
                <strong>Círculo:</strong> Desenha o contorno de uma elipse inscrita na área selecionada.
                Para um círculo mais redondo, use uma área com proporção próxima de 2 colunas para 1 linha.
              </div>
              <div>
                <strong>Linha:</strong> Desenha uma linha reta entre dois pontos.
                A linha é automaticamente ajustada (snap) para alinhar com os pontos Braille mais
                próximos do local do clique, produzindo traços finos de uma coluna ou linha de pontos.
              </div>
            </div>
          </div>

          {/* Atalhos gerais */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Atalhos de Teclado — Geral</h3>
            <div className="grid gap-2">
              {shortcutsGeral.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-muted rounded">
                  <span className="text-sm">{item.action}</span>
                  <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
                    {item.shortcut}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Atalhos de formas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Atalhos de Teclado — Formas</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Estes atalhos funcionam apenas enquanto uma forma está a ser posicionada (preview visível).
            </p>
            <div className="grid gap-2">
              {shortcutsFormas.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-muted rounded">
                  <span className="text-sm">{item.action}</span>
                  <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
                    {item.shortcut}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Dicas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Dicas</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Visualização:</strong> Use <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">Ctrl + `</kbd> para
                alternar entre a visualização de pontos Braille e as letras correspondentes.
              </div>
              <div>
                <strong>Copiar como texto:</strong> Use <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">Ctrl + Shift + C</kbd> para
                copiar a seleção como letras para a área de transferência, útil para colar em outros programas.
              </div>
              <div>
                <strong>Edição manual:</strong> Com a ferramenta Selecionar, clique duas vezes numa célula
                ou pressione Enter com uma célula selecionada para abrir o editor manual de pontos.
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
