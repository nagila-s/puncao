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
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenu,
} from "@/components/ui/sidebar";

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
  // Reorganizando conforme a imagem, mantendo estilo original
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

  const group5 = [
    { tool: 'rectangle' as Tool, icon: Square, label: 'Retângulo' },
    { tool: 'triangle' as Tool, icon: Triangle, label: 'Triângulo' },
  ];

  const group6 = [
    { tool: 'circle' as Tool, icon: Circle, label: 'Círculo' },
    { tool: 'line' as Tool, icon: Minus, label: 'Linha' },
  ];

  const group7 = [
    { tool: 'import' as Tool, icon: Upload, label: 'Importar' },
    { action: 'copy', icon: Copy, label: 'Copiar', disabled: !hasSelection, onClick: onCopy },
  ];

  const group8 = [
    { action: 'cut', icon: Scissors, label: 'Recortar', disabled: !hasSelection, onClick: onCut },
    { action: 'paste', icon: Clipboard, label: 'Colar', disabled: !hasClipboard, onClick: onPaste },
  ];

  const group9 = [
    { action: 'help', icon: HelpCircle, label: 'Ajuda', disabled: false, onClick: onToggleHelp },
  ];

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
                  className="w-10 h-10 flex items-center justify-center border-2 border-sidebar-border 
                           bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                  className={`w-10 h-10 flex items-center justify-center border-2 border-sidebar-border transition-all
                    ${isActive 
                      ? 'bg-yellow-400 text-black' 
                      : 'bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent'
                    }`}
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
                  className={`w-10 h-10 flex items-center justify-center border-2 border-sidebar-border transition-all
                    ${isActive 
                      ? 'bg-yellow-400 text-black' 
                      : 'bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent'
                    }`}
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
                  className={`w-10 h-10 flex items-center justify-center border-2 border-sidebar-border transition-all
                    ${isActive 
                      ? 'bg-yellow-400 text-black' 
                      : 'bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent'
                    }`}
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

        {/* Grupo 5: Retângulo/Triângulo */}
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-1">
            {group5.map((tool) => {
              const IconComponent = tool.icon;
              const isActive = selectedTool === tool.tool;
              return (
                <button
                  key={tool.tool}
                  onClick={() => onToolChange(tool.tool)}
                  className={`w-10 h-10 flex items-center justify-center border-2 border-sidebar-border transition-all
                    ${isActive 
                      ? 'bg-yellow-400 text-black' 
                      : 'bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent'
                    }`}
                  title={tool.label}
                >
                  <IconComponent size={16} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Grupo 6: Círculo/Linha */}
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-1">
            {group6.map((tool) => {
              const IconComponent = tool.icon;
              const isActive = selectedTool === tool.tool;
              return (
                <button
                  key={tool.tool}
                  onClick={() => onToolChange(tool.tool)}
                  className={`w-10 h-10 flex items-center justify-center border-2 border-sidebar-border transition-all
                    ${isActive 
                      ? 'bg-yellow-400 text-black' 
                      : 'bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent'
                    }`}
                  title={tool.label}
                >
                  <IconComponent size={16} />
                </button>
              );
            })}
          </div>
          <div className="w-full h-px bg-sidebar-border" />
        </div>

        {/* Grupo 7: Import/Copy */}
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-1">
            {/* Import */}
            <button
              onClick={() => onToolChange(group7[0].tool)}
              className={`w-10 h-10 flex items-center justify-center border-2 border-sidebar-border transition-all
                ${selectedTool === group7[0].tool 
                  ? 'bg-yellow-400 text-black' 
                  : 'bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              title={group7[0].label}
            >
              <Upload size={16} />
            </button>
            {/* Copy */}
            <button
              onClick={onCopy}
              disabled={!hasSelection}
              className="w-10 h-10 flex items-center justify-center border-2 border-sidebar-border 
                       bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                  className="w-10 h-10 flex items-center justify-center border-2 border-sidebar-border 
                           bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
            {group9.map((action) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.action}
                  onClick={action.onClick}
                  className="w-10 h-10 flex items-center justify-center border-2 border-sidebar-border 
                           bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent transition-all"
                  title={action.label}
                >
                  <IconComponent size={16} />
                </button>
              );
            })}
            <div />
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}