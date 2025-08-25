// src/components/Controls/PrintLetters.tsx
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import type { BrailleGrid } from "@/types/braille";
import { gridToAnsiTxt, textToAnsiBytes } from "@/lib/encoding";
import { useToast } from "@/hooks/use-toast";

interface PrintLettersProps {
  grid: BrailleGrid;
}

export function PrintLetters({ grid }: PrintLettersProps) {
  const { toast } = useToast();

  const handlePrint = useCallback(() => {
    try {
      const text = gridToAnsiTxt(grid);
      const bytes = textToAnsiBytes(text);

      // ArrayBuffer CLÁSSICO (não usar bytes.buffer)
      const ab = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(ab).set(bytes);

      const blob = new Blob([ab], { type: "text/plain;charset=windows-1252" });
      const url = URL.createObjectURL(blob);

      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (win) {
        const doPrint = () => {
          try {
            win.focus();
            win.print();
          } catch {}
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        };
        win.onload = doPrint;
        setTimeout(doPrint, 400);
      } else {
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        document.body.appendChild(iframe);
        iframe.src = url;
        iframe.onload = () => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch {}
          setTimeout(() => {
            URL.revokeObjectURL(url);
            iframe.remove();
          }, 2000);
        };
      }
    } catch (e) {
      console.error("[PrintLetters] Erro ao imprimir:", e);
      toast({
        title: "Erro",
        description:
          "Não foi possível gerar a impressão. Baixe o .txt (ANSI) e imprima no Braille Fácil.",
        variant: "destructive",
      });
    }
  }, [grid, toast]);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="gap-2"
      onClick={handlePrint}
      title="Imprimir"
    >
      <Printer size={16} />
      Imprimir
    </Button>
  );
}

// opcional: também exporta como default para compatibilidade
export default PrintLetters;
