import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/layout/PageShell';
import { DrawingCard } from '@/components/drawings/DrawingCard';
import { fetchAllDrawingsForAdmin, updateDrawingStatus } from '@/lib/drawings';
import { useToast } from '@/hooks/use-toast';
import type { Drawing, DrawingStatus } from '@/types/drawings';
import { STATUS_LABELS } from '@/types/drawings';

const Admin = () => {
  const { toast } = useToast();
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [statusFilter, setStatusFilter] = useState<DrawingStatus | 'all'>('pending');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setDrawings(await fetchAllDrawingsForAdmin());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => (statusFilter === 'all' ? drawings : drawings.filter((item) => item.status === statusFilter)),
    [drawings, statusFilter]
  );

  const pendingCount = drawings.filter((item) => item.status === 'pending').length;

  const setStatus = async (drawing: Drawing, status: DrawingStatus) => {
    const { error } = await updateDrawingStatus(drawing.id, status);
    if (error) {
      toast({ title: 'Não foi possível atualizar', description: error, variant: 'destructive' });
      return;
    }
    toast({
      title: status === 'published' ? 'Desenho aprovado' : 'Desenho rejeitado',
    });
    void load();
  };

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCount} desenho(s) aguardando aprovação. Desenhos não publicados também aparecem aqui.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(['pending', 'draft', 'published', 'rejected', 'all'] as const).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={statusFilter === value ? 'default' : 'outline'}
              onClick={() => setStatusFilter(value)}
            >
              {value === 'all' ? 'Todos' : STATUS_LABELS[value]}
            </Button>
          ))}
        </div>

        {loading ? (
          <p>Carregando...</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum desenho neste filtro.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((drawing) => (
              <DrawingCard
                key={drawing.id}
                drawing={drawing}
                href={`/app?d=${drawing.id}`}
                showStatus
                actions={
                  <>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/app?d=${drawing.id}`}>Abrir</Link>
                    </Button>
                    {drawing.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => setStatus(drawing, 'published')}>
                          Aprovar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setStatus(drawing, 'rejected')}>
                          Rejeitar
                        </Button>
                      </>
                    )}
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default Admin;
