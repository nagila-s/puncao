/**
 * shapeRasterizer.ts
 * 
 * Pipeline de rasterização de formas geométricas para Braille:
 *   1. Recebe tipo de forma + bounding box em células
 *   2. Cria bitmap lógico (pixels) na resolução do grid
 *   3. Rasteriza o contorno da forma no bitmap
 *   4. Converte bitmap → dots por célula (detecção por proximidade)
 *
 * Funções puras — nenhum efeito colateral, nenhum estado React.
 */

import { CELL_WIDTH, CELL_HEIGHT } from './constants';

// ─── Posições dos 6 pontos Braille (fração da célula) ──────────

export const DOT_POSITIONS = [
  { x: 0.3, y: 0.2 },  // ponto 1 (topo-esquerda)
  { x: 0.3, y: 0.5 },  // ponto 2 (meio-esquerda)
  { x: 0.3, y: 0.8 },  // ponto 3 (baixo-esquerda)
  { x: 0.7, y: 0.2 },  // ponto 4 (topo-direita)
  { x: 0.7, y: 0.5 },  // ponto 5 (meio-direita)
  { x: 0.7, y: 0.8 },  // ponto 6 (baixo-direita)
];

// ─── Tipos ──────────────────────────────────────────────────────

export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line';

export interface ShapeParams {
  /** Espessura do contorno em pixels lógicos (1–3). Padrão: 1 */
  strokeWidth?: number;
  /** Distância máxima (px) de um ponto a um pixel "aceso" para ativar o dot. Padrão: 7 */
  maxDistPx?: number;
  /**
   * Posição fracional do clique dentro da célula âncora (0..1).
   * Usado pela ferramenta "line" para snapar os endpoints à coluna/linha
   * de dots mais próxima, evitando que uma linha vertical ative ambas
   * as colunas de pontos (ex: dots 1,2,3 em vez de todos os 6).
   */
  anchorFrac?: { x: number; y: number };
}

interface CellCoord {
  x: number;
  y: number;
}

// ─── Bitmap ─────────────────────────────────────────────────────

interface Bitmap {
  data: Uint8Array;
  width: number;
  height: number;
}

function createBitmap(w: number, h: number): Bitmap {
  return { data: new Uint8Array(w * h), width: w, height: h };
}

function setPixel(bmp: Bitmap, x: number, y: number): void {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix >= 0 && ix < bmp.width && iy >= 0 && iy < bmp.height) {
    bmp.data[iy * bmp.width + ix] = 1;
  }
}

function getPixel(bmp: Bitmap, x: number, y: number): boolean {
  if (x >= 0 && x < bmp.width && y >= 0 && y < bmp.height) {
    return bmp.data[y * bmp.width + x] !== 0;
  }
  return false;
}

// ─── Primitivas de rasterização ─────────────────────────────────

/** Banda horizontal de `sw` pixels de altura. */
function drawHBand(bmp: Bitmap, x0: number, x1: number, y0: number, sw: number): void {
  for (let s = 0; s < sw; s++) {
    for (let x = x0; x <= x1; x++) {
      setPixel(bmp, x, y0 + s);
    }
  }
}

/** Banda vertical de `sw` pixels de largura. */
function drawVBand(bmp: Bitmap, y0: number, y1: number, x0: number, sw: number): void {
  for (let s = 0; s < sw; s++) {
    for (let y = y0; y <= y1; y++) {
      setPixel(bmp, x0 + s, y);
    }
  }
}

// ─── 5.1  Retângulo (contorno) ──────────────────────────────────

function rasterizeRectangle(bmp: Bitmap, sw: number): void {
  const w = bmp.width;
  const h = bmp.height;

  // Topo
  drawHBand(bmp, 0, w - 1, 0, Math.min(sw, h));
  // Base
  drawHBand(bmp, 0, w - 1, Math.max(0, h - sw), Math.min(sw, h));
  // Esquerda
  drawVBand(bmp, 0, h - 1, 0, Math.min(sw, w));
  // Direita
  drawVBand(bmp, 0, h - 1, Math.max(0, w - sw), Math.min(sw, w));
}

