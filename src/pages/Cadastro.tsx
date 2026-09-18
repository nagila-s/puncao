import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { BackToLanding } from '@/components/auth/BackToLanding';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

const Cadastro = () => {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const { error, needsConfirmation } = await signUp(email, password, name);
    setLoading(false);

    if (error) {
      toast({
        title: 'Falha no cadastro',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    if (needsConfirmation) {
      toast({
        title: 'Cadastro realizado',
        description: 'Confirme seu e-mail para ativar a conta.',
      });
      navigate(`/confirmar-email?email=${encodeURIComponent(email)}`);
      return;
    }

    toast({
      title: 'Cadastro realizado',
      description: 'Bem-vindo ao Punção.',
    });
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6">
        <div className="text-center mb-6">
          <img src="/favicon.png" alt="Logo Punção" className="h-12 w-auto mx-auto mb-3" />
          <h1 className="text-2xl font-semibold">Criar conta</h1>
          <p className="text-sm text-muted-foreground mt-1">simples de usar, feito para incluir</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env` para habilitar login e cadastro.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block" htmlFor="name">
              Nome
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block" htmlFor="email">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block" htmlFor="password">
              Senha
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </Button>
        </form>

        <p className="mt-4 text-sm text-center text-muted-foreground">
          Já tem conta?{' '}
          <Link to="/login" className="underline underline-offset-4 text-foreground">
            Entrar
          </Link>
        </p>
        <p className="mt-2 text-sm text-center">
          <Link to="/" className="underline underline-offset-4 text-muted-foreground">
            Abrir o editor sem cadastro
          </Link>
        </p>
        <BackToLanding />
      </div>
    </div>
  );
};

export default Cadastro;
