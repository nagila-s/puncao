// Utilidades de texto/encoding para o Punção
// - gridToLetters: string com LF (\n)
// - gridToAnsiTxt: string com CRLF (\r\n), ideal para Bloco de Notas/embosser
// - textToAnsiBytes: converte string (até Latin-1) para bytes 0..255
// - downloadAnsiTxt: dispara download do .txt

import type { BrailleGrid } from "@/types/braille";

/**
 * Converte a grade em linhas de texto (preserva espaços dentro das linhas).
 * EOL padrão: LF (\n)
 */
export function gridToLetters(
  grid: BrailleGrid,
  eol: "\n" | "\r\n" = "\n"
): string {
  const lines: string[] = [];

  for (let y = 0; y < grid.height; y++) {
    let line = "";
    for (let x = 0; x < grid.width; x++) {
      const cell = grid.cells[y][x];
      const ch = cell?.letter && cell.letter.length ? cell.letter : " ";
      line += ch;
    }
    lines.push(line);
  }

  return lines.join(eol);
}

/** Mesmo que gridToLetters, mas usando CRLF (\r\n) */
export function gridToAnsiTxt(grid: BrailleGrid): string {
  return gridToLetters(grid, "\r\n");
}

/**
 * Converte string para bytes "ANSI-like" (Latin-1/Windows-1252 básico).
 * Obs.: caracteres com acento comuns (á, é, ç…) cabem em 1 byte (0..255).
 */
export function textToAnsiBytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i) & 0xff;
  }
  return bytes;
}

/** Dispara download de um .txt com bytes ANSI/CRLF */
export function downloadAnsiTxt(filename: string, bytes: Uint8Array): void {
  // Cria um ArrayBuffer "clássico" e copia os bytes
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);

  const blob = new Blob([ab], { type: "text/plain;charset=windows-1252" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Alias legado para compatibilidade com código antigo:
export function toCRLF(text: string): string {
  return text.replace(/\n/g, "\r\n");
}