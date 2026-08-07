import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Building2, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginPage() {
  const { session, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) setError('Email ou mot de passe incorrect.')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-drift absolute -top-40 -left-40 size-[28rem] rounded-full bg-primary/25 blur-[100px]" />
        <div
          className="animate-drift absolute -bottom-40 -right-32 size-[28rem] rounded-full bg-[oklch(0.75_0.15_230)]/20 blur-[110px]"
          style={{ animationDelay: '-6s' }}
        />
        <div
          className="animate-drift absolute top-1/3 right-1/4 size-72 rounded-full bg-accent/50 blur-[90px]"
          style={{ animationDelay: '-11s' }}
        />
        <svg className="absolute inset-0 size-full opacity-[0.35]" aria-hidden="true">
          <defs>
            <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="var(--border)" strokeWidth="1" />
            </pattern>
            <radialGradient id="fade" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="fade-mask">
              <rect width="100%" height="100%" fill="url(#fade)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" mask="url(#fade-mask)" />
        </svg>
      </div>

      <div className="relative flex w-full max-w-sm flex-col items-center">
        <div
          className="animate-fade-in-up mb-7 flex flex-col items-center gap-3 text-center"
          style={{ animationDelay: '40ms' }}
        >
          <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.42_0.24_293)] text-primary-foreground shadow-[0_8px_24px_-6px] shadow-primary/50">
            <Building2 className="size-7" />
          </div>
          <div>
            <h1 className="font-display text-[1.7rem] font-semibold tracking-tight text-foreground">
              Pacity
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Connecte-toi à ton espace coworking</p>
          </div>
        </div>

        <div
          className="animate-fade-in-up w-full rounded-2xl border border-border/60 bg-card/90 p-7 shadow-[0_1px_1px_rgba(0,0,0,0.02),0_20px_45px_-15px_rgba(80,20,180,0.25)] backdrop-blur-xl"
          style={{ animationDelay: '110ms' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="prenom.nom@pacity.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 text-left">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="animate-fade-in-up rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="group mt-1 w-full" size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p
          className="animate-fade-in-up mt-6 text-xs text-muted-foreground"
          style={{ animationDelay: '180ms' }}
        >
          Espace réservé aux membres du coworking Pacity
        </p>
      </div>
    </div>
  )
}
