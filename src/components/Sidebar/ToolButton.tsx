import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Tool } from '@/types/braille';

interface ToolButtonProps {
  tool: Tool;
  isActive: boolean;
  icon: ReactNode;
  label: string;
  onClick: (tool: Tool) => void;
  disabled?: boolean;
}

export const ToolButton = ({ 
  tool, 
  isActive, 
  icon, 
  label, 
  onClick, 
  disabled = false 
}: ToolButtonProps) => {
  return (
    <button
      onClick={() => onClick(tool)}
      disabled={disabled}
      className={cn(
        "w-10 h-10 flex items-center justify-center border-2 transition-all",
        "hover:bg-sidebar-accent focus:outline-none focus:ring-2 focus:ring-sidebar-ring",
        isActive 
          ? "bg-sidebar-accent border-sidebar-ring text-sidebar-accent-foreground" 
          : "bg-sidebar border-sidebar-border text-sidebar-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );
};