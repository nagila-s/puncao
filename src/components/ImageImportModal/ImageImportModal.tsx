import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BrailleGrid } from '@/types/braille';
import {
  loadImageToImageData,
  toGrayscale,
  contrastOrEqualize,
  blur,
  canny,
  binaryThreshold,
  morphology,
  skeletonize,
  type ContrastMode,
  type MorphologyMode,
} from '@/lib/imagePipeline';
import {
  edgesToBrailleGrid,
  CELL_WIDTH,
  CELL_HEIGHT,
  type EdgesToBrailleParams,
} from '@/lib/edgesToBrailleGrid';

const ACCEPT_IMAGES = '.png,.jpg,.jpeg,.webp';

export type PipelineMode = 'drawing' | 'edges';

export interface ImageImportParams {
  mode: PipelineMode;
  contrastMode: ContrastMode;
  contrastIntensity: number;
  blurRadius: number;
  /** Limiar 0–255 para modo "Desenho": pixels mais escuros viram contorno. */
  thresholdBinary: number;
  cannyLow: number;
  cannyHigh: number;
  morphologyMode: MorphologyMode;
  morphologyIterations: number;
  skeletonizeOn: boolean;
  dotRadius: number;
  thresholdDot: number;
  /** true = tratar claro como contorno (para desenho claro no escuro) */
  invertContour: boolean;
}

const DEFAULT_PARAMS: ImageImportParams = {
  mode: 'drawing',
  contrastMode: 'contrast',
  contrastIntensity: 1,
  blurRadius: 0,
  thresholdBinary: 128,
  invertContour: false,
  cannyLow: 25,
  cannyHigh: 75,
  morphologyMode: 'erode',
  morphologyIterations: 0,
  skeletonizeOn: false,
  dotRadius: 2.5,
  thresholdDot: 0.1,
};

const PRESETS: Record<string, Partial<ImageImportParams>> = {
  'Desenho simples': {
    mode: 'drawing',
    thresholdBinary: 128,
    contrastIntensity: 1,
    blurRadius: 0,
    morphologyIterations: 0,
    skeletonizeOn: false,
    dotRadius: 2.5,
    thresholdDot: 0.1,
  },
  'Linhas finas': {
    mode: 'edges',
    contrastIntensity: 1.5,
    blurRadius: 0,
    cannyLow: 15,
    cannyHigh: 90,
    morphologyIterations: 0,
    skeletonizeOn: true,
    dotRadius: 0.5,
    thresholdDot: 0.25,
  },
  'Linhas grossas': {
    mode: 'edges',
    contrastIntensity: 1,
    blurRadius: 2,
    cannyLow: 35,
    cannyHigh: 65,
    morphologyMode: 'dilate',
    morphologyIterations: 1,
    skeletonizeOn: false,
    dotRadius: 2.5,
    thresholdDot: 0.5,
  },
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

  if (params.mode === 'drawing') {
    // Modo desenho: preto e branco por limiar. Por padrão escuro = contorno; invertContour = claro = contorno
    gray = blur(gray, w, h, params.blurRadius);
    gray = binaryThreshold(gray, w, h, params.thresholdBinary, !params.invertContour);
  } else {
    // Modo bordas: Canny
    gray = blur(gray, w, h, params.blurRadius);
    gray = canny(gray, w, h, params.cannyLow, params.cannyHigh);
  }

  gray = morphology(
    gray,
    w,
    h,
    params.morphologyMode,
    params.morphologyIterations
  );
  if (params.skeletonizeOn) gray = skeletonize(gray, w, h);
  return gray;
}

