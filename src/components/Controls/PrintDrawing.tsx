import * as React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import type { BrailleGrid } from "@/types/braille";
import { gridToAnsiTxt, textToAnsiBytes, downloadAnsiTxt } from "@/lib/encoding";

type PrintDrawingProps = {
  grid: BrailleGrid;
};

export function PrintDrawing({ grid }: PrintDrawingProps) {
  const handlePrint = React.useCallback(() => {
    try {
      // 1) CRLF (melhor para Bloco de Notas/Windows)
      const text = gridToAnsiTxt(grid);

      // 2) Converte para bytes 0..255 (ANSI/Latin-1 básico)
      const bytes = textToAnsiBytes(text);

      // 3) Faz o download do .txt (usuário escolhe a embosser na impressão)
      downloadAnsiTxt("puncao-desenho.txt", bytes);
    } catch (err) {
      console.error("[PrintDrawing] Erro ao preparar arquivo:", err);
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
      title="Imprimir (gera arquivo .txt ANSI para enviar à embosser)"
    >
      <Printer size={16} />
      Imprimir
    </Button>
  );
}
