import { 
  MousePointer2, 
  Pencil, 
  Eraser, 
  Square,
  Circle,
  Triangle,
  Minus,
  PaintBucket,
  Type,
  Upload,
  Undo2, 
  Redo2,
  Copy,
  Scissors,
  Clipboard,
  HelpCircle
} from 'lucide-react';
import { Tool } from '@/types/braille';
import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AppSidebarProps {
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

export function AppSidebar({
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
}: AppSidebarProps) {
  // Flags de features (por enquanto desabilitadas)
  const SHAPES_AVAILABLE = false;
  const UPLOAD_AVAILABLE = false;

  const group1 = [
    { action: 'undo', icon: Undo2, label: 'Desfazer', disabled: !canUndo, onClick: onUndo },
    { action: 'redo', icon: Redo2, label: 'Refazer', disabled: !canRedo, onClick: onRedo },
  ];

  const group2 = [
    { tool: 'select' as Tool, icon: MousePointer2, label: 'Selecionar' },
    { tool: 'text' as Tool, icon: Type, label: 'Texto' },
  ];

  const group3 = [
    { tool: 'pencil' as Tool, icon: Pencil, label: 'Lápis' },
    { tool: 'fill' as Tool, icon: PaintBucket, label: 'Preenchimento' },
  ];

  const group4 = [
    { tool: 'eraser' as Tool, icon: Eraser, label: 'Borracha' },
  ];

  // Formas geométricas — desativadas por enquanto
  const group5 = [
    { tool: 'rectangle' as Tool, icon: Square, label: 'Retângulo', disabled: !SHAPES_AVAILABLE, tooltip: 'Em breve: formas geométricas' },
    { tool: 'triangle' as Tool, icon: Triangle, label: 'Triângulo', disabled: !SHAPES_AVAILABLE, tooltip: 'Em breve: formas geométricas' },
  ];

  const group6 = [
    { tool: 'circle' as Tool, icon: Circle, label: 'Círculo', disabled: !SHAPES_AVAILABLE, tooltip: 'Em breve: formas geométricas' },
    { tool: 'line' as Tool, icon: Minus, label: 'Linha', disabled: !SHAPES_AVAILABLE, tooltip: 'Em breve: formas geométricas' },
  ];

  // Upload — desativado por enquanto
  const group7 = [
    { tool: 'import' as Tool, icon: Upload, label: 'Importar', disabled: !UPLOAD_AVAILABLE, tooltip: 'Em breve: importar imagem' },
    { action: 'copy', icon: Copy, label: 'Copiar', disabled: !hasSelection, onClick: onCopy },
  ];

  const group8 = [
    { action: 'cut', icon: Scissors, label: 'Recortar', disabled: !hasSelection, onClick: onCut },
    { action: 'paste', icon: Clipboard, label: 'Colar', disabled: !hasClipboard, onClick: onPaste },
  ];

  const buttonBase =
    "w-10 h-10 flex items-center justify-center border-2 border-sidebar-border transition-all";

  const activeClasses = "bg-yellow-400 text-black";
  const normalClasses = "bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent";
  const disabledClasses = "bg-gray-200 text-gray-400 cursor-not-allowed";

  return (
    <Sidebar className="w-24 border-r" collapsible="none">
      <SidebarContent className="p-2 space-y-2">
        {/* Grupo 1: Undo/Redo */}
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-1">
            {group1.map((action) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.action}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`${buttonBase} ${action.disabled ? disabledClasses : normalClasses}`}
                  title={action.label}
                >
                  <IconComponent size={16} />
                </button>
              );
            })}
          </div>
          <div className="w-full h-px bg-sidebar-border" />
        </div>

        {/* Grupo 2: Selecionar/Texto */}
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-1">
            {group2.map((tool) => {
              const IconComponent = tool.icon;
              const isActive = selectedTool === tool.tool;
              return (
                <button
                  key={tool.tool}
                  onClick={() => onToolChange(tool.tool)}
                  className={`${buttonBase} ${isActive ? activeClasses : normalClasses}`}
                  title={tool.label}
                >
                  <IconComponent size={16} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Grupo 3: Lápis/Preenchimento */}
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-1">
            {group3.map((tool) => {
              const IconComponent = tool.icon;
              const isActive = selectedTool === tool.tool;
              return (
                <button
                  key={tool.tool}
                  onClick={() => onToolChange(tool.tool)}
                  className={`${buttonBase} ${isActive ? activeClasses : normalClasses}`}
                  title={tool.label}
                >
                  <IconComponent size={16} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Grupo 4: Borracha */}
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-1">
            {group4.map((tool) => {
              const IconComponent = tool.icon;
              const isActive = selectedTool === tool.tool;
              return (
                <button
                  key={tool.tool}
                  onClick={() => onToolChange(tool.tool)}
                  className={`${buttonBase} ${isActive ? activeClasses : normalClasses}`}
                  title={tool.label}
                >
                  <IconComponent size={16} />
                </button>
              );
            })}
            <div />
          </div>
          <div className="w-full h-px bg-sidebar-border" />
        </div>

        {/* Grupo 5: Retângulo/Triângulo (desabilitados) */}
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-1">
            {group5.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <Tooltip key={tool.tool}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => !tool.disabled && onToolChange(tool.tool)}
                      disabled={tool.disabled}
                      className={`${buttonBase} ${tool.disabled ? disabledClasses : normalClasses}`}
                      title={tool.label}
                      aria-disabled={tool.disabled}
                    >
                      <IconComponent size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {tool.tooltip}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Grupo 6: Círculo/Linha (desabilitados) */}
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-1">
            {group6.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <Tooltip key={tool.tool}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => !tool.disabled && onToolChange(tool.tool)}
                      disabled={tool.disabled}
                      className={`${buttonBase} ${tool.disabled ? disabledClasses : normalClasses}`}
                      title={tool.label}
                      aria-disabled={tool.disabled}
                    >
                      <IconComponent size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {tool.tooltip}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          <div className="w-full h-px bg-sidebar-border" />
        </div>

        {/* Grupo 7: Import (desabilitado) / Copiar */}
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-1">
            {/* Import (disabled) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {/* no-op enquanto indisponível */}}
                  disabled={group7[0].disabled}
                  className={`${buttonBase} ${group7[0].disabled ? disabledClasses : (selectedTool === group7[0].tool ? activeClasses : normalClasses)}`}
                  title={group7[0].label}
                  aria-disabled={group7[0].disabled}
                >
                  <Upload size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {group7[0].tooltip}
              </TooltipContent>
            </Tooltip>

            {/* Copy */}
            <button
              onClick={group7[1].onClick}
              disabled={group7[1].disabled}
              className={`${buttonBase} ${group7[1].disabled ? disabledClasses : normalClasses}`}
              title={group7[1].label}
            >
              <Copy size={16} />
            </button>
          </div>
        </div>

        {/* Grupo 8: Cut/Paste */}
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-1">
            {group8.map((action) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.action}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`${buttonBase} ${action.disabled ? disabledClasses : normalClasses}`}
                  title={action.label}
                >
                  <IconComponent size={16} />
                </button>
              );
            })}
          </div>
          <div className="w-full h-px bg-sidebar-border" />
        </div>

        {/* Grupo 9: Help */}
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={onToggleHelp}
              className={`${buttonBase} ${normalClasses}`}
              title="Ajuda"
            >
              <HelpCircle size={16} />
            </button>
            <div />
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
