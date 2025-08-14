// src/components/Controls/PrintDrawing.tsx
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import type { BrailleGrid } from "@/types/braille";
import { gridToLetters, textToAnsiBytes, downloadAnsiTxt } from "@/lib/encoding";

type PrintDrawingProps = {
  grid: BrailleGrid;
};

export function PrintDrawing({ grid }: PrintDrawingProps) {
  const handlePrint = React.useCallback(() => {
    try {
      // 1) Converte a grade para texto (com CRLF)
      const text = gridToLetters(grid);

      // 2) Converte o texto para bytes ANSI (0–255)
      const bytes = textToAnsiBytes(text);

      // 3) Dispara download do .txt (usuário pode escolher a embosser na impressão)
      downloadAnsiTxt("puncao-desenho.txt", bytes);
    } catch (err) {
      console.error("[PrintDrawing] Erro ao preparar arquivo para impressão:", err);
      alert("Não foi possível preparar o arquivo para impressão.");
    }
  }, [grid]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handlePrint}
      title="Imprimir (gera arquivo ANSI para enviar à embosser)"
    >
      <Printer size={16} />
      Imprimir
    </Button>
  );
}
