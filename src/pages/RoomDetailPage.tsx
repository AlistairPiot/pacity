import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addDays, format, isSameDay, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, Users, Zap, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Room } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SlotCalendar } from '@/components/booking/SlotCalendar'
import { cn } from '@/lib/utils'
import { hourToTime, reservationHourRange } from '@/lib/slots'

const DAYS_AHEAD = 14

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile, balance, refreshBalance } = useAuth()

  const [room, setRoom] = useState<Room | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const [bookings, setBookings] = useState<{ start_time: string; duration_hours: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (!id) return
    supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setRoom(data)
        setLoading(false)
      })
  }, [id])

  const loadReservations = useCallback(async () => {
    if (!id) return
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const { data } = await supabase.rpc('get_room_bookings', {
      p_room_id: id,
      p_date: dateStr,
    })
    setBookings(data ?? [])
  }, [id, selectedDate])

  useEffect(() => {
    loadReservations()
  }, [loadReservations])

  const days = useMemo(
    () => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(startOfDay(new Date()), i)),
    [],
  )

  const bookedHours = useMemo(() => {
    const set = new Set<number>()
    for (const b of bookings) {
      for (const h of reservationHourRange(b.start_time, b.duration_hours)) set.add(h)
    }
    return set
  }, [bookings])

  const pastHours = useMemo(() => {
    const set = new Set<number>()
    if (isSameDay(selectedDate, new Date())) {
      const currentHour = new Date().getHours()
      for (let h = 0; h <= currentHour; h++) set.add(h)
    }
    return set
  }, [selectedDate])

  const canBook = (profile?.subscription_type ?? 'nomad') !== 'nomad' && room?.status === 'available'
  const disabledMessage =
    profile?.subscription_type === 'nomad'
      ? "L'abonnement Nomad ne permet pas de réserver de salle."
      : room?.status !== 'available'
        ? 'Cette salle est actuellement indisponible.'
        : undefined

  async function handleConfirm(startHour: number, durationHours: number) {
    if (!id) return
    setSubmitting(true)
    setFeedback(null)
    const { error } = await supabase.rpc('create_reservation', {
      p_room_id: id,
      p_date: format(selectedDate, 'yyyy-MM-dd'),
      p_start_time: hourToTime(startHour),
      p_duration_hours: durationHours,
    })
    setSubmitting(false)
    if (error) {
      setFeedback({ type: 'error', message: error.message })
      return
    }
    setFeedback({ type: 'success', message: 'Réservation confirmée !' })
    await Promise.all([loadReservations(), refreshBalance()])
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Chargement...</div>
  }

  if (!room) {
    return <div className="text-muted-foreground">Salle introuvable.</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate('/')}>
        <ArrowLeft className="size-4" /> Retour aux salles
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <div className="animate-fade-in-up flex flex-col gap-4">
          <div className="aspect-4/3 overflow-hidden rounded-xl border shadow-sm">
            <img src={room.photo_url ?? ''} alt={room.name} className="size-full object-cover" />
          </div>
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold tracking-tight">{room.name}</h1>
              <Badge variant={room.status === 'available' ? 'success' : 'secondary'}>
                {room.status === 'available' ? 'Disponible' : 'Indisponible'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{room.usage_type}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <Users className="size-4 text-muted-foreground" /> {room.capacity} pers.
              </span>
              <span className="flex items-center gap-1.5 font-medium text-primary">
                <Zap className="size-4" /> {room.credits_per_hour} crédit{room.credits_per_hour > 1 ? 's' : ''}/h
              </span>
            </div>
            {room.equipment && (
              <div className="border-t pt-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Équipement : </span>
                {room.equipment}
              </div>
            )}
            {room.status !== 'available' && room.unavailable_reason && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {room.unavailable_reason}
              </div>
            )}
          </div>
        </div>

        <div className="animate-fade-in-up flex flex-col gap-5" style={{ animationDelay: '80ms' }}>
          <div>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Choisis une date</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {days.map((d) => {
                const active = isSameDay(d, selectedDate)
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => setSelectedDate(d)}
                    className={cn(
                      'flex min-w-16 flex-col items-center rounded-lg border px-3 py-2 text-sm transition-all duration-200',
                      active
                        ? 'scale-105 border-primary bg-gradient-to-br from-primary to-[oklch(0.44_0.23_293)] text-primary-foreground shadow-md shadow-primary/30'
                        : 'border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent hover:shadow-sm',
                    )}
                  >
                    <span className="text-xs capitalize opacity-80">{format(d, 'EEE', { locale: fr })}</span>
                    <span className="text-base font-semibold">{format(d, 'd')}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {feedback && (
            <div
              className={cn(
                'animate-fade-in-up flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium',
                feedback.type === 'success' ? 'bg-success/15 text-success' : 'bg-destructive/10 text-destructive',
              )}
            >
              {feedback.type === 'success' ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
              {feedback.message}
            </div>
          )}

          <SlotCalendar
            bookedHours={bookedHours}
            pastHours={pastHours}
            creditsPerHour={room.credits_per_hour}
            balance={balance}
            canBook={canBook}
            disabledMessage={disabledMessage}
            submitting={submitting}
            onConfirm={handleConfirm}
          />
        </div>
      </div>
    </div>
  )
}
