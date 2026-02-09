/**
 * Pipeline de processamento de imagem para importação Braille.
 * Funções puras: recebem e devolvem buffers (typed arrays), sem React.
 * Todas assumem gray ou binary como Uint8Array em ordem row-major, size = width * height.
 */

const MAX_PROCESSING_SIZE = 400;

/** Redimensiona ImageData para no máximo maxSize no maior lado (mantém proporção). Muito mais rápido que processar imagem grande. */
export function downscaleImageData(
  imageData: ImageData,
  maxSize: number = MAX_PROCESSING_SIZE
): ImageData {
  const { width: w, height: h } = imageData;
  if (w <= maxSize && h <= maxSize) return imageData;
  const scale = maxSize / Math.max(w, h);
  const nw = Math.max(1, Math.round(w * scale));
  const nh = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = nw;
  canvas.height = nh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageData;
  const src = document.createElement('canvas');
  src.width = w;
  src.height = h;
  src.getContext('2d')!.putImageData(imageData, 0, 0);
  ctx.drawImage(src, 0, 0, w, h, 0, 0, nw, nh);
  return ctx.getImageData(0, 0, nw, nh);
}

/** Carrega um arquivo de imagem e retorna ImageData redimensionada (máx. 400px) para processamento rápido. */
export function loadImageToImageData(file: File): Promise<{ imageData: ImageData; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2d not available'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      imageData = downscaleImageData(imageData, MAX_PROCESSING_SIZE);
      resolve({
        imageData,
        width: imageData.width,
        height: imageData.height,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export function toGrayscale(imageData: ImageData): Uint8Array {
  const { data, width, height } = imageData;
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = (0.299 * r + 0.587 * g + 0.114 * b) | 0;
  }
  return gray;
}

/**
 * Binarização: converte grayscale em preto e branco por limiar.
 * Para desenho preto no branco: threshold 128 → pixels escuros (desenho) viram 255, claros viram 0.
 * Retorna Uint8Array com 0 ou 255 (255 = "contorno"/desenho para uso no braille).
 */
export function binaryThreshold(
  gray: Uint8Array,
  width: number,
  height: number,
  threshold: number,
  darkIsContour: boolean = true
): Uint8Array {
  const out = new Uint8Array(gray.length);
  const t = Math.max(0, Math.min(255, threshold));
  for (let i = 0; i < gray.length; i++) {
    const isDark = gray[i] < t;
    out[i] = (darkIsContour && isDark) || (!darkIsContour && !isDark) ? 255 : 0;
  }
  return out;
}

export type ContrastMode = 'contrast' | 'equalize';

export function contrastOrEqualize(
  gray: Uint8Array,
  width: number,
  height: number,
  options: { mode: ContrastMode; intensity?: number }
): Uint8Array {
  const { mode, intensity = 1 } = options;
  const out = new Uint8Array(gray.length);

  if (mode === 'equalize') {
    const hist = new Int32Array(256);
    for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
    const cdf = new Int32Array(256);
    cdf[0] = hist[0];
    for (let i = 1; i < 256; i++) cdf[i] = cdf[i - 1] + hist[i];
    const minCdf = cdf.find((v) => v > 0) ?? 0;
    const range = gray.length - minCdf;
    if (range <= 0) return gray.slice();
    const scale = 255 / range;
    for (let i = 0; i < gray.length; i++) {
      out[i] = Math.max(0, Math.min(255, ((cdf[gray[i]] - minCdf) * scale) | 0));
    }
    return out;
  }

  // contrast: linear scaling around midpoint 128
  const mid = 128;
  const factor = intensity;
  for (let i = 0; i < gray.length; i++) {
    const v = ((gray[i] - mid) * factor + mid) | 0;
    out[i] = Math.max(0, Math.min(255, v));
  }
  return out;
}

export function blur(
  gray: Uint8Array,
  width: number,
  height: number,
  radius: number
): Uint8Array {
  if (radius <= 0) return gray.slice();
  const r = Math.min(radius, 10);
  const size = r * 2 + 1;
  const kernel = new Float32Array(size * size);
  const sigma = r / 2;
  let sum = 0;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const v = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      kernel[(dy + r) * size + (dx + r)] = v;
      sum += v;
    }
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= sum;

  const out = new Uint8Array(gray.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let acc = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = Math.max(0, Math.min(width - 1, x + dx));
          const ny = Math.max(0, Math.min(height - 1, y + dy));
          acc += gray[ny * width + nx] * kernel[(dy + r) * size + (dx + r)];
        }
      }
      out[y * width + x] = Math.round(acc);
    }
  }
  return out;
}

