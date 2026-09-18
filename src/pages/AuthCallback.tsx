import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState('Confirmando...');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      navigate('/login', { replace: true });
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const queryParams = new URLSearchParams(window.location.search);
    const type = hashParams.get('type') || queryParams.get('type');
    const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

    if (errorDescription) {
      toast({
        title: 'Não foi possível confirmar',
        description: decodeURIComponent(errorDescription.replace(/\+/g, ' ')),
        variant: 'destructive',
      });
      navigate(type === 'recovery' ? '/esqueci-senha' : '/login', { replace: true });
      return;
    }

    let settled = false;

    const finish = (eventType?: string | null) => {
      if (settled) return;
      settled = true;
      if (eventType === 'recovery' || type === 'recovery') {
        toast({ title: 'Defina uma senha nova' });
        navigate('/redefinir-senha', { replace: true });
        return;
      }
      toast({ title: 'E-mail confirmado', description: 'Sua conta está ativa.' });
      navigate('/app', { replace: true });
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        finish('recovery');
      } else if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION')) {
        finish(type);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        finish(type);
      }
    });

    const timeout = window.setTimeout(() => {
      if (!settled) {
        setMessage('Não encontramos uma sessão válida. O link pode ter expirado.');
      }
    }, 4000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 text-center">
        <img src="/favicon.png" alt="Logo Punção" className="h-12 w-auto mx-auto mb-3" />
        <h1 className="text-2xl font-semibold mb-2">Punção</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default AuthCallback;
