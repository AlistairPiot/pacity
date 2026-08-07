import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowDownCircle, ArrowUpCircle, RotateCcw, Coins, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CreditTransaction } from '@/lib/database.types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BuyCreditsDialog } from '@/components/credits/BuyCreditsDialog'
import { cn } from '@/lib/utils'

const TYPE_LABEL: Record<CreditTransaction['type'], string> = {
  monthly_renewal: 'Renouvellement mensuel',
  booking_debit: 'Réservation',
  cancellation_refund: 'Remboursement',
  credit_purchase: 'Achat de crédits',
}

const TYPE_ICON: Record<CreditTransaction['type'], typeof ArrowUpCircle> = {
  monthly_renewal: ArrowUpCircle,
  booking_debit: ArrowDownCircle,
  cancellation_refund: RotateCcw,
  credit_purchase: Sparkles,
}

export function CreditHistoryCard() {
  const { session, profile, balance } = useAuth()
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])

  useEffect(() => {
    if (!session?.user) return
    supabase
      .from('credit_transactions')
      .select('*')
      .eq('member_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setTransactions(data ?? []))
  }, [session?.user, balance])

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Solde &amp; historique</CardTitle>
        <div className="flex items-center gap-1.5 text-lg font-semibold text-primary">
          <Coins className="size-4" /> {balance}
        </div>
      </CardHeader>
      {profile?.subscription_type === 'full_time' && (
        <div className="px-6">
          <BuyCreditsDialog />
        </div>
      )}
      <CardContent className="pb-6">
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune transaction pour le moment.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {transactions.map((t) => {
              const Icon = TYPE_ICON[t.type]
              const positive = t.amount > 0
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full',
                        positive ? 'bg-success/15 text-success' : 'bg-destructive/10 text-destructive',
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{TYPE_LABEL[t.type]}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(t.created_at), 'd MMM yyyy · HH:mm', { locale: fr })}
                      </span>
                    </div>
                  </div>
                  <span className={cn('font-semibold', positive ? 'text-success' : 'text-destructive')}>
                    {positive ? '+' : ''}
                    {t.amount}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