// ─── 5.2  Elipse — cálculo directo ao nível dos dots ───────────
//
// Em vez de rasterizar um bitmap e depois detectar por proximidade
// (que produz contornos grossos e "quadrados" em círculos pequenos),
// calculamos a distância de cada dot individual à curva da elipse.
//
// Para cada dot:
//   1. Distância normalizada d² = (vx/a)² + (vy/b)² (d=1 na curva)
//   2. Distância em pixels ≈ |d-1|/d × r  (projecção radial)
//   3. Se pixDist ≤ maxDistPx → candidato
//
// "Thinning": se dots emparelhados (1↔4, 2↔5, 3↔6) estão ambos
// activos mas um está MUITO mais perto da curva, descartar o mais
// distante. Isto mantém o contorno com 1 dot de espessura nos lados
// mas permite 2 dots no topo/base (contorno horizontal).

/**
 * Calcula a distância aproximada (em pixels) de um ponto à elipse.
 * Usa projecção radial: projecta o ponto no contorno da elipse na
 * direcção do centro e mede a distância entre os dois.
 */
function pixelDistToEllipse(
  dpx: number, dpy: number,
  cx: number, cy: number,
  a: number, b: number
): number {
  const vx = dpx - cx;
  const vy = dpy - cy;
  const r = Math.sqrt(vx * vx + vy * vy);

  if (r < 0.001) {
    // Ponto no centro da elipse — longe do contorno
    return Math.min(a, b);
  }

  const nx = vx / a;
  const ny = vy / b;
  const dNorm = Math.sqrt(nx * nx + ny * ny);

  return Math.abs(dNorm - 1) / Math.max(dNorm, 0.001) * r;
}

/** Pares de dots (0-indexed) para thinning: esquerda↔direita */
const DOT_PAIRS: [number, number][] = [[0, 3], [1, 4], [2, 5]];

/**
 * Diferença mínima de distância (px) entre dots de um par para
 * descartar o mais distante. Se a diferença for ≤ este valor,
 * ambos ficam (ex: topo/base do círculo onde a curva é horizontal).
 */
const THIN_DIFF_PX = 2.0;

function ellipseDirectDotsMap(
  bbX0: number, bbY0: number,
  bbX1: number, bbY1: number,
  maxDistPx: number
): Map<string, number[]> {
  const cellsW = bbX1 - bbX0 + 1;
  const cellsH = bbY1 - bbY0 + 1;

  // ── Caso especial: círculo mínimo de 2 células → "õo" ──
  // Com apenas 2 células não há resolução para calcular curva;
  // o padrão canónico em Braille é: õ (dots 2,4,6) + o (dots 1,3,5).
  if (cellsW === 2 && cellsH === 1) {
    const result = new Map<string, number[]>();
    result.set(`${bbX0},${bbY0}`, [2, 4, 6]);     // "õ"
    result.set(`${bbX0 + 1},${bbY0}`, [1, 3, 5]);  // "o"
    return result;
  }

  // ── Caso especial: 1×2 vertical ──
  if (cellsW === 1 && cellsH === 2) {
    const result = new Map<string, number[]>();
    result.set(`${bbX0},${bbY0}`, [1, 4, 3, 6]);     // topo e base da célula de cima
    result.set(`${bbX0},${bbY0 + 1}`, [1, 4, 3, 6]); // topo e base da célula de baixo
    return result;
  }

  const wPx = cellsW * CELL_WIDTH;
  const hPx = cellsH * CELL_HEIGHT;
  const cx = (wPx - 1) / 2;
  const cy = (hPx - 1) / 2;
  const a = Math.max(1, wPx / 2);
  const b = Math.max(1, hPx / 2);

  const result = new Map<string, number[]>();

  for (let cellY = bbY0; cellY <= bbY1; cellY++) {
    for (let cellX = bbX0; cellX <= bbX1; cellX++) {
      const cellOffX = (cellX - bbX0) * CELL_WIDTH;
      const cellOffY = (cellY - bbY0) * CELL_HEIGHT;

      // Calcular distância de cada dot à elipse
      const dists: number[] = new Array(6);
      const active = new Set<number>();

      for (let di = 0; di < 6; di++) {
        const dpx = cellOffX + DOT_POSITIONS[di].x * CELL_WIDTH;
        const dpy = cellOffY + DOT_POSITIONS[di].y * CELL_HEIGHT;
        const dist = pixelDistToEllipse(dpx, dpy, cx, cy, a, b);
        dists[di] = dist;
        if (dist <= maxDistPx) {
          active.add(di);
        }
      }

      // Thinning: para cada par (esq, dir), se ambos activos e com
      // distâncias muito diferentes, manter só o mais próximo.
      for (const [left, right] of DOT_PAIRS) {
        if (active.has(left) && active.has(right)) {
          const diff = Math.abs(dists[left] - dists[right]);
          if (diff > THIN_DIFF_PX) {
            if (dists[left] > dists[right]) {
              active.delete(left);
            } else {
              active.delete(right);
            }
          }
        }
      }

      if (active.size > 0) {
        const dots = Array.from(active).map(d => d + 1).sort();
        result.set(`${cellX},${cellY}`, dots);
      }
    }
  }

  return result;
}

