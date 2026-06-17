import { useNavigate, Link } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { RelayStatus } from '@/components/dashboard/RelayStatus';
import { useAuth } from '@/hooks/useAuth';
import { Gamepad2, Monitor, ExternalLink, LogOut } from 'lucide-react';

const tabs = [
  { to: '/creator', label: 'Kreator' },
  { to: '/studio', label: 'Studio' },
  { to: '/admin', label: 'Admin' },
  { to: '/v2/admin/players', label: 'Gracze (v2)' },
  { to: '/relay', label: 'Relay' },
];

export function TopNav() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex items-center justify-between h-14 gap-4">
        <div className="flex items-center gap-6">
          <Link to="/creator" className="flex items-center gap-2 shrink-0">
            <Gamepad2 className="h-6 w-6 text-primary" />
            <span className="text-base font-bold">RL Broadcast</span>
          </Link>
          <nav className="flex items-center gap-1">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                activeClassName="bg-secondary text-foreground"
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <RelayStatus />
          <Button variant="ghost" size="sm" onClick={() => window.open('/v2/overlay', '_blank')}>
            <Monitor className="mr-2 h-4 w-4" />
            Overlay
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Wyloguj">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}