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
import { EraserUnit, Tool } from '@/types/braille';
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { EraserOptions } from './EraserOptions';
import { clampEraserSize } from '@/lib/eraserBrush';

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
  eraserUnit?: EraserUnit;
  eraserSize?: number;
  onEraserUnitChange?: (unit: EraserUnit) => void;
  onEraserSizeChange?: (size: number) => void;
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
  hasClipboard,
  eraserUnit = 'dots',
  eraserSize = 1,
  onEraserUnitChange,
  onEraserSizeChange,
}: AppSidebarProps) {
  const group1 = [
    { action: 'undo', icon: Undo2, label: 'Desfazer', disabled: !canUndo, onClick: onUndo },
    { action: 'redo', icon: Redo2, label: 'Refazer', disabled: !canRedo, onClick: onRedo },
  ];

  const ferramentas = [
    { tool: 'select' as Tool, icon: MousePointer2, label: 'Selecionar' },
    { tool: 'text' as Tool, icon: Type, label: 'Texto' },
    { tool: 'pencil' as Tool, icon: Pencil, label: 'Lápis' },
    { tool: 'fill' as Tool, icon: PaintBucket, label: 'Preenchimento' },
    { tool: 'eraser' as Tool, icon: Eraser, label: 'Borracha' },
    { tool: 'image_import' as Tool, icon: Upload, label: 'Importar imagem' },
  ];

  const formas = [
    { tool: 'rectangle' as Tool, icon: Square, label: 'Retângulo' },
    { tool: 'triangle' as Tool, icon: Triangle, label: 'Triângulo', disabled: true },
    { tool: 'circle' as Tool, icon: Circle, label: 'Círculo' },
    { tool: 'line' as Tool, icon: Minus, label: 'Linha' },
  ];

  const buttonBase =
    "w-11 h-11 flex items-center justify-center border-2 border-sidebar-border transition-all";
  const toolGrid = "grid grid-cols-2 gap-x-2.5 gap-y-2.5 w-max mx-auto justify-items-center";
  const activeClasses = "bg-yellow-400 text-black";
  const normalClasses = "bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent";

  // dois tons de disabled
  const disabledFeature = "bg-gray-200 text-gray-400 cursor-not-allowed opacity-70"; // em desenvolvimento
  const disabledContext = "bg-gray-300 text-gray-500 cursor-not-allowed opacity-80"; // indisponível agora

  const Divider = () => <div className="w-full h-px bg-sidebar-border my-2" />;

  const GroupLabel = ({ children }: { children: string }) => (
    <p className="text-[10px] leading-tight text-center text-sidebar-foreground/70 font-medium px-0.5 whitespace-nowrap">
      {children}
    </p>
  );

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
    <Sidebar className="w-28 border-r shrink-0" collapsible="none">
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
            <div className={toolGrid}>
              {group1.map((action) => {
                const IconComponent = action.icon;
                return (
                  <ToolBtn
                    key={action.action}
                    disabled={action.disabled}
                    title={action.disabled ? `${action.label} (indisponível no momento)` : action.label}
                    onClick={action.onClick}
                  >
                    <IconComponent size={18} />
                  </ToolBtn>
                );
              })}
            </div>
            <Divider />
          </div>

          {/* Ferramentas */}
          <div className="space-y-1">
            <div className={toolGrid}>
              {ferramentas.map((tool) => {
                const IconComponent = tool.icon;
                const isActive = selectedTool === tool.tool;
                return (
                  <ToolBtn
                    key={tool.tool}
                    isActive={isActive}
                    title={tool.label}
                    onClick={() => onToolChange(tool.tool)}
                  >
                    <IconComponent size={18} />
                  </ToolBtn>
                );
              })}
            </div>
            {selectedTool === 'eraser' && onEraserUnitChange && onEraserSizeChange && (
              <EraserOptions
                unit={eraserUnit}
                size={eraserSize}
                onUnitChange={onEraserUnitChange}
                onSizeChange={(next) => onEraserSizeChange(clampEraserSize(next))}
              />
            )}
            <GroupLabel>Ferramentas</GroupLabel>
            <Divider />
          </div>

          {/* Formas */}
          <div className="space-y-1">
            <div className={toolGrid}>
              {formas.map((tool) => {
                const IconComponent = tool.icon;
                const isActive = !tool.disabled && selectedTool === tool.tool;
                return (
                  <ToolBtn
                    key={tool.tool}
                    isActive={isActive}
                    disabled={tool.disabled}
                    featureOff={tool.disabled}
                    title={tool.disabled ? `${tool.label} (em desenvolvimento)` : tool.label}
                    onClick={tool.disabled ? undefined : () => onToolChange(tool.tool)}
                  >
                    <IconComponent size={18} />
                  </ToolBtn>
                );
              })}
            </div>
            <GroupLabel>Formas</GroupLabel>
            <Divider />
          </div>

          {/* Transferência */}
          <div className="space-y-1">
            <div className={toolGrid}>
              <ToolBtn
                disabled={!hasSelection}
                title={hasSelection ? 'Copiar' : 'Copiar (indisponível)'}
                onClick={onCopy}
              >
                <Copy size={18} />
              </ToolBtn>

              <ToolBtn
                disabled={!hasSelection}
                title={hasSelection ? 'Recortar' : 'Recortar (indisponível)'}
                onClick={onCut}
              >
                <Scissors size={18} />
              </ToolBtn>

              <ToolBtn
                disabled={!hasClipboard}
                title={hasClipboard ? 'Colar' : 'Colar (indisponível)'}
                onClick={onPaste}
              >
                <Clipboard size={18} />
              </ToolBtn>
              <div />
            </div>
            <GroupLabel>Transferência</GroupLabel>
            <Divider />
          </div>

          {/* Ajuda */}
          <div className="space-y-1">
            <div className={toolGrid}>
              <ToolBtn title="Ajuda" onClick={onToggleHelp}>
                <HelpCircle size={18} />
              </ToolBtn>
              <div />
            </div>
          </div>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
