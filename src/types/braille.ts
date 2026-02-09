
export interface BrailleCell {
  x: number;
  y: number;
  dots: number[]; // Array de números 1-6 representando pontos ativos
  letter?: string;
  isActive?: boolean;
  origin?: 'manual' | 'automatic';
}

export interface BrailleGrid {
  width: number; // número de colunas de células
  height: number; // número de linhas de células
  cells: BrailleCell[][];
}

export interface DrawingState {
  grid: BrailleGrid;
  zoom: number;
  selectedTool: Tool;
  showLetters: boolean; // toggle entre pontos e letras
}

export type Tool = 
  | 'select'
  | 'pencil'
  | 'eraser'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'fill'
  | 'text'
  | 'import'
  | 'image_import';

export interface ZoomLevel {
  value: number;
  label: string;
}

export interface Resolution {
  width: number;
  height: number;
  label: string;
}
