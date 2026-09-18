import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/layout/PageShell';
import { DrawingCard } from '@/components/drawings/DrawingCard';
import { PublishModal } from '@/components/drawings/PublishModal';
import { useAuth } from '@/contexts/AuthContext';
import { deleteDrawing, fetchOwnDrawings, updateDrawingTitle } from '@/lib/drawings';
import { useToast } from '@/hooks/use-toast';
import type { Drawing } from '@/types/drawings';
import { STATUS_LABELS } from '@/types/drawings';

const MeusDesenhos = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<Drawing | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchOwnDrawings(user.id);
    setDrawings(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleTitleChange = async (drawing: Drawing, nextTitle: string) => {
    const savedTitle = nextTitle.trim() || 'Sem título';
    const { error } = await updateDrawingTitle(drawing.id, savedTitle);
    if (error) {
      toast({ title: 'Não foi possível salvar o título', description: error, variant: 'destructive' });
      return;
    }
    setDrawings((current) =>
      current.map((item) => (item.id === drawing.id ? { ...item, title: savedTitle } : item))
    );
  };

  const handleDelete = async (drawing: Drawing) => {
    if (!window.confirm(`Excluir “${drawing.title}”?`)) return;
    const { error } = await deleteDrawing(drawing.id);
    if (error) {
      toast({ title: 'Não foi possível excluir', description: error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Desenho excluído' });
    void load();
  };

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Meus desenhos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tudo que você copiou com “Copiar letras” fica salvo aqui como não publicado. Publicar envia para aprovação.
          </p>
        </div>

        {loading ? (
          <p>Carregando...</p>
        ) : drawings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum desenho ainda. Abra o editor, desenhe e clique em Copiar letras.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drawings.map((drawing) => (
              <DrawingCard
                key={drawing.id}
                drawing={drawing}
                href={`/app?d=${drawing.id}`}
                showStatus
                onTitleChange={(nextTitle) => handleTitleChange(drawing, nextTitle)}
                actions={
                  <>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/app?d=${drawing.id}`}>Abrir</Link>
                    </Button>
                    {drawing.status !== 'pending' && drawing.status !== 'published' && (
                      <Button size="sm" onClick={() => setPublishing(drawing)}>
                        Publicar
                      </Button>
                    )}
                    {drawing.status === 'pending' && (
                      <span className="text-xs text-muted-foreground self-center">
                        {STATUS_LABELS.pending}
                      </span>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(drawing)}>
                      Excluir
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>

      {publishing && user && (
        <PublishModal
          drawing={drawings.find((item) => item.id === publishing.id) ?? publishing}
          ownerId={user.id}
          onClose={() => {
            setPublishing(null);
            void load();
          }}
          onPublished={() => {
            setDrawings((current) =>
              current.map((item) =>
                item.id === publishing.id ? { ...item, status: 'pending' as const } : item
              )
            );
          }}
        />
      )}
    </PageShell>
  );
};

export default MeusDesenhos;
