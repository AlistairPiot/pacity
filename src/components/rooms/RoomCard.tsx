import { Link } from 'react-router-dom'
import { Users, Zap, AlertCircle, ArrowUpRight } from 'lucide-react'
import type { Room } from '@/lib/database.types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function RoomCard({ room, index = 0 }: { room: Room; index?: number }) {
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
        <div className="absolute right-3 top-3">
          <Badge variant={isAvailable ? 'success' : 'secondary'} className="shadow-sm">
            {isAvailable ? 'Disponible' : 'Indisponible'}
          </Badge>
        </div>
        {isAvailable && (
          <div className="absolute bottom-3 right-3 flex size-9 translate-y-1 items-center justify-center rounded-full bg-white/90 text-primary opacity-0 shadow-md backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="size-4" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 px-5 pb-5 pt-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold">{room.name}</h3>
            <p className="text-sm text-muted-foreground">{room.usage_type}</p>
          </div>
          <div className="flex items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-br from-accent to-accent/60 px-2.5 py-1 text-xs font-semibold text-accent-foreground">
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

  const wrapperStyle = { animationDelay: `${index * 60}ms` }

  if (!isAvailable) {
    return (
      <div className="animate-fade-in-up cursor-not-allowed opacity-75" style={wrapperStyle}>
        {content}
      </div>
    )
  }

  return (
    <Link
      to={`/rooms/${room.id}`}
      className="animate-fade-in-up block transition-transform duration-200 hover:-translate-y-1"
      style={wrapperStyle}
    >
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
