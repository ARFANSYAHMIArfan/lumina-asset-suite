import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Radio, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email dan kata laluan diperlukan');
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back, operator');
      navigate('/app', { replace: true });
    } catch (err) {
      toast.error(err?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Left brand panel */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden border-r border-border/70 bg-radial-orange p-10 lg:flex noise-overlay">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">SUITE</p>
            <h1 className="text-base font-semibold tracking-tight">LUMINA</h1>
          </div>
        </div>

        <div className="max-w-md">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">MASTER CONTROL ROOM</p>
          <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Broadcast-grade media operations.
          </h2>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Asset library, A/B preview bus, queue auto-play, 10-band EQ, and external display routing — built for operators who can't afford a missed cue.
          </p>
        </div>

        <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2EE59D]" /> SYSTEM READY
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> v1.0.0
          </span>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">SUITE</p>
                <h1 className="text-base font-semibold tracking-tight">LUMINA</h1>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">SIGN IN</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Operator console</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Authenticate to enter the control room.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="operator@studio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                autoComplete="email"
                required
                className="h-11 bg-card border-border/80 font-mono text-sm"
                data-testid="login-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                autoComplete="current-password"
                required
                className="h-11 bg-card border-border/80 font-mono text-sm"
                data-testid="login-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full bg-primary text-primary-foreground hover:bg-[hsl(var(--lumina-orange-hover))] font-semibold tracking-wide"
              data-testid="login-submit-button"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to Lumina?{' '}
            <Link to="/signup" className="text-primary hover:underline" data-testid="goto-signup-link">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
