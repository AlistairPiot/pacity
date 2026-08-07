import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarX2, Coins, MapPin, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Reservation, Room } from '@/lib/database.types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type ReservationRow = Reservation & { room: Room }

export function MyReservationsPage() {
  const { session, refreshBalance } = useAuth()
  const [reservations, setReservations] = useState<ReservationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!session?.user) return
    const { data } = await supabase
      .from('reservations')
      .select('*, room:rooms(*)')
      .eq('member_id', session.user.id)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })
    setReservations((data as ReservationRow[]) ?? [])
    setLoading(false)
  }, [session?.user])

  useEffect(() => {
    load()
  }, [load])

  const now = new Date()
  const { upcoming, past } = useMemo(() => {
    const upcoming: ReservationRow[] = []
    const past: ReservationRow[] = []
    for (const r of reservations) {
      const end = new Date(`${r.date}T${r.start_time}`)
      end.setHours(end.getHours() + r.duration_hours)
      if (r.status === 'confirmed' && end > now) upcoming.push(r)
      else past.push(r)
    }
    return { upcoming, past }
  }, [reservations])

  async function handleCancel(id: string) {
    setCancellingId(id)
    const { error } = await supabase.rpc('cancel_reservation', { p_reservation_id: id })
    setCancellingId(null)
    if (!error) {
      await Promise.all([load(), refreshBalance()])
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Chargement...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-up">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Mes réservations</h1>
        <p className="mt-1 text-muted-foreground">Retrouve tes réservations à venir et passées.</p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">À venir ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Passées ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <ReservationList
            items={upcoming}
            emptyLabel="Aucune réservation à venir."
            onCancel={handleCancel}
            cancellingId={cancellingId}
            allowCancel
          />
        </TabsContent>
        <TabsContent value="past">
          <ReservationList items={past} emptyLabel="Aucune réservation passée." cancellingId={cancellingId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ReservationList({
  items,
  emptyLabel,
  onCancel,
  cancellingId,
  allowCancel = false,
}: {
  items: ReservationRow[]
  emptyLabel: string
  onCancel?: (id: string) => void
  cancellingId: string | null
  allowCancel?: boolean
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-muted-foreground">
        <CalendarX2 className="size-8" />
        <p>{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((r, i) => (
        <Card key={r.id} className="animate-fade-in-up py-0" style={{ animationDelay: `${i * 40}ms` }}>
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden size-14 shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm sm:block">
                <img src={r.room.photo_url ?? ''} alt={r.room.name} className="size-full object-cover" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.room.name}</span>
                  <Badge variant={r.status === 'confirmed' ? 'success' : 'destructive'}>
                    {r.status === 'confirmed' ? 'Confirmée' : 'Annulée'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {format(new Date(`${r.date}T00:00:00`), 'EEEE d MMMM yyyy', { locale: fr })}
                  </span>
                  <span>
                    {r.start_time.slice(0, 5)} – {addHours(r.start_time, r.duration_hours)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" /> {r.room.capacity} pers.
                  </span>
                  <span className="flex items-center gap-1 font-medium text-primary">
                    <Coins className="size-3.5" /> {r.credits_consumed} crédits
                  </span>
                </div>
              </div>
            </div>
            {allowCancel && r.status === 'confirmed' && onCancel && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={cancellingId === r.id}
                onClick={() => onCancel(r.id)}
              >
                {cancellingId === r.id ? 'Annulation...' : 'Annuler'}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function addHours(time: string, hours: number) {
  const h = Number(time.slice(0, 2)) + hours
  return `${String(h).padStart(2, '0')}:00`
}
