import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { BackToLanding } from '@/components/auth/BackToLanding';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

const Login = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const error = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({
        title: 'Falha no login',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Login realizado',
      description: 'Bem-vindo ao Punção.',
    });
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6">
        <div className="text-center mb-6">
          <img src="/favicon.png" alt="Logo Punção" className="h-12 w-auto mx-auto mb-3" />
          <h1 className="text-2xl font-semibold">Entrar</h1>
          <p className="text-sm text-muted-foreground mt-1">Acesse sua conta para salvar e ver desenhos.</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env` para habilitar login e cadastro.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete="current-password"
            />
          </div>

          <div className="text-right">
            <Link to="/esqueci-senha" className="text-sm underline underline-offset-4 text-muted-foreground">
              Esqueci a senha
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-4 text-sm text-center text-muted-foreground">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="underline underline-offset-4 text-foreground">
            Criar conta
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

export default Login;
