import { Minus, Plus, RotateCcw } from 'lucide-react';
import { ZoomLevel } from '@/types/braille';

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onZoomReset: () => void;
}

const zoomLevels: ZoomLevel[] = [
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1, label: '100%' },
  { value: 1.25, label: '125%' },
  { value: 1.5, label: '150%' },
  { value: 2, label: '200%' },
  { value: 3, label: '300%' },
  { value: 4, label: '400%' }
];

export const ZoomControls = ({ zoom, onZoomChange, onZoomReset }: ZoomControlsProps) => {
  const currentZoomIndex = zoomLevels.findIndex(level => level.value === zoom);
  const canZoomOut = currentZoomIndex > 0;
  const canZoomIn = currentZoomIndex < zoomLevels.length - 1;

  const handleZoomOut = () => {
    if (canZoomOut) {
      onZoomChange(zoomLevels[currentZoomIndex - 1].value);
    }
  };

  const handleZoomIn = () => {
    if (canZoomIn) {
      onZoomChange(zoomLevels[currentZoomIndex + 1].value);
    }
  };

  const currentZoomLabel = zoomLevels.find(level => level.value === zoom)?.label || `${Math.round(zoom * 100)}%`;

  return (
    <div className="flex items-center gap-2 bg-card border border-border p-2 rounded">
      <button
        onClick={handleZoomOut}
        disabled={!canZoomOut}
        className="w-8 h-8 flex items-center justify-center border border-border 
                 bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed
                 transition-colors"
        title="Diminuir zoom"
      >
        <Minus size={14} />
      </button>

      <select
        value={zoom}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        className="min-w-16 text-sm bg-background border border-border px-2 py-1 
                 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {zoomLevels.map((level) => (
          <option key={level.value} value={level.value}>
            {level.label}
          </option>
        ))}
      </select>

      <button
        onClick={handleZoomIn}
        disabled={!canZoomIn}
        className="w-8 h-8 flex items-center justify-center border border-border 
                 bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed
                 transition-colors"
        title="Aumentar zoom"
      >
        <Plus size={14} />
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      <button
        onClick={onZoomReset}
        className="w-8 h-8 flex items-center justify-center border border-border 
                 bg-background hover:bg-muted transition-colors"
        title="Resetar zoom (100%)"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
};