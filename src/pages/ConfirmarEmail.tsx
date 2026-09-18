import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const ConfirmarEmail = () => {
  const { resendConfirmation } = useAuth();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const email = params.get('email') ?? '';
  const [loading, setLoading] = useState(false);

  const handleResend = async (event: FormEvent) => {
    event.preventDefault();
    if (!email) {
      toast({
        title: 'E-mail ausente',
        description: 'Volte ao cadastro e tente de novo.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    const error = await resendConfirmation(email);
    setLoading(false);
    if (error) {
      toast({ title: 'Não foi possível reenviar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'E-mail reenviado', description: 'Confira a caixa de entrada.' });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 text-center">
        <img src="/favicon.png" alt="Logo Punção" className="h-12 w-auto mx-auto mb-3" />
        <h1 className="text-2xl font-semibold">Confirme seu e-mail</h1>
        <p className="text-sm text-muted-foreground mt-3">
          Enviamos um link para {email || 'o e-mail informado'}. Abra o e-mail para ativar a conta e voltar ao Punção.
          Confira também a pasta de spam. O remetente costuma ser o Supabase enquanto o SMTP próprio não estiver configurado.
        </p>
        <form onSubmit={handleResend} className="mt-6 space-y-3">
          <Button type="submit" className="w-full" disabled={loading || !email}>
            {loading ? 'Reenviando...' : 'Reenviar e-mail'}
          </Button>
          <Button asChild type="button" variant="outline" className="w-full">
            <Link to="/login">Ir para o login</Link>
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ConfirmarEmail;