// ─── 5.4  Linha (Bresenham com espessura) ──────────────────────

function rasterizeLineBresenham(
  bmp: Bitmap,
  x0: number, y0: number,
  x1: number, y1: number,
  sw: number
): void {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let cx = x0;
  let cy = y0;
  const half = Math.floor(sw / 2);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Bloco sw×sw centrado no pixel atual
    for (let i = -half; i < -half + sw; i++) {
      for (let j = -half; j < -half + sw; j++) {
        setPixel(bmp, cx + i, cy + j);
      }
    }

    if (cx === x1 && cy === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx) { err += dx; cy += sy; }
  }
}

// ─── 5.3  Triângulo isósceles — cálculo directo ao nível dos dots ──
//
// Em vez de rasterizar pixels e converter por proximidade (que produz
// contornos grossos e imprevisíveis), atribuímos diretamente os padrões
// de dots a cada célula conforme a sua posição geométrica no triângulo:
//
//   Lado esquerdo:  "í" = dots [3,4]  (diagonal /)
//   Lado direito:   "â" = dots [1,6]  (diagonal \)
//   Base:           "-" = dots [3,6]  (linha inferior)
//   Canto inf-esq:  "ó" = dots [3,4,6]  (/ + base)
//   Canto inf-dir:  "u" = dots [1,3,6]  (\ + base)
//   Vértice merge:  dots [1,3,4,6]  (quando / e \ caem na mesma célula)