/** Apenas grayscale + contraste, para exibir "Preto e branco". */
function toGrayPreview(
  imageData: ImageData,
  params: Pick<ImageImportParams, 'contrastMode' | 'contrastIntensity'>
): Uint8Array {
  const w = imageData.width;
  const h = imageData.height;
  let gray = toGrayscale(imageData);
  gray = contrastOrEqualize(gray, w, h, {
    mode: params.contrastMode,
    intensity: params.contrastIntensity,
  });
  return gray;
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

  const grayPreview = useMemo(() => {
    if (!imageData) return null;
    return toGrayPreview(imageData, debouncedParams);
  }, [imageData, debouncedParams.contrastMode, debouncedParams.contrastIntensity]);

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

  const resetParams = useCallback(() => {
    setParams({ ...DEFAULT_PARAMS });
  }, []);

  const applyPreset = useCallback((name: string) => {
    const preset = PRESETS[name];
    if (preset) setParams((p) => ({ ...p, ...preset }));
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
            <div className="flex flex-wrap gap-4">
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
                <p className="text-sm font-medium mb-2">Preto e branco</p>
                <p className="text-xs text-muted-foreground mb-1">Claro no original continua claro aqui. Evite &quot;Equalizar&quot; se o fundo ficar escuro.</p>
                <canvas
                  width={previewW}
                  height={previewH}
                  className="border border-border rounded bg-white max-w-full"
                  ref={(el) => {
                    if (!el || !grayPreview || !imageSize) return;
                    const ctx = el.getContext('2d');
                    if (!ctx) return;
                    const imgData = ctx.createImageData(previewW, previewH);
                    const sw = imageSize.w;
                    const sh = imageSize.h;
                    for (let y = 0; y < previewH; y++) {
                      for (let x = 0; x < previewW; x++) {
                        const sx = Math.floor((x / previewW) * sw);
                        const sy = Math.floor((y / previewH) * sh);
                        const v = grayPreview[sy * sw + sx];
                        const i = (y * previewW + x) * 4;
                        imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = v;
                        imgData.data[i + 3] = 255;
                      }
                    }
                    ctx.putImageData(imgData, 0, 0);
                  }}
                  style={{ width: previewW, height: previewH, imageRendering: 'pixelated' }}
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Contorno final</p>
                <canvas
                  width={previewW}
                  height={previewH}
                  className="border border-border rounded bg-white max-w-full"
                  ref={(el) => {
                    if (!el || !edgesBinary || !imageSize) return;
                    const ctx = el.getContext('2d');
                    if (!ctx) return;
                    const imgData = ctx.createImageData(previewW, previewH);
                    const sw = imageSize.w;
                    const sh = imageSize.h;
                    for (let y = 0; y < previewH; y++) {
                      for (let x = 0; x < previewW; x++) {
                        const sx = Math.floor((x / previewW) * sw);
                        const sy = Math.floor((y / previewH) * sh);
                        const isContour = edgesBinary[sy * sw + sx] > 127;
                        const i = (y * previewW + x) * 4;
                        const display = isContour ? 0 : 255;
                        imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = display;
                        imgData.data[i + 3] = 255;
                      }
                    }
                    ctx.putImageData(imgData, 0, 0);
                  }}
                  style={{ width: previewW, height: previewH, imageRendering: 'pixelated' }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Contorno final: preto = o que vira pontos Braille (igual ao desenho original).</p>

            {previewGrid && (
              <div>
                <p className="text-sm font-medium mb-2">Preview em Braille (miniatura)</p>
                <BraillePreviewCanvas grid={previewGrid} maxSize={200} />
              </div>
            )}

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">Ajustes (apenas preview, com atraso de 250ms)</p>
              <div className="flex flex-wrap gap-4 items-center text-sm border-b pb-3 mb-3">
                <span className="font-medium">Modo:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pipelineMode"
                    checked={params.mode === 'drawing'}
                    onChange={() => setParam('mode', 'drawing')}
                  />
                  Desenho (preto e branco) — limiar
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pipelineMode"
                    checked={params.mode === 'edges'}
                    onChange={() => setParam('mode', 'edges')}
                  />
                  Bordas (Canny)
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {params.mode === 'drawing' && (
                  <>
                    <label className="flex flex-col gap-1">
                      <span>Limiar preto/branco (0–255)</span>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={params.thresholdBinary}
                        onChange={(e) => setParam('thresholdBinary', parseInt(e.target.value, 10))}
                      />
                      <span className="text-muted-foreground text-xs">Abaixo deste valor = contorno (preto)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={params.invertContour}
                        onChange={(e) => setParam('invertContour', e.target.checked)}
                      />
                      <span>Inverter contorno (claro = contorno)</span>
                    </label>
                  </>
                )}
                <label className="flex flex-col gap-1">
                  <span>Contraste / Equalizar</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={params.contrastMode}
                      onChange={(e) => setParam('contrastMode', e.target.value as ContrastMode)}
                      className="rounded border px-2 py-1 flex-1"
                    >
                      <option value="contrast">Contraste</option>
                      <option value="equalize">Equalizar</option>
                    </select>
                    <input
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
                  <span>Blur (0–5)</span>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={params.blurRadius}
                    onChange={(e) => setParam('blurRadius', parseFloat(e.target.value))}
                  />
                </label>
                {params.mode === 'edges' && (
                  <label className="flex flex-col gap-1">
                    <span>Canny baixo / alto</span>
                    <div className="flex gap-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={params.cannyLow}
                        onChange={(e) => setParam('cannyLow', parseInt(e.target.value, 10))}
                        className="flex-1"
                      />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={params.cannyHigh}
                        onChange={(e) => setParam('cannyHigh', parseInt(e.target.value, 10))}
                        className="flex-1"
                      />
                    </div>
                  </label>
                )}
                <label className="flex flex-col gap-1">
                  <span>Morfologia</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={params.morphologyMode}
                      onChange={(e) => setParam('morphologyMode', e.target.value as MorphologyMode)}
                      className="rounded border px-2 py-1"
                    >
                      <option value="erode">Erodir</option>
                      <option value="dilate">Dilatar</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={params.morphologyIterations}
                      onChange={(e) => setParam('morphologyIterations', parseInt(e.target.value, 10) || 0)}
                      className="w-14 rounded border px-1 py-1"
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-1">
                  <span>Skeletonize</span>
                  <input
                    type="checkbox"
                    checked={params.skeletonizeOn}
                    onChange={(e) => setParam('skeletonizeOn', e.target.checked)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Raio do ponto (px)</span>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={params.dotRadius}
                    onChange={(e) => setParam('dotRadius', parseFloat(e.target.value))}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Threshold ponto (0–1)</span>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={params.thresholdDot}
                    onChange={(e) => setParam('thresholdDot', parseFloat(e.target.value))}
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-sm text-muted-foreground mr-2">Presets:</span>
                {Object.keys(PRESETS).map((name) => (
                  <Button
                    key={name}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(name)}
                  >
                    {name}
                  </Button>
                ))}
                <Button variant="ghost" size="sm" onClick={resetParams}>
                  Resetar ajustes
                </Button>
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
