import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { PageShell } from '@/components/layout/PageShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Perfil = () => {
  const { user, profile, updateDisplayName, updatePassword, deleteAccount, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.display_name ?? '');
  const [password, setPassword] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (profile?.display_name) {
      setName(profile.display_name);
    }
  }, [profile?.display_name]);

  const handleName = async (event: FormEvent) => {
    event.preventDefault();
    setSavingName(true);
    const error = await updateDisplayName(name);
    setSavingName(false);
    if (error) {
      toast({ title: 'Não foi possível atualizar o nome', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Nome atualizado' });
  };

  const handlePassword = async (event: FormEvent) => {
    event.preventDefault();
    setSavingPassword(true);
    const error = await updatePassword(password);
    setSavingPassword(false);
    if (error) {
      toast({ title: 'Não foi possível atualizar a senha', description: error.message, variant: 'destructive' });
      return;
    }
    setPassword('');
    toast({ title: 'Senha atualizada' });
  };

  const handleDelete = async () => {
    setDeleting(true);
    const error = await deleteAccount();
    setDeleting(false);
    if (error) {
      toast({ title: 'Não foi possível excluir a conta', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Conta excluída' });
    navigate('/');
  };

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-lg p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Perfil</h1>
          <p className="text-sm text-muted-foreground mt-1">Altere seu nome, a senha ou exclua a conta.</p>
        </div>

        <form onSubmit={handleName} className="bg-card border border-border rounded-lg p-4 space-y-3">
          <label className="text-sm font-medium block" htmlFor="display-name">
            Nome
          </label>
          <Input
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <p className="text-sm font-medium">E-mail</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button type="submit" disabled={savingName}>
            {savingName ? 'Salvando...' : 'Salvar nome'}
          </Button>
        </form>

        <form onSubmit={handlePassword} className="bg-card border border-border rounded-lg p-4 space-y-3">
          <label className="text-sm font-medium block" htmlFor="new-password">
            Nova senha
          </label>
          <PasswordInput
            id="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            autoComplete="new-password"
          />
          <Button type="submit" disabled={savingPassword}>
            {savingPassword ? 'Salvando...' : 'Trocar senha'}
          </Button>
        </form>

        <div className="bg-card border border-destructive/40 rounded-lg p-4 space-y-3">
          <h2 className="font-semibold">Excluir conta</h2>
          <p className="text-sm text-muted-foreground">
            Isso apaga seu perfil e os desenhos salvos. Não dá para desfazer.
          </p>
          {!confirmDelete ? (
            <Button variant="destructive" type="button" onClick={() => setConfirmDelete(true)}>
              Excluir conta
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="destructive" type="button" disabled={deleting} onClick={handleDelete}>
                {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            await signOut();
            navigate('/');
          }}
        >
          Sair
        </Button>
      </div>
    </PageShell>
  );
};

export default Perfil;
