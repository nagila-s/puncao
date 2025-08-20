import React, { useEffect, useRef, useState } from "react";

type InlineTextBoxProps = {
  cellX: number;
  cellY: number;
  zoom: number;
  initialValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

const CELL_WIDTH = 20;
const CELL_HEIGHT = 30;

export function InlineTextBox({
  cellX,
  cellY,
  zoom,
  initialValue = "",
  onConfirm,
  onCancel,
}: InlineTextBoxProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // foca e seleciona para digitar direto
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const left = cellX * CELL_WIDTH * zoom;
  const top = cellY * CELL_HEIGHT * zoom;

  return (
    <input
      data-inline-textbox
      ref={inputRef}
      className="absolute z-30 rounded border-2 border-yellow-400 bg-white/95 px-2 py-1 text-sm outline-none"
      style={{
        left,
        top,
        minWidth: 120 * zoom,
      }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onConfirm(value);
        if (e.key === "Escape") onCancel();
      }}
    />
  );
}
