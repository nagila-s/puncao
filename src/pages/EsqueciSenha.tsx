import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const EsqueciSenha = () => {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const error = await resetPassword(email);
    setLoading(false);

    if (error) {
      toast({
        title: 'Não foi possível enviar o e-mail',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setSent(true);
    toast({
      title: 'E-mail enviado',
      description: 'Se essa conta existir, você receberá o link para redefinir a senha.',
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6">
        <div className="text-center mb-6">
          <img src="/favicon.png" alt="Logo Punção" className="h-12 w-auto mx-auto mb-3" />
          <h1 className="text-2xl font-semibold">Esqueci a senha</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Informe o e-mail da conta para receber o link de redefinição.
          </p>
        </div>

        {sent ? (
          <p className="text-sm text-center">
            Confira sua caixa de entrada. O link leva de volta ao Punção para criar uma senha nova.
          </p>
        ) : (
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link'}
            </Button>
          </form>
        )}

        <p className="mt-4 text-sm text-center">
          <Link to="/login" className="underline underline-offset-4 text-muted-foreground">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default EsqueciSenha;
