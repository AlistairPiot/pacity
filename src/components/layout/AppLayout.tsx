import { NavLink, Outlet } from 'react-router-dom'
import { Building2, Coins, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function AppLayout() {
  const { profile, balance, signOut } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
    )

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-semibold">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[oklch(0.42_0.24_293)] text-primary-foreground shadow-sm shadow-primary/40">
                <Building2 className="size-4.5" />
              </div>
              <span className="font-display text-lg tracking-tight">Pacity</span>
            </div>
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink to="/" end className={navLinkClass}>
                Salles
              </NavLink>
              <NavLink to="/my-reservations" className={navLinkClass}>
                Mes réservations
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className={navLinkClass}>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5" /> Admin
                  </span>
                </NavLink>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div
              key={balance}
              className="animate-scale-pop flex items-center gap-1.5 rounded-full border border-primary/20 bg-gradient-to-r from-accent to-secondary/60 px-3 py-1.5 text-sm font-medium shadow-sm"
            >
              <Coins className="size-4 text-primary" />
              <span>{balance}</span>
              <span className="hidden text-muted-foreground sm:inline">crédits</span>
            </div>
            <div className="hidden flex-col items-end leading-tight sm:flex">
              <span className="text-sm font-medium">{profile?.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {profile?.subscription_type === 'full_time' ? 'Full Time' : 'Nomad'}
              </span>
            </div>
            <Avatar>
              <AvatarFallback>{profile ? initials(profile.name) : '?'}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={signOut} title="Se déconnecter">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto border-t px-4 py-2 sm:hidden">
          <NavLink to="/" end className={navLinkClass}>
            Salles
          </NavLink>
          <NavLink to="/my-reservations" className={navLinkClass}>
            Réservations
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
