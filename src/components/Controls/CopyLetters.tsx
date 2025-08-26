import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Copy as CopyIcon } from "lucide-react";
import type { BrailleGrid } from "@/types/braille";
import { gridToLetters } from "@/lib/encoding";
import { useToast } from "@/hooks/use-toast";

type CopyLettersProps = {
  grid: BrailleGrid;
};

export function CopyLetters({ grid }: CopyLettersProps) {
  const { toast } = useToast();

   const handleCopy = useCallback(async () => {
    try {
    
      const text = gridToLetters(grid, "\r\n");
      await navigator.clipboard.writeText(text);

      toast({
        title: "Copiado",
        description: "Letras copiadas para a área de transferência.",
        duration: 1800,
      });
    } catch (e) {
      console.error("[CopyLetters] Erro ao copiar:", e);
      toast({
        title: "Erro",
        description: "Não foi possível copiar o conteúdo.",
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
      onClick={handleCopy}
      title="Copiar letras (CRLF)"
    >
      <CopyIcon size={16} />
      Copiar letras
    </Button>
  );
}