function triangleDirectDotsMap(
  bbX0: number, bbY0: number,
  bbX1: number, bbY1: number
): Map<string, number[]> {
  const result = new Map<string, number[]>();
  const cellsW = bbX1 - bbX0 + 1;
  const cellsH = bbY1 - bbY0 + 1;

  // Padrões fixos
  const LEFT_SIDE  = [3, 4];      // "í" — diagonal /
  const RIGHT_SIDE = [1, 6];      // "â" — diagonal \
  const BASE       = [3, 6];      // "-" — linha inferior
  const CORNER_BL  = [3, 4, 6];   // "ó" — canto base-esquerda
  const CORNER_BR  = [1, 3, 6];   // "u" — canto base-direita
  const VERTEX     = [1, 3, 4, 6]; // vértice (merge de í + â)

  // Caso degenerado: única célula
  if (cellsW === 1 && cellsH === 1) {
    result.set(`${bbX0},${bbY0}`, [...VERTEX]);
    return result;
  }

  // Caso degenerado: apenas 1 linha → só base
  if (cellsH === 1) {
    for (let x = bbX0; x <= bbX1; x++) {
      if (x === bbX0 && cellsW > 1) {
        result.set(`${x},${bbY0}`, [...CORNER_BL]);
      } else if (x === bbX1 && cellsW > 1) {
        result.set(`${x},${bbY0}`, [...CORNER_BR]);
      } else {
        result.set(`${x},${bbY0}`, [...BASE]);
      }
    }
    return result;
  }

  // Centro do topo: para largura ímpar, uma célula; para par, duas.
  // Floor dá a coluna esquerda do vértice, ceil a direita.
  const leftColTop  = Math.floor((cellsW - 1) / 2);
  const rightColTop = Math.ceil((cellsW - 1) / 2);

  const denom = cellsH - 1;

  for (let row = 0; row < cellsH; row++) {
    const y = bbY0 + row;

    // Aritmética inteira para evitar erros de ponto flutuante:
    //   leftColTop * (denom - row) / denom  ←  exato quando numerador é múltiplo
    //   rightColTop + spread * row / denom
    const leftColF  = (leftColTop * (denom - row)) / denom;
    const rightColF = rightColTop + ((cellsW - 1 - rightColTop) * row) / denom;

    // Floor/ceil garante expansão monotónica sem linhas duplicadas
    const leftCol  = Math.floor(leftColF + 1e-9);
    const rightCol = Math.ceil(rightColF - 1e-9);

    const isBase = (row === cellsH - 1);

    if (isBase) {
      // Linha base com cantos
      for (let col = leftCol; col <= rightCol; col++) {
        const x = bbX0 + col;
        if (col === leftCol && leftCol !== rightCol) {
          result.set(`${x},${y}`, [...CORNER_BL]);
        } else if (col === rightCol && leftCol !== rightCol) {
          result.set(`${x},${y}`, [...CORNER_BR]);
        } else {
          result.set(`${x},${y}`, [...BASE]);
        }
      }
    } else {
      // Lados
      const leftX  = bbX0 + leftCol;
      const rightX = bbX0 + rightCol;

      if (leftCol === rightCol) {
        // Ambos os lados na mesma célula → vértice merge
        result.set(`${leftX},${y}`, [...VERTEX]);
      } else {
        result.set(`${leftX},${y}`, [...LEFT_SIDE]);
        result.set(`${rightX},${y}`, [...RIGHT_SIDE]);
      }
    }
  }

  return result;
}

// ─── 6. Bitmap → dots por célula (detecção por proximidade) ────

/**
 * Para cada ponto Braille em cada célula do bounding box,
 * verifica se existe algum pixel "aceso" no bitmap dentro de
 * `maxDistPx` (distância euclidiana). Se existir, o ponto é ativado.
 *
 * maxDistPx=7 é calibrado para CELL_WIDTH=20, CELL_HEIGHT=30:
 *   - Distância mínima de um dot ao bordo mais próximo da célula ≈ 5–6 px
 *   - Garante que bordas na fronteira da célula ativam dots adjacentes
 *   - Mantém dots do lado oposto (distância ≥ 14 px) desligados
 */
function bitmapToDotsMap(
  bmp: Bitmap,
  bbX0: number,
  bbY0: number,
  bbX1: number,
  bbY1: number,
  maxDistPx: number
): Map<string, number[]> {
  const result = new Map<string, number[]>();
  const maxDistSq = maxDistPx * maxDistPx;
  const r = Math.ceil(maxDistPx);

  for (let cy = bbY0; cy <= bbY1; cy++) {
    for (let cx = bbX0; cx <= bbX1; cx++) {
      const dots: number[] = [];
      const cellOffX = (cx - bbX0) * CELL_WIDTH;
      const cellOffY = (cy - bbY0) * CELL_HEIGHT;

      for (let di = 0; di < 6; di++) {
        const dpx = Math.round(cellOffX + DOT_POSITIONS[di].x * CELL_WIDTH);
        const dpy = Math.round(cellOffY + DOT_POSITIONS[di].y * CELL_HEIGHT);

        let activated = false;
        for (let dy = -r; dy <= r && !activated; dy++) {
          for (let dx = -r; dx <= r && !activated; dx++) {
            if (dx * dx + dy * dy <= maxDistSq) {
              if (getPixel(bmp, dpx + dx, dpy + dy)) {
                activated = true;
              }
            }
          }
        }

        if (activated) {
          dots.push(di + 1); // dots são 1-indexed
        }
      }

      if (dots.length > 0) {
        result.set(`${cx},${cy}`, dots);
      }
    }
  }

  return result;
}