function sobelMagnitude(gray: Uint8Array, width: number, height: number): { g: Float32Array; dir: Float32Array } {
  const g = new Float32Array(width * height);
  const dir = new Float32Array(width * height);
  const kx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const ky = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const v = gray[(y + dy) * width + (x + dx)];
          const i = (dy + 1) * 3 + (dx + 1);
          gx += v * kx[i];
          gy += v * ky[i];
        }
      }
      const idx = y * width + x;
      g[idx] = Math.sqrt(gx * gx + gy * gy);
      dir[idx] = Math.atan2(gy, gx);
    }
  }
  return { g, dir };
}

export function canny(
  gray: Uint8Array,
  width: number,
  height: number,
  low: number,
  high: number
): Uint8Array {
  const { g: mag, dir } = sobelMagnitude(gray, width, height);
  const out = new Uint8Array(width * height);

  // Non-max suppression
  const strong = 255, weak = 50;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const m = mag[idx];
      const d = dir[idx];
      const deg = (d * 180 / Math.PI + 180) % 180;
      let a = 0, b = 0;
      if (deg < 22.5 || deg >= 157.5) {
        a = mag[idx - 1]; b = mag[idx + 1];
      } else if (deg < 67.5) {
        a = mag[idx - width - 1]; b = mag[idx + width + 1];
      } else if (deg < 112.5) {
        a = mag[idx - width]; b = mag[idx + width];
      } else {
        a = mag[idx - width + 1]; b = mag[idx + width - 1];
      }
      if (m >= a && m >= b && m >= high) out[idx] = strong;
      else if (m >= a && m >= b && m >= low) out[idx] = weak;
    }
  }

  // Hysteresis: propagate strong to weak neighbors
  let changed = true;
  while (changed) {
    changed = false;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (out[idx] !== weak) continue;
        for (let dy = -1; dy <= 1 && !changed; dy++) {
          for (let dx = -1; dx <= 1 && !changed; dx++) {
            if (out[(y + dy) * width + (x + dx)] === strong) {
              out[idx] = strong;
              changed = true;
            }
          }
        }
      }
    }
  }
  for (let i = 0; i < out.length; i++) if (out[i] === weak) out[i] = 0;
  return out;
}

export type MorphologyMode = 'dilate' | 'erode';

export function morphology(
  binary: Uint8Array,
  width: number,
  height: number,
  mode: MorphologyMode,
  iterations: number
): Uint8Array {
  let current = binary.slice();
  const next = new Uint8Array(binary.length);

  for (let iter = 0; iter < iterations; iter++) {
    next.set(current);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        let any = false;
        let all = true;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const v = current[(y + dy) * width + (x + dx)] > 127;
            any = any || v;
            all = all && v;
          }
        }
        if (mode === 'dilate') next[idx] = any ? 255 : current[idx];
        else next[idx] = all ? 255 : 0;
      }
    }
    current.set(next);
  }
  return current;
}

/** Thinning (skeletonize) simplificado: remove pixels de borda que não quebram conectividade. */
export function skeletonize(
  binary: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  const out = binary.slice();
  const get = (x: number, y: number) => (x >= 0 && x < width && y >= 0 && y < height && out[y * width + x] > 127) ? 1 : 0;

  let changed = true;
  while (changed) {
    changed = false;
    const next = out.slice();
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (get(x, y) === 0) continue;
        const p2 = get(x, y - 1), p3 = get(x + 1, y - 1), p4 = get(x + 1, y), p5 = get(x + 1, y + 1);
        const p6 = get(x, y + 1), p7 = get(x - 1, y + 1), p8 = get(x - 1, y), p9 = get(x - 1, y - 1);
        const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (B < 2 || B > 6) continue;
        let A = 0;
        if (p2 === 0 && p3 === 1) A++; if (p3 === 0 && p4 === 1) A++; if (p4 === 0 && p5 === 1) A++;
        if (p5 === 0 && p6 === 1) A++; if (p6 === 0 && p7 === 1) A++; if (p7 === 0 && p8 === 1) A++;
        if (p8 === 0 && p9 === 1) A++; if (p9 === 0 && p2 === 1) A++;
        if (A !== 1) continue;
        if (p2 * p4 * p6 === 0 && p4 * p6 * p8 === 0) {
          next[y * width + x] = 0;
          changed = true;
        }
      }
    }
    for (let i = 0; i < out.length; i++) out[i] = next[i];
  }
  return out;
}
