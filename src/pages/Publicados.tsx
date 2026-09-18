import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { DrawingCard } from '@/components/drawings/DrawingCard';
import { fetchCategories, fetchPublishedDrawings } from '@/lib/drawings';
import type { Category, Drawing } from '@/types/drawings';

const Publicados = () => {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [tagQuery, setTagQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [nextDrawings, nextCategories] = await Promise.all([
        fetchPublishedDrawings(),
        fetchCategories(),
      ]);
      setDrawings(nextDrawings);
      setCategories(nextCategories);
      setLoading(false);
    };
    void load();
  }, []);

  const availableTags = useMemo(() => {
    const names = new Set<string>();
    drawings.forEach((drawing) => {
      drawing.tags?.forEach((tag) => names.add(tag.name));
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [drawings]);

  const filtered = useMemo(() => {
    return drawings.filter((drawing) => {
      const matchesCategory =
        !categoryId || drawing.categories?.some((category) => category.id === categoryId);
      const matchesTag =
        !tagQuery ||
        drawing.tags?.some((tag) => tag.name.toLowerCase() === tagQuery.toLowerCase());
      return matchesCategory && matchesTag;
    });
  }, [drawings, categoryId, tagQuery]);

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Desenhos públicos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Desenhos aprovados, organizados por categoria e tags.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <label className="text-sm flex-1">
            Categoria
            <select
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm flex-1">
            Tag
            <select
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
            >
              <option value="">Todas</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <p>Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum desenho publicado com esses filtros.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((drawing) => (
              <DrawingCard key={drawing.id} drawing={drawing} href={`/app?d=${drawing.id}`} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default Publicados;