// ─── 4. API principal ───────────────────────────────────────────

/**
 * Gera o mapa de dots para uma forma geométrica.
 *
 * @returns Map<"x,y", number[]>  —  apenas células com ≥ 1 dot ativo
 */
export function shapeToDotsMap(
  shapeType: ShapeType,
  anchorCell: CellCoord,
  currentCell: CellCoord,
  gridWidth: number,
  gridHeight: number,
  params: ShapeParams = {}
): Map<string, number[]> {
  const strokeWidth = Math.max(1, Math.min(3, params.strokeWidth ?? 1));
  const maxDistPx = params.maxDistPx ?? 7;

  // Bounding box em células (clamped ao grid)
  const bbX0 = Math.max(0, Math.min(anchorCell.x, currentCell.x));
  const bbY0 = Math.max(0, Math.min(anchorCell.y, currentCell.y));
  const bbX1 = Math.min(gridWidth - 1, Math.max(anchorCell.x, currentCell.x));
  const bbY1 = Math.min(gridHeight - 1, Math.max(anchorCell.y, currentCell.y));

  if (bbX0 > bbX1 || bbY0 > bbY1) return new Map();

  // Dimensões do bitmap em pixels lógicos
  const wPx = (bbX1 - bbX0 + 1) * CELL_WIDTH;
  const hPx = (bbY1 - bbY0 + 1) * CELL_HEIGHT;

  if (wPx <= 0 || hPx <= 0) return new Map();

  const bmp = createBitmap(wPx, hPx);

  // Rasterizar forma
  switch (shapeType) {
    case 'rectangle':
      rasterizeRectangle(bmp, strokeWidth);
      break;

    case 'circle':
      // Bypass do bitmap: cálculo directo ao nível dos dots
      // para contornos mais finos e circulares (ver ellipseDirectDotsMap)
      return ellipseDirectDotsMap(bbX0, bbY0, bbX1, bbY1, maxDistPx);


    case 'triangle':
      // Bypass do bitmap: cálculo directo ao nível dos dots
      // com padrões fixos para lados (í/â), base (-) e cantos (ó/u)
      return triangleDirectDotsMap(bbX0, bbY0, bbX1, bbY1);

    case 'line': {
      // Snap dos endpoints à coluna/linha de dots mais próxima do clique.
      // Isto garante que uma linha vertical ativa UMA coluna (1,2,3 ou 4,5,6)
      // e uma horizontal ativa UMA linha (ex: 2,5) em vez de todas.
      let fracX = 0.5;
      let fracY = 0.5;

      if (params.anchorFrac) {
        // Coluna de dots: esquerda (0.3) ou direita (0.7)
        fracX = params.anchorFrac.x < 0.5 ? 0.3 : 0.7;
        // Linha de dots: topo (0.2), meio (0.5) ou baixo (0.8)
        const fy = params.anchorFrac.y;
        fracY = fy < 0.35 ? 0.2 : (fy < 0.65 ? 0.5 : 0.8);
      }

      const sx = Math.round((anchorCell.x - bbX0) * CELL_WIDTH + fracX * CELL_WIDTH);
      const sy = Math.round((anchorCell.y - bbY0) * CELL_HEIGHT + fracY * CELL_HEIGHT);
      const ex = Math.round((currentCell.x - bbX0) * CELL_WIDTH + fracX * CELL_WIDTH);
      const ey = Math.round((currentCell.y - bbY0) * CELL_HEIGHT + fracY * CELL_HEIGHT);
      rasterizeLineBresenham(bmp, sx, sy, ex, ey, strokeWidth);
      break;
    }
  }

  // Converter bitmap → dots
  return bitmapToDotsMap(bmp, bbX0, bbY0, bbX1, bbY1, maxDistPx);
}
