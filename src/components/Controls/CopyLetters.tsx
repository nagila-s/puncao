import { Button } from "@/components/ui/button";
import { Copy as CopyIcon } from "lucide-react";

type CopyLettersProps = {
  onCopy: () => void;
  disabled?: boolean;
};

export function CopyLetters({ onCopy, disabled }: CopyLettersProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="gap-2"
      onClick={onCopy}
      disabled={disabled}
      title="Copiar letras e salvar em Meus desenhos"
    >
      <CopyIcon size={16} />
      Copiar letras
    </Button>
  );
}
