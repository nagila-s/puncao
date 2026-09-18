import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center px-1.5 text-sm font-bold leading-none rounded-sm ${
    isActive ? 'bg-black/10' : 'hover:bg-black/5'
  }`;

const Dash = () => (
  <span className="mx-1 text-sm font-bold leading-none text-black/50 select-none" aria-hidden="true">
    |
  </span>
);

export const AppHeader = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const menu = user
    ? [
        { to: '/meus-desenhos', label: 'Meus desenhos' },
        { to: '/publicados', label: 'Desenhos públicos' },
        { to: '/perfil', label: 'Perfil' },
        ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
      ]
    : [];

  return (
    <header className="h-12 bg-[#F0C930] border-b flex items-center px-4 flex-shrink-0 font-bold">
      <div className="flex items-baseline min-w-0 overflow-x-auto">
        <Link to="/" className="flex items-baseline shrink-0 gap-2 mr-1">
          <img src="/favicon.png" alt="Logo Punção" className="h-6 w-auto self-center" />
          <h1 className="titulo-header m-0">Punção</h1>
        </Link>

        {menu.map((item) => (
          <span key={item.to} className="inline-flex items-baseline shrink-0">
            <Dash />
            <NavLink to={item.to} className={navClass}>
              {item.label}
            </NavLink>
          </span>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2 shrink-0 pl-3">
        {user ? (
          <>
            <span className="hidden md:inline text-sm leading-none max-w-[12rem] truncate font-bold">
              {profile?.display_name || user.email}
            </span>
            <Button size="sm" variant="outline" className="h-8 bg-white/70 font-bold leading-none" onClick={handleSignOut}>
              Sair
            </Button>
          </>
        ) : (
          <>
            <Button asChild size="sm" variant="outline" className="h-8 bg-white/70 font-bold leading-none">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="h-8 bg-black text-white hover:bg-black/90 font-bold leading-none">
              <Link to="/cadastro">Cadastrar</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
};
