import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Category, Drawing } from '@/types/drawings';
import { fetchCategories, publishDrawing } from '@/lib/drawings';

type PublishModalProps = {
  drawing: Drawing;
  ownerId: string;
  onClose: () => void;
  onPublished: () => void;
};

const untitled = (title: string) => !title || title === 'Sem título';

export const PublishModal = ({ drawing, ownerId, onClose, onPublished }: PublishModalProps) => {
  const [title, setTitle] = useState(untitled(drawing.title) ? '' : drawing.title);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string[]>(drawing.categories?.map((item) => item.id) ?? []);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(drawing.tags?.map((item) => item.name) ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void fetchCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setTitle(untitled(drawing.title) ? '' : drawing.title);
  }, [drawing.title]);

  const addTag = () => {
    const next = tagInput.trim();
    if (!next) return;
    if (!tags.some((tag) => tag.toLowerCase() === next.toLowerCase())) {
      setTags((current) => [...current, next]);
    }
    setTagInput('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const result = await publishDrawing({
      drawingId: drawing.id,
      ownerId,
      title,
      categoryIds: selected,
      tagNames: tags,
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDone(true);
    onPublished();
  };

  const toggleCategory = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Publicar desenho</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        {done ? (
          <div className="space-y-4">
            <p className="text-sm">
              Seu desenho foi enviado para aprovação e será publicado em breve.
            </p>
            <div className="flex justify-end">
              <Button type="button" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block" htmlFor="drawing-title">
                Título
              </label>
              <Input
                id="drawing-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Categorias</p>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block" htmlFor="tag-input">
                Tags
              </label>
              <div className="flex gap-2">
                <Input
                  id="tag-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Escreva e pressione Enter"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="text-xs px-2 py-0.5 rounded-full border border-border"
                    onClick={() => setTags((current) => current.filter((item) => item !== tag))}
                  >
                    #{tag} ×
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Publicando...' : 'Publicar'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
