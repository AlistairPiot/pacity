import { useEffect, useMemo, useRef, useState } from 'react'
import { Coins, Loader2, CalendarCheck2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatHourLabel, hourSlots } from '@/lib/slots'

interface SlotCalendarProps {
  bookedHours: Set<number>
  pastHours: Set<number>
  creditsPerHour: number
  balance: number
  canBook: boolean
  disabledMessage?: string
  submitting: boolean
  onConfirm: (startHour: number, durationHours: number) => void
}

export function SlotCalendar({
  bookedHours,
  pastHours,
  creditsPerHour,
  balance,
  canBook,
  disabledMessage,
  submitting,
  onConfirm,
}: SlotCalendarProps) {
  const hours = useMemo(() => hourSlots(), [])
  const [selection, setSelection] = useState<number[]>([])
  const [dragAnchor, setDragAnchor] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // reset selection whenever the underlying availability changes (e.g. date switch)
    setSelection([])
    setDragAnchor(null)
    setIsDragging(false)
  }, [bookedHours, pastHours])

  useEffect(() => {
    function onUp() {
      setIsDragging(false)
      setDragAnchor(null)
    }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [])

  const isUnavailable = (h: number) => bookedHours.has(h) || pastHours.has(h)

  function contiguousFreeRange(a: number, b: number): number[] | null {
    const lo = Math.min(a, b)
    const hi = Math.max(a, b)
    const range: number[] = []
    for (let h = lo; h <= hi; h++) {
      if (isUnavailable(h)) return null
      range.push(h)
    }
    return range
  }

  function handleMouseDown(h: number) {
    if (isUnavailable(h)) return
    if (selection.length === 1 && selection[0] === h) {
      setSelection([])
      return
    }
    setDragAnchor(h)
    setSelection([h])
    setIsDragging(true)
  }

  function handleMouseEnter(h: number) {
    setHoveredHour(h)
    if (!isDragging || dragAnchor === null) return
    const range = contiguousFreeRange(dragAnchor, h)
    if (range) setSelection(range)
  }

  const duration = selection.length
  const cost = duration * creditsPerHour
  const insufficientBalance = cost > balance
  const confirmDisabled = !canBook || duration === 0 || insufficientBalance || submitting

  let confirmMessage: string | null = null
  if (!canBook) confirmMessage = disabledMessage ?? 'Réservation impossible.'
  else if (duration > 0 && insufficientBalance)
    confirmMessage = `Solde insuffisant : il te manque ${cost - balance} crédit${cost - balance > 1 ? 's' : ''}.`

  return (
    <div className="flex flex-col gap-5">
      <div
        ref={gridRef}
        className="grid select-none grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
        onMouseLeave={() => setHoveredHour(null)}
      >
        {hours.map((h) => {
          const booked = bookedHours.has(h)
          const past = pastHours.has(h)
          const unavailable = booked || past
          const selected = selection.includes(h)
          const isEdge = selected && (h === Math.min(...selection) || h === Math.max(...selection))

          return (
            <button
              key={h}
              type="button"
              disabled={unavailable}
              onMouseDown={() => handleMouseDown(h)}
              onMouseEnter={() => handleMouseEnter(h)}
              className={cn(
                'group relative flex h-14 items-center justify-between rounded-lg border px-4 text-sm font-medium transition-all duration-150',
                unavailable &&
                  'cursor-not-allowed border-border/60 bg-muted text-muted-foreground/60 line-through decoration-muted-foreground/40',
                !unavailable &&
                  !selected &&
                  'cursor-pointer border-border bg-card hover:border-primary/50 hover:bg-accent hover:shadow-sm',
                selected &&
                  'cursor-pointer border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30',
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    booked ? 'bg-muted-foreground/40' : selected ? 'bg-primary-foreground' : 'bg-success',
                  )}
                />
                {formatHourLabel(h)} – {formatHourLabel(h + 1)}
              </span>
              {booked && <span className="text-xs uppercase tracking-wide">Réservé</span>}
              {selected && isEdge && <CalendarCheck2 className="size-4" />}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-gradient-to-br from-accent/40 to-transparent p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">
            {duration === 0
              ? hoveredHour !== null && !isUnavailable(hoveredHour)
                ? `Clique-glisse pour sélectionner un ou plusieurs créneaux dès ${formatHourLabel(hoveredHour)}`
                : 'Sélectionne un ou plusieurs créneaux libres et contigus'
              : `${duration} heure${duration > 1 ? 's' : ''} sélectionnée${duration > 1 ? 's' : ''} · ${formatHourLabel(selection[0])} – ${formatHourLabel(selection[0] + duration)}`}
          </span>
          <div className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Coins className="size-5 text-primary" />
            {cost} <span className="text-base font-normal text-muted-foreground">crédit{cost > 1 ? 's' : ''}</span>
          </div>
          {confirmMessage && <span className="text-sm font-medium text-destructive">{confirmMessage}</span>}
        </div>
        <Button
          size="lg"
          disabled={confirmDisabled}
          onClick={() => selection.length > 0 && onConfirm(selection[0], duration)}
          className="min-w-48"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Confirmation...
            </>
          ) : (
            'Confirmer la réservation'
          )}
        </Button>
      </div>
    </div>
  )
}
