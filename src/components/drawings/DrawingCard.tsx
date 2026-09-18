import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BraillePreview } from '@/components/drawings/BraillePreview';
import type { Drawing } from '@/types/drawings';
import { STATUS_LABELS } from '@/types/drawings';

type DrawingCardProps = {
  drawing: Drawing;
  href: string;
  actions?: ReactNode;
  showStatus?: boolean;
  onTitleChange?: (title: string) => Promise<void> | void;
};

export const DrawingCard = ({
  drawing,
  href,
  actions,
  showStatus = false,
  onTitleChange,
}: DrawingCardProps) => {
  const [title, setTitle] = useState(drawing.title === 'Sem título' ? '' : drawing.title);

  useEffect(() => {
    setTitle(drawing.title === 'Sem título' ? '' : drawing.title);
  }, [drawing.title]);

  const commitTitle = async () => {
    if (!onTitleChange) return;
    const current = drawing.title === 'Sem título' ? '' : drawing.title;
    if (title.trim() === current.trim()) return;
    await onTitleChange(title);
  };

  return (
    <article className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
      <Link to={href} className="flex justify-center bg-muted/40 rounded-md p-2 min-h-[8rem] items-center">
        <BraillePreview grid={drawing.grid} />
      </Link>
      <div>
        {onTitleChange ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => void commitTitle()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                (event.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Sem título"
            aria-label="Título do desenho"
            className="font-semibold h-9"
          />
        ) : (
          <Link to={href} className="font-semibold hover:underline">
            {drawing.title || 'Sem título'}
          </Link>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {drawing.author_name || 'Sem nome'}
          {showStatus ? ` · ${STATUS_LABELS[drawing.status]}` : ''}
        </p>
      </div>
      {(drawing.categories?.length || drawing.tags?.length) ? (
        <div className="flex flex-wrap gap-1">
          {drawing.categories?.map((category) => (
            <span key={category.id} className="text-xs px-2 py-0.5 rounded-full bg-accent">
              {category.name}
            </span>
          ))}
          {drawing.tags?.map((tag) => (
            <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full border border-border">
              #{tag.name}
            </span>
          ))}
        </div>
      ) : null}
      {actions ? <div className="flex flex-wrap gap-2 mt-auto">{actions}</div> : (
        <Button asChild size="sm" variant="outline">
          <Link to={href}>Abrir</Link>
        </Button>
      )}
    </article>
  );
};
