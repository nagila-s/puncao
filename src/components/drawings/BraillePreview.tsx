import type { BrailleGrid } from '@/types/braille';

const DOT_ORDER = [1, 2, 3, 4, 5, 6];

export const BraillePreview = ({ grid }: { grid: BrailleGrid }) => {
  const maxCols = Math.min(grid?.width ?? 0, 20);
  const maxRows = Math.min(grid?.height ?? 0, 12);

  if (!grid?.cells || maxCols === 0 || maxRows === 0) {
    return <div className="h-24 bg-muted rounded-md" />;
  }

  return (
    <div
      className="inline-grid bg-white border border-border rounded-sm p-1 overflow-hidden"
      style={{
        gridTemplateColumns: `repeat(${maxCols}, 10px)`,
        gridTemplateRows: `repeat(${maxRows}, 14px)`,
      }}
    >
      {Array.from({ length: maxRows }).map((_, y) =>
        Array.from({ length: maxCols }).map((_, x) => {
          const dots = new Set(grid.cells[y]?.[x]?.dots ?? []);
          return (
            <div
              key={`${x}-${y}`}
              className="grid grid-cols-2 grid-rows-3 place-items-center"
            >
              {DOT_ORDER.map((dot) => (
                <span
                  key={dot}
                  className={`block h-1 w-1 rounded-full ${
                    dots.has(dot) ? 'bg-foreground' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
};
