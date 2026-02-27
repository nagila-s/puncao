import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BrailleGrid } from '@/types/braille';
import {
  loadImageToImageData,
  toGrayscale,
  contrastOrEqualize,
  binaryThreshold,
  type ContrastMode,
} from '@/lib/imagePipeline';
import {
  edgesToBrailleGrid,
  type EdgesToBrailleParams,
} from '@/lib/edgesToBrailleGrid';
import { CELL_WIDTH, CELL_HEIGHT } from '@/lib/constants';

const ACCEPT_IMAGES = '.png,.jpg,.jpeg,.webp';

export interface ImageImportParams {
  contrastMode: ContrastMode;
  contrastIntensity: number;
  /** Limiar 0-255: pixels mais escuros viram contorno. */
  thresholdBinary: number;
  dotRadius: number;
  thresholdDot: number;
  /** true = tratar claro como contorno (para desenho claro no escuro) */
  invertContour: boolean;
}

const DEFAULT_PARAMS: ImageImportParams = {
  contrastMode: 'contrast',
  contrastIntensity: 1,
  thresholdBinary: 128,
  invertContour: false,
  dotRadius: 2.5,
  thresholdDot: 0.1,
};

interface ImageImportModalProps {
  gridWidth: number;
  gridHeight: number;
  onApply: (grid: BrailleGrid) => void;
  onClose: () => void;
}

function runPipeline(
  imageData: ImageData,
  params: ImageImportParams
): Uint8Array {
  const w = imageData.width;
  const h = imageData.height;
  let gray = toGrayscale(imageData);
  gray = contrastOrEqualize(gray, w, h, {
    mode: params.contrastMode,
    intensity: params.contrastIntensity,
  });
  return binaryThreshold(gray, w, h, params.thresholdBinary, !params.invertContour);
}

const PREVIEW_MAX = 280;

