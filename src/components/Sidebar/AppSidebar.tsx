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
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";

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
    { tool: 'rectangle' as Tool, icon: Square, label: 'Retângulo', disabled: true, soon: true },
    { tool: 'triangle' as Tool, icon: Triangle, label: 'Triângulo', disabled: true, soon: true },
  ];

  const group6 = [
    { tool: 'circle' as Tool, icon: Circle, label: 'Círculo', disabled: true, soon: true },
    { tool: 'line' as Tool, icon: Minus, label: 'Linha', disabled: true, soon: true },
  ];

  const group7 = [
    { tool: 'import' as Tool, icon: Upload, label: 'Importar', disabled: true, soon: true },
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

  // dois tons de disabled
  const disabledFeature = "bg-gray-200 text-gray-400 cursor-not-allowed opacity-70"; // em desenvolvimento
  const disabledContext = "bg-gray-300 text-gray-500 cursor-not-allowed opacity-80"; // indisponível agora

  const Divider = () => <div className="w-full h-px bg-sidebar-border my-2" />;

  const ToolBtn = ({
    isActive,
    disabled,
    featureOff,
    title,
    onClick,
    children,
  }: {
    isActive?: boolean;
    disabled?: boolean;
    featureOff?: boolean;
    title: string;
    onClick?: () => void;
    children: React.ReactNode;
  }) => {
    const classes = disabled
      ? (featureOff ? disabledFeature : disabledContext)
      : (isActive ? activeClasses : normalClasses);
    return (
      <button
        onClick={!disabled ? onClick : undefined}
        disabled={disabled}
        className={`${buttonBase} ${classes}`}
        title={title}
        aria-disabled={disabled}
      >
        {children}
      </button>
    );
  };

  return (
    <Sidebar className="w-24 border-r shrink-0" collapsible="none">
      {/* Wrapper 'sticky' para ficar fixo abaixo do header (h-12 => 3rem) */}
      <div className="sticky top-12 h-[calc(100vh-3rem)]">
        <SidebarContent
          className="
            h-full overflow-y-auto
            px-0 pt-[18.5px] pb-3   /* sem padding horizontal, mantém topo e base */
            flex flex-col justify-start
            space-y-3               /* espaço vertical entre grupos */
          "
        >
          {/* Undo/Redo (mantidos no topo) */}
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-x-1.5 gap-y-1.5 w-max mx-auto justify-items-center">
              {group1.map((action) => {
                const IconComponent = action.icon;
                return (
                  <ToolBtn
                    key={action.action}
                    disabled={action.disabled}
                    title={action.disabled ? `${action.label} (indisponível no momento)` : action.label}
                    onClick={action.onClick}
                  >
                    <IconComponent size={16} />
                  </ToolBtn>
                );
              })}
            </div>
            <Divider />
          </div>

          {/* Selecionar / Texto */}
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-x-1.5 gap-y-1.5 w-max mx-auto justify-items-center">
              {group2.map((tool) => {
                const IconComponent = tool.icon;
                const isActive = selectedTool === tool.tool;
                return (
                  <ToolBtn
                    key={tool.tool}
                    isActive={isActive}
                    title={tool.label}
                    onClick={() => onToolChange(tool.tool)}
                  >
                    <IconComponent size={16} />
                  </ToolBtn>
                );
              })}
            </div>
          </div>

          {/* Lápis / Preenchimento */}
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-x-1.5 gap-y-1.5 w-max mx-auto justify-items-center">
              {group3.map((tool) => {
                const IconComponent = tool.icon;
                const isActive = selectedTool === tool.tool;
                return (
                  <ToolBtn
                    key={tool.tool}
                    isActive={isActive}
                    title={tool.label}
                    onClick={() => onToolChange(tool.tool)}
                  >
                    <IconComponent size={16} />
                  </ToolBtn>
                );
              })}
            </div>
          </div>

          {/* Borracha */}
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-x-1.5 gap-y-1.5 w-max mx-auto justify-items-center">
              {group4.map((tool) => {
                const IconComponent = tool.icon;
                const isActive = selectedTool === tool.tool;
                return (
                  <ToolBtn
                    key={tool.tool}
                    isActive={isActive}
                    title={tool.label}
                    onClick={() => onToolChange(tool.tool)}
                  >
                    <IconComponent size={16} />
                  </ToolBtn>
                );
              })}
              <div />
            </div>
            <Divider />
          </div>

          {/* Formas (em desenvolvimento) */}
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-x-1.5 gap-y-1.5 w-max mx-auto justify-items-center">
              {group5.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <ToolBtn
                    key={tool.tool}
                    disabled
                    featureOff
                    title={`${tool.label} (em breve)`}
                  >
                    <IconComponent size={16} />
                  </ToolBtn>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-x-1.5 gap-y-1.5 w-max mx-auto justify-items-center">
              {group6.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <ToolBtn
                    key={tool.tool}
                    disabled
                    featureOff
                    title={`${tool.label} (em breve)`}
                  >
                    <IconComponent size={16} />
                  </ToolBtn>
                );
              })}
            </div>
            <Divider />
          </div>

          {/* Importar imagem / Copiar */}
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-x-1.5 gap-y-1.5 w-max mx-auto justify-items-center">
              <ToolBtn
                isActive={selectedTool === 'image_import'}
                title="Importar imagem"
                onClick={() => onToolChange('image_import' as Tool)}
              >
                <Upload size={16} />
              </ToolBtn>

              <ToolBtn
                disabled={!hasSelection}
                title={hasSelection ? 'Copiar' : 'Copiar (indisponível)'}
                onClick={onCopy}
              >
                <Copy size={16} />
              </ToolBtn>
            </div>
          </div>

          {/* Recortar / Colar */}
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-x-1.5 gap-y-1.5 w-max mx-auto justify-items-center">
              <ToolBtn
                disabled={!hasSelection}
                title={hasSelection ? 'Recortar' : 'Recortar (indisponível)'}
                onClick={onCut}
              >
                <Scissors size={16} />
              </ToolBtn>

              <ToolBtn
                disabled={!hasClipboard}
                title={hasClipboard ? 'Colar' : 'Colar (indisponível)'}
                onClick={onPaste}
              >
                <Clipboard size={16} />
              </ToolBtn>
            </div>
            <Divider />
          </div>

          {/* Ajuda */}
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-x-1.5 gap-y-1.5 w-max mx-auto justify-items-center">
              <ToolBtn title="Ajuda" onClick={onToggleHelp}>
                <HelpCircle size={16} />
              </ToolBtn>
              <div />
            </div>
          </div>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
