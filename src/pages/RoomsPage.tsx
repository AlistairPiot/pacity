import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Room } from '@/lib/database.types'
import { RoomCard } from '@/components/rooms/RoomCard'
import { CreditHistoryCard } from '@/components/credits/CreditHistoryCard'
import { useAuth } from '@/contexts/AuthContext'

export function RoomsPage() {
  const { profile } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('rooms')
      .select('*')
      .order('credits_per_hour', { ascending: true })
      .then(({ data }) => {
        setRooms(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        <div className="animate-fade-in-up">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Bonjour {profile?.name?.split(' ')[0]}{' '}
            <span className="inline-block animate-[wave_2s_ease-in-out_1]">👋</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Choisis une salle pour consulter le calendrier et réserver un créneau.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-4/3 skeleton-shimmer rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room, i) => (
              <RoomCard key={room.id} room={room} index={i} />
            ))}
          </div>
        )}
      </div>

      <div className="animate-fade-in-up flex flex-col gap-5" style={{ animationDelay: '120ms' }}>
        <CreditHistoryCard />
      </div>
    </div>
  )
}
