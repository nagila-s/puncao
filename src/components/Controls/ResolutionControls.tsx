import { Resolution } from '@/types/braille';

interface ResolutionControlsProps {
  resolution: Resolution;
  onResolutionChange: (resolution: Resolution) => void;
}

const presetResolutions: Resolution[] = [
  { width: 20, height: 10, label: '20x10' },
  { width: 28, height: 15, label: '28x15' },
  { width: 34, height: 28, label: '34x28 (padrão)' }, // 34 caracteres x 28 linhas
  { width: 35, height: 25, label: '35x25' },
  { width: 40, height: 30, label: '40x30' },
];

export const ResolutionControls = ({ resolution, onResolutionChange }: ResolutionControlsProps) => {
  const handlePresetChange = (preset: Resolution) => {
    onResolutionChange(preset);
  };

  const handleCustomChange = (field: 'width' | 'height', value: number) => {
    const newResolution = {
      ...resolution,
      [field]: Math.max(1, Math.min(100, value)), // limite entre 1 e 100
      label: 'Personalizado'
    };
    onResolutionChange(newResolution);
  };

  return (
    <div className="flex items-center gap-4 bg-card border border-border p-2 rounded">
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground whitespace-nowrap">
          Resolução:
        </label>
        <select
          value={presetResolutions.find(p => 
            p.width === resolution.width && p.height === resolution.height
          )?.label || 'Personalizado'}
          onChange={(e) => {
            const preset = presetResolutions.find(p => p.label === e.target.value);
            if (preset) {
              handlePresetChange(preset);
            }
          }}
          className="text-sm bg-background border border-border px-2 py-1 
                   focus:outline-none focus:ring-2 focus:ring-ring min-w-24"
        >
          {presetResolutions.map((preset) => (
            <option key={preset.label} value={preset.label}>
              {preset.label}
            </option>
          ))}
          {!presetResolutions.find(p => 
            p.width === resolution.width && p.height === resolution.height
          ) && (
            <option value="Personalizado">Personalizado</option>
          )}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">C:</label> {/* C = Caracteres */}
        <input
          type="number"
          min="1"
          max="100"
          value={resolution.width}
          onChange={(e) => handleCustomChange('width', Number(e.target.value))}
          className="w-16 text-sm bg-background border border-border px-2 py-1 
                   focus:outline-none focus:ring-2 focus:ring-ring"
        />
        
        <span className="text-muted-foreground">×</span>
        
        <label className="text-sm text-muted-foreground">L:</label> {/* L = Linhas */}
        <input
          type="number"
          min="1"
          max="100"
          value={resolution.height}
          onChange={(e) => handleCustomChange('height', Number(e.target.value))}
          className="w-16 text-sm bg-background border border-border px-2 py-1 
                   focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="text-xs text-muted-foreground">
        {resolution.width * resolution.height} células
      </div>
    </div>
  );
};