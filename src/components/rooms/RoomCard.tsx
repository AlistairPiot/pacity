import { Link } from 'react-router-dom'
import { Users, Zap, AlertCircle } from 'lucide-react'
import type { Room } from '@/lib/database.types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function RoomCard({ room }: { room: Room }) {
  const isAvailable = room.status === 'available'
  const content = (
    <Card className="group h-full overflow-hidden py-0">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={room.photo_url ?? ''}
          alt={room.name}
          className={cnImg(isAvailable)}
          loading="lazy"
        />
        <div className="absolute right-3 top-3">
          <Badge variant={isAvailable ? 'success' : 'secondary'} className="shadow-sm">
            {isAvailable ? 'Disponible' : 'Indisponible'}
          </Badge>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-5 pb-5 pt-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold">{room.name}</h3>
            <p className="text-sm text-muted-foreground">{room.usage_type}</p>
          </div>
          <div className="flex items-center gap-1 whitespace-nowrap rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
            <Zap className="size-3" />
            {room.credits_per_hour} cr/h
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4" />
          {room.capacity} pers.
        </div>
        {!isAvailable && room.unavailable_reason && (
          <div className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {room.unavailable_reason}
          </div>
        )}
      </div>
    </Card>
  )

  if (!isAvailable) {
    return <div className="cursor-not-allowed opacity-75">{content}</div>
  }

  return (
    <Link to={`/rooms/${room.id}`} className="block transition-transform duration-200 hover:-translate-y-1">
      {content}
    </Link>
  )
}

function cnImg(isAvailable: boolean) {
  return [
    'size-full object-cover transition-transform duration-500',
    isAvailable ? 'group-hover:scale-105' : 'grayscale',
  ].join(' ')
}
