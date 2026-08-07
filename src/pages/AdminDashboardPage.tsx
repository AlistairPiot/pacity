import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile, Reservation, Room } from '@/lib/database.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ReservationRow = Reservation & { room: Room; member: Profile }

export function AdminDashboardPage() {
  const [reservations, setReservations] = useState<ReservationRow[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const [roomFilter, setRoomFilter] = useState<string>('all')
  const [memberFilter, setMemberFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')

  const load = useCallback(async () => {
    const [{ data: resData }, { data: roomData }, { data: memberData }] = await Promise.all([
      supabase
        .from('reservations')
        .select('*, room:rooms(*), member:profiles(*)')
        .order('date', { ascending: false })
        .order('start_time', { ascending: false }),
      supabase.from('rooms').select('*').order('name'),
      supabase.from('profiles').select('*').order('name'),
    ])
    setReservations((resData as ReservationRow[]) ?? [])
    setRooms(roomData ?? [])
    setMembers(memberData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (roomFilter !== 'all' && r.room_id !== roomFilter) return false
      if (memberFilter !== 'all' && r.member_id !== memberFilter) return false
      if (dateFilter && r.date !== dateFilter) return false
      return true
    })
  }, [reservations, roomFilter, memberFilter, dateFilter])

  async function handleCancel(id: string) {
    setCancellingId(id)
    await supabase.rpc('cancel_reservation', { p_reservation_id: id })
    setCancellingId(null)
    await load()
  }

  const stats = useMemo(
    () => ({
      total: reservations.length,
      confirmed: reservations.filter((r) => r.status === 'confirmed').length,
      creditsBooked: reservations
        .filter((r) => r.status === 'confirmed')
        .reduce((sum, r) => sum + r.credits_consumed, 0),
    }),
    [reservations],
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-up flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Dashboard admin</h1>
          <p className="text-muted-foreground">Toutes les réservations de Pacity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Réservations totales" value={stats.total} delay={0} />
        <StatCard label="Confirmées" value={stats.confirmed} delay={60} />
        <StatCard label="Crédits engagés" value={stats.creditsBooked} delay={120} />
      </div>

      <Card className="animate-fade-in-up" style={{ animationDelay: '140ms' }}>
        <CardHeader>
          <CardTitle className="text-base">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pb-6 sm:flex-row">
          <Select value={roomFilter} onValueChange={setRoomFilter}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Salle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les salles</SelectItem>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={memberFilter} onValueChange={setMemberFilter}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Membre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les membres</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="sm:w-48"
          />
          {(roomFilter !== 'all' || memberFilter !== 'all' || dateFilter) && (
            <Button
              variant="ghost"
              onClick={() => {
                setRoomFilter('all')
                setMemberFilter('all')
                setDateFilter('')
              }}
            >
              Réinitialiser
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up overflow-hidden py-0" style={{ animationDelay: '200ms' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Membre</th>
                <th className="px-4 py-3 font-medium">Salle</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Créneau</th>
                <th className="px-4 py-3 font-medium">Crédits</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Aucune réservation ne correspond aux filtres.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-b transition-colors last:border-0 hover:bg-accent/40">
                    <td className="px-4 py-3 font-medium">{r.member.name}</td>
                    <td className="px-4 py-3">{r.room.name}</td>
                    <td className="px-4 py-3 capitalize">
                      {format(new Date(`${r.date}T00:00:00`), 'd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-4 py-3">
                      {r.start_time.slice(0, 5)} ({r.duration_hours}h)
                    </td>
                    <td className="px-4 py-3">{r.credits_consumed}</td>
                    <td className="px-4 py-3">
                      <Badge variant={r.status === 'confirmed' ? 'success' : 'destructive'}>
                        {r.status === 'confirmed' ? 'Confirmée' : 'Annulée'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'confirmed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={cancellingId === r.id}
                          onClick={() => handleCancel(r.id)}
                        >
                          {cancellingId === r.id ? '...' : 'Annuler'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function StatCard({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <CardContent className="py-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display mt-1 text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}
