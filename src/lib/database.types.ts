export type SubscriptionType = 'nomad' | 'full_time'
export type UserRole = 'member' | 'admin'
export type RoomStatus = 'available' | 'unavailable'
export type ReservationStatus = 'confirmed' | 'cancelled'
export type TransactionType = 'monthly_renewal' | 'booking_debit' | 'cancellation_refund'

export interface Profile {
  id: string
  name: string
  email: string
  subscription_type: SubscriptionType
  role: UserRole
  created_at: string
}

export interface Room {
  id: string
  name: string
  capacity: number
  usage_type: string
  credits_per_hour: number
  equipment: string | null
  photo_url: string | null
  status: RoomStatus
  unavailable_reason: string | null
  created_at: string
}

export interface Reservation {
  id: string
  member_id: string
  room_id: string
  date: string
  start_time: string
  duration_hours: number
  credits_consumed: number
  status: ReservationStatus
  created_at: string
}

export interface ReservationWithRelations extends Reservation {
  room: Room
  member: Profile
}

export interface CreditTransaction {
  id: string
  member_id: string
  type: TransactionType
  amount: number
  reservation_id: string | null
  created_at: string
}

export interface MemberCreditBalance {
  member_id: string
  balance: number
}
