import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const RedefinirSenha = () => {
  const { user, loading, updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      toast({
        title: 'Link inválido ou expirado',
        description: 'Peça um novo e-mail para redefinir a senha.',
        variant: 'destructive',
      });
      navigate('/esqueci-senha', { replace: true });
      return;
    }
    setReady(true);
  }, [loading, user, navigate, toast]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const error = await updatePassword(password);
    setSaving(false);

    if (error) {
      toast({
        title: 'Não foi possível redefinir a senha',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Senha redefinida', description: 'Entre com a senha nova.' });
    navigate('/app');
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6">
        <div className="text-center mb-6">
          <img src="/favicon.png" alt="Logo Punção" className="h-12 w-auto mx-auto mb-3" />
          <h1 className="text-2xl font-semibold">Redefinir senha</h1>
          <p className="text-sm text-muted-foreground mt-1">Escolha uma senha nova para a sua conta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block" htmlFor="password">
              Nova senha
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar senha'}
          </Button>
        </form>

        <p className="mt-4 text-sm text-center">
          <Link to="/esqueci-senha" className="underline underline-offset-4 text-muted-foreground">
            Pedir outro e-mail
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RedefinirSenha;