export function ImageImportModal({
  gridWidth,
  gridHeight,
  onApply,
  onClose,
}: ImageImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(null);
  const [params, setParams] = useState<ImageImportParams>(DEFAULT_PARAMS);
  const [debouncedParams, setDebouncedParams] = useState<ImageImportParams>(DEFAULT_PARAMS);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedParams(params), 250);
    return () => clearTimeout(t);
  }, [params]);

  const loadFile = useCallback(async (file: File) => {
    try {
      const { imageData: data, width, height } = await loadImageToImageData(file);
      setImageData(data);
      setImageSize({ w: width, h: height });
    } catch {
      setImageData(null);
      setImageSize(null);
    }
  }, []);

  const edgesBinary = useMemo(() => {
    if (!imageData) return null;
    return runPipeline(imageData, debouncedParams);
  }, [imageData, debouncedParams]);

  const previewGrid = useMemo((): BrailleGrid | null => {
    if (!edgesBinary || !imageSize) return null;
    return edgesToBrailleGrid(
      edgesBinary,
      imageSize.w,
      imageSize.h,
      gridWidth,
      gridHeight,
      CELL_WIDTH,
      CELL_HEIGHT,
      { dotRadius: debouncedParams.dotRadius, thresholdDot: debouncedParams.thresholdDot }
    );
  }, [edgesBinary, imageSize, gridWidth, gridHeight, debouncedParams.dotRadius, debouncedParams.thresholdDot]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = '';
  };

  const handleApply = useCallback(() => {
    if (!imageData || !imageSize) return;
    const finalBinary = runPipeline(imageData, params);
    const finalGrid = edgesToBrailleGrid(
      finalBinary,
      imageSize.w,
      imageSize.h,
      gridWidth,
      gridHeight,
      CELL_WIDTH,
      CELL_HEIGHT,
      { dotRadius: params.dotRadius, thresholdDot: params.thresholdDot }
    );
    onApply(JSON.parse(JSON.stringify(finalGrid)));
    onClose();
  }, [imageData, imageSize, params, gridWidth, gridHeight, onApply, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const setParam = useCallback(<K extends keyof ImageImportParams>(
    key: K,
    value: ImageImportParams[K]
  ) => {
    setParams((p) => ({ ...p, [key]: value }));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Enter' && imageData && previewGrid) {
        e.preventDefault();
        handleApply();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [imageData, previewGrid, onClose, handleApply]);

  const scale = imageSize
    ? Math.min(PREVIEW_MAX / imageSize.w, PREVIEW_MAX / imageSize.h, 1)
    : 1;
  const previewW = imageSize ? Math.round(imageSize.w * scale) : 0;
  const previewH = imageSize ? Math.round(imageSize.h * scale) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="bg-card border border-border rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-import-title"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="image-import-title" className="text-xl font-bold">
            Importar imagem
          </h2>
          <Button variant="ghost" size="sm" onClick={handleCancel} aria-label="Fechar">
            <X size={16} />
          </Button>
        </div>

        {!imageData ? (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium block mb-2">Escolher arquivo (PNG, JPG, WebP)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_IMAGES}
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground"
              />
            </label>
            <div className="flex gap-2">
              <Button onClick={handleCancel}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Original</p>
                <canvas
                  width={previewW}
                  height={previewH}
                  className="border border-border rounded bg-white max-w-full"
                  ref={(el) => {
                    if (!el || !imageData) return;
                    const ctx = el.getContext('2d');
                    if (!ctx) return;
                    const tmp = document.createElement('canvas');
                    tmp.width = imageData.width;
                    tmp.height = imageData.height;
                    const tctx = tmp.getContext('2d');
                    if (!tctx) return;
                    tctx.putImageData(imageData, 0, 0);
                    ctx.drawImage(tmp, 0, 0, imageData.width, imageData.height, 0, 0, previewW, previewH);
                  }}
                  style={{ width: previewW, height: previewH, imageRendering: 'pixelated' }}
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Preview de pontos</p>
                {previewGrid ? (
                  <BraillePreviewCanvas grid={previewGrid} maxSize={PREVIEW_MAX} />
                ) : (
                  <div className="border border-border rounded bg-muted/30 h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                    Sem preview
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">Ajustes rápidos</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <label className="flex flex-col gap-1">
                  <span title="Melhora a separacao entre fundo e desenho.">Contraste</span>
                  <div className="flex items-center gap-2">
                    <select
                      title="Escolha o tipo de ajuste de contraste."
                      value={params.contrastMode}
                      onChange={(e) => setParam('contrastMode', e.target.value as ContrastMode)}
                      className="rounded border px-2 py-1 flex-1"
                    >
                      <option value="contrast">Contraste</option>
                      <option value="equalize">Equalizar</option>
                    </select>
                    <input
                      title="Intensidade do contraste aplicado."
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={params.contrastIntensity}
                      onChange={(e) => setParam('contrastIntensity', parseFloat(e.target.value))}
                      className="w-20"
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-1">
                  <span title="Define o que vira contorno: valores menores pegam mais detalhes escuros.">
                    Limiar (0-255)
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={params.thresholdBinary}
                    onChange={(e) => setParam('thresholdBinary', parseInt(e.target.value, 10))}
                  />
                  <span className="text-muted-foreground text-xs">Atual: {params.thresholdBinary}</span>
                </label>
                <label className="flex flex-col gap-1">
                  <span title="Controla a espessura visual da linha no resultado em pontos.">
                    Espessura da linha
                  </span>
                  <input
                    title="Deslize para afinar ou engrossar."
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={params.dotRadius}
                    onChange={(e) => setParam('dotRadius', parseFloat(e.target.value))}
                  />
                  <span className="text-muted-foreground text-xs">Atual: {params.dotRadius.toFixed(1)}</span>
                </label>
                <label
                  className="flex items-center gap-2 cursor-pointer"
                  title="Marca quando o desenho claro deve virar contorno, em vez do escuro."
                >
                  <input
                    type="checkbox"
                    checked={params.invertContour}
                    onChange={(e) => setParam('invertContour', e.target.checked)}
                  />
                  <span>Inverter contorno</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleApply} disabled={!previewGrid}>
                Aplicar
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setImageData(null);
                  setImageSize(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                Trocar imagem
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const CELL_W = 20;
const CELL_H = 30;
const DOT_R = 2;

function BraillePreviewCanvas({
  grid,
  maxSize,
}: {
  grid: BrailleGrid;
  maxSize: number;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const scale = Math.min(
    maxSize / (grid.width * CELL_W),
    maxSize / (grid.height * CELL_H),
    1
  );
  const w = Math.round(grid.width * CELL_W * scale);
  const h = Math.round(grid.height * CELL_H * scale);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#000';
    for (let cy = 0; cy < grid.height; cy++) {
      for (let cx = 0; cx < grid.width; cx++) {
        const cell = grid.cells[cy][cx];
        const baseX = cx * CELL_W * scale;
        const baseY = cy * CELL_H * scale;
        const positions = [
          [0.3, 0.2], [0.3, 0.5], [0.3, 0.8],
          [0.7, 0.2], [0.7, 0.5], [0.7, 0.8],
        ];
        positions.forEach(([rx, ry], i) => {
          if (!cell.dots.includes(i + 1)) return;
          const px = baseX + rx * CELL_W * scale;
          const py = baseY + ry * CELL_H * scale;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.5, DOT_R * scale), 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
  }, [grid, w, h, scale]);

  return (
    <canvas
      ref={canvasRef}
      width={w}
      height={h}
      className="border border-border rounded bg-white"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
