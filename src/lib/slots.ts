export const DAY_START_HOUR = 8
export const DAY_END_HOUR = 20

export function hourSlots(): number[] {
  const slots: number[] = []
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) slots.push(h)
  return slots
}

export function hourToTime(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00:00`
}

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

/** Hours a reservation occupies, e.g. start 9, duration 2 -> [9, 10] */
export function reservationHourRange(startTime: string, durationHours: number): number[] {
  const startHour = Number(startTime.slice(0, 2))
  const hours: number[] = []
  for (let i = 0; i < durationHours; i++) hours.push(startHour + i)
  return hours
}
