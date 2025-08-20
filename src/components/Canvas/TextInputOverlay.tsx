import React, { useEffect, useRef, useState } from "react";

type Props = {
  x: number;             // em células (coluna)
  y: number;             // em células (linha)
  zoom: number;
  cellWidth: number;     // px por célula (ex.: 20)
  cellHeight: number;    // px por célula (ex.: 30)
  initial?: string;
  onCommit: (text: string) => void; // commit no blur / Ctrl+Enter
  onCancel: () => void;             // ESC
};

export const TextInputOverlay: React.FC<Props> = ({
  x,
  y,
  zoom,
  cellWidth,
  cellHeight,
  initial = "",
  onCommit,
  onCancel,
}) => {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // foco automático
  useEffect(() => {
    ref.current?.focus();
    // posiciona cursor no fim
    const ta = ref.current;
    if (ta) {
      ta.selectionStart = ta.value.length;
      ta.selectionEnd = ta.value.length;
    }
  }, []);

  const pxLeft = x * cellWidth * zoom;
  const pxTop = y * cellHeight * zoom;

  const lineHeight = cellHeight * zoom;              // 1 linha = 1 célula
  const fontSize = Math.round(cellHeight * 0.6 * zoom); // ajuste visual

  const handleBlur = () => {
    // “clicou fora” → fixa (se houver algo)
    if (value.trim().length > 0) onCommit(value);
    else onCancel();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter") {
      e.preventDefault();
      if (value.trim().length > 0) onCommit(value);
      else onCancel();
    }
    // Enter normal → quebra de linha (mantém edição)
  };

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="
        absolute z-50 resize-none outline-none
        bg-white/80 dark:bg-black/60
        border-2 border-yellow-400 rounded
        text-foreground
        font-mono
        p-1
      "
      style={{
        left: pxLeft,
        top: pxTop,
        minWidth: cellWidth * zoom,     // ao menos 1 célula de largura
        minHeight: cellHeight * zoom,   // ao menos 1 célula de altura
        lineHeight: `${lineHeight}px`,
        fontSize: `${fontSize}px`,
        // mantém o texto “alinhado” visualmente à grade
        letterSpacing: "0px",
        // evita que o container por baixo capture os cliques
        pointerEvents: "auto",
      }}
      spellCheck={false}
      placeholder="Digite aqui…"
    />
  );
};
