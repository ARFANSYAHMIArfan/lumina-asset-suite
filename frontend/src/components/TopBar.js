import React from 'react';
import { Radio, ExternalLink, LogOut, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../lib/AuthContext';
import { LiveIndicator } from '../components/LiveIndicator';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '../components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function TopBar({ isLive, onPopOut }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  };

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-card px-4"
      data-testid="topbar"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Radio className="h-4 w-4" />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">LUMINA</p>
          <p className="text-xs font-semibold tracking-tight">ASSET SUITE</p>
        </div>
        <div className="ml-3 hidden items-center gap-2 rounded-md border border-border/70 bg-background px-2 py-1 sm:flex">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">MCR</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/80">v1.0</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LiveIndicator isLive={isLive} />
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onPopOut}
          variant="outline"
          size="sm"
          className="h-9 gap-2 bg-transparent border-border/80 hover:bg-white/5"
          data-testid="popout-display-button"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="hidden font-medium tracking-tight sm:inline">Pop-out Display</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 bg-transparent border-border/80 hover:bg-white/5" data-testid="user-menu-button">
              <User className="h-4 w-4" />
              <span className="hidden max-w-[120px] truncate font-mono text-xs sm:inline">{user?.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border/80">
            <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Operator
            </DropdownMenuLabel>
            <div className="px-2 py-1.5 text-xs text-foreground/90">{user?.email}</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive" data-testid="logout-button">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
