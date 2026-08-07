import { useState } from 'react'
import { Coins, Loader2, Plus, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const PACKS = [
  { amount: 10, tagline: 'Petit complément', highlight: false },
  { amount: 25, tagline: 'Le plus populaire', highlight: true },
  { amount: 50, tagline: 'Gros besoin ce mois-ci', highlight: false },
] as const

export function BuyCreditsDialog() {
  const { refreshBalance } = useAuth()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<number>(25)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePurchase() {
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.rpc('purchase_credits', { p_amount: selected })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    await refreshBalance()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="size-3.5" /> Recharger
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> Acheter des crédits
          </DialogTitle>
          <DialogDescription>
            En plus de ton renouvellement mensuel. Crédits ajoutés instantanément — aucun paiement réel
            n&apos;est effectué dans cette démo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-2">
          {PACKS.map((pack) => {
            const active = selected === pack.amount
            return (
              <button
                key={pack.amount}
                type="button"
                onClick={() => setSelected(pack.amount)}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 text-center transition-all duration-150',
                  active
                    ? 'border-primary bg-primary/5 shadow-[0_0_0_3px] shadow-primary/15'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-accent',
                )}
              >
                {pack.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-primary to-[oklch(0.44_0.23_293)] px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
                    Populaire
                  </span>
                )}
                <Coins className={cn('size-5', active ? 'text-primary' : 'text-muted-foreground')} />
                <span className="text-xl font-semibold tracking-tight">{pack.amount}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">{pack.tagline}</span>
              </button>
            )
          })}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button onClick={handlePurchase} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Traitement...
              </>
            ) : (
              `Ajouter ${selected} crédits`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
