import { Minus, Plus } from 'lucide-react';
import { EraserUnit } from '@/types/braille';
import { ERASER_SIZE_MAX, ERASER_SIZE_MIN } from '@/lib/eraserBrush';

interface EraserOptionsProps {
  unit: EraserUnit;
  size: number;
  onUnitChange: (unit: EraserUnit) => void;
  onSizeChange: (size: number) => void;
}

export function EraserOptions({ unit, size, onUnitChange, onSizeChange }: EraserOptionsProps) {
  const unitBtn =
    "h-7 px-1 text-[9px] font-medium border-2 border-sidebar-border transition-all";
  const active = "bg-yellow-400 text-black";
  const idle = "bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent";
  const stepper =
    "w-7 h-7 flex items-center justify-center border-2 border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="px-1.5 space-y-1.5">
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          className={`${unitBtn} ${unit === 'dots' ? active : idle}`}
          onClick={() => onUnitChange('dots')}
          title="Apagar pontos individuais"
        >
          Pontos
        </button>
        <button
          type="button"
          className={`${unitBtn} ${unit === 'cells' ? active : idle}`}
          onClick={() => onUnitChange('cells')}
          title="Apagar células inteiras"
        >
          Células
        </button>
      </div>
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          className={stepper}
          onClick={() => onSizeChange(size - 1)}
          disabled={size <= ERASER_SIZE_MIN}
          title="Diminuir borracha"
        >
          <Minus size={12} />
        </button>
        <span className="w-5 text-center text-xs font-semibold tabular-nums" title="Tamanho da borracha">
          {size}
        </span>
        <button
          type="button"
          className={stepper}
          onClick={() => onSizeChange(size + 1)}
          disabled={size >= ERASER_SIZE_MAX}
          title="Aumentar borracha"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
