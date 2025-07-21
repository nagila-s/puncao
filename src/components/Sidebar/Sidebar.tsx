import { useState } from 'react';
import { 
  MousePointer2, 
  Pencil, 
  Eraser, 
  Undo2, 
  Redo2,
  Square,
  Circle,
  Triangle,
  Minus,
  ArrowRight,
  PaintBucket,
  Type,
  Copy,
  Scissors,
  Clipboard,
  Upload,
  HelpCircle
} from 'lucide-react';
import { ToolButton } from './ToolButton';
import { Tool } from '@/types/braille';

interface SidebarProps {
  selectedTool: Tool;
  onToolChange: (tool: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleHelp: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection?: boolean;
  hasClipboard?: boolean;
}

export const Sidebar = ({
  selectedTool,
  onToolChange,
  onUndo,
  onRedo,
  onToggleHelp,
  onCopy,
  onCut,
  onPaste,
  canUndo,
  canRedo,
  hasSelection,
  hasClipboard
}: SidebarProps) => {
  const [hoveredTool, setHoveredTool] = useState<Tool | null>(null);

  const toolGroups = [
    {
      title: "Ferramentas básicas",
      tools: [
        { tool: 'select' as Tool, icon: <MousePointer2 size={16} />, label: 'Selecionar' },
        { tool: 'pencil' as Tool, icon: <Pencil size={16} />, label: 'Lápis' },
        { tool: 'eraser' as Tool, icon: <Eraser size={16} />, label: 'Borracha' },
      ]
    },
    {
      title: "Formas",
      tools: [
        { tool: 'rectangle' as Tool, icon: <Square size={16} />, label: 'Retângulo' },
        { tool: 'circle' as Tool, icon: <Circle size={16} />, label: 'Círculo' },
        { tool: 'triangle' as Tool, icon: <Triangle size={16} />, label: 'Triângulo' },
        { tool: 'line' as Tool, icon: <Minus size={16} />, label: 'Linha' },
      ]
    },
    {
      title: "Outros",
      tools: [
        { tool: 'fill' as Tool, icon: <PaintBucket size={16} />, label: 'Preenchimento' },
        { tool: 'text' as Tool, icon: <Type size={16} />, label: 'Texto' },
        { tool: 'import' as Tool, icon: <Upload size={16} />, label: 'Importar' },
      ]
    }
  ];

  const actionButtons = [
    { action: 'undo', icon: <Undo2 size={16} />, label: 'Desfazer', disabled: !canUndo },
    { action: 'redo', icon: <Redo2 size={16} />, label: 'Refazer', disabled: !canRedo },
    { action: 'copy', icon: <Copy size={16} />, label: 'Copiar', disabled: !hasSelection },
    { action: 'cut', icon: <Scissors size={16} />, label: 'Recortar', disabled: !hasSelection },
    { action: 'paste', icon: <Clipboard size={16} />, label: 'Colar', disabled: !hasClipboard },
  ];

  return (
    <div className="w-16 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-2 border-b border-sidebar-border">
        <h1 className="text-xs font-bold text-sidebar-foreground text-center">
          Braille
        </h1>
      </div>

      {/* Ferramentas */}
      <div className="flex-1 p-2 space-y-4">
        {toolGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {group.tools.map((toolConfig) => (
              <ToolButton
                key={toolConfig.tool}
                tool={toolConfig.tool}
                isActive={selectedTool === toolConfig.tool}
                icon={toolConfig.icon}
                label={toolConfig.label}
                onClick={onToolChange}
              />
            ))}
            {group !== toolGroups[toolGroups.length - 1] && (
              <div className="w-full h-px bg-sidebar-border my-2" />
            )}
          </div>
        ))}

        {/* Ações */}
        <div className="space-y-1 pt-2 border-t border-sidebar-border">
          {actionButtons.map((action) => (
            <button
              key={action.action}
              onClick={() => {
                if (action.action === 'undo') onUndo();
                else if (action.action === 'redo') onRedo();
                else if (action.action === 'copy' && onCopy) onCopy();
                else if (action.action === 'cut' && onCut) onCut();
                else if (action.action === 'paste' && onPaste) onPaste();
              }}
              disabled={action.disabled}
              className="w-10 h-10 flex items-center justify-center border-2 border-sidebar-border 
                       bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title={action.label}
            >
              {action.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Help Button */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={onToggleHelp}
          className="w-10 h-10 flex items-center justify-center border-2 border-sidebar-border 
                   bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent transition-all"
          title="Ajuda - Tabela de letras"
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </div>
  );
};