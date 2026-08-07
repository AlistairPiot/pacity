// One-off seed script. Run with:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SEED_PASSWORD = 'Pacity2026!'

function todayPlus(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

async function main() {
  console.log('Seeding rooms...')
  const { data: rooms, error: roomsErr } = await supabase
    .from('rooms')
    .insert([
      {
        name: 'Phone Booth',
        capacity: 1,
        usage_type: 'Appels',
        credits_per_hour: 1,
        equipment: 'Casque, écran 15", prise secteur',
        photo_url:
          'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&q=80&auto=format&fit=crop',
        status: 'available',
      },
      {
        name: 'Small Room',
        capacity: 4,
        usage_type: 'Réunion',
        credits_per_hour: 2,
        equipment: 'Écran TV, visioconférence, tableau blanc',
        photo_url:
          'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&auto=format&fit=crop',
        status: 'available',
      },
      {
        name: 'Medium Room',
        capacity: 8,
        usage_type: 'Réunion',
        credits_per_hour: 3,
        equipment: 'Écran 65", visioconférence, tableau blanc, paperboard',
        photo_url:
          'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&q=80&auto=format&fit=crop',
        status: 'available',
      },
      {
        name: 'Large Room',
        capacity: 16,
        usage_type: 'Conférence',
        credits_per_hour: 5,
        equipment: 'Système audio, vidéoprojecteur, visioconférence',
        photo_url:
          'https://images.unsplash.com/photo-1560439514-4e9645039924?w=800&q=80&auto=format&fit=crop',
        status: 'unavailable',
        unavailable_reason: 'Travaux électriques en cours',
      },
    ])
    .select()

  if (roomsErr) throw roomsErr
  const roomByName = Object.fromEntries(rooms.map((r) => [r.name, r]))
  console.log(`  -> ${rooms.length} rooms`)

  console.log('Seeding members...')
  const members = [
    { name: 'Léa Martin', email: 'lea.martin@pacity.io', subscription_type: 'full_time', role: 'admin' },
    { name: 'Thomas Bernard', email: 'thomas.bernard@pacity.io', subscription_type: 'full_time', role: 'member' },
    { name: 'Sofia Rossi', email: 'sofia.rossi@pacity.io', subscription_type: 'full_time', role: 'member' },
    { name: 'Chloé Dubois', email: 'chloe.dubois@pacity.io', subscription_type: 'full_time', role: 'member' },
    { name: 'Karim Haddad', email: 'karim.haddad@pacity.io', subscription_type: 'nomad', role: 'member' },
  ]

  const profileByEmail = {}
  for (const m of members) {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: m.email,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: { name: m.name },
    })
    if (createErr) throw createErr

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .update({ name: m.name, subscription_type: m.subscription_type, role: m.role })
      .eq('id', created.user.id)
      .select()
      .single()
    if (profileErr) throw profileErr

    profileByEmail[m.email] = profile
    console.log(`  -> ${m.name} (${m.subscription_type}/${m.role})`)
  }

  console.log('Seeding monthly renewal transactions...')
  const fullTimeMembers = members.filter((m) => m.subscription_type === 'full_time')
  const { error: renewalErr } = await supabase.from('credit_transactions').insert(
    fullTimeMembers.map((m) => ({
      member_id: profileByEmail[m.email].id,
      type: 'monthly_renewal',
      amount: 20,
    })),
  )
  if (renewalErr) throw renewalErr
  console.log(`  -> ${fullTimeMembers.length} renewals`)

  console.log('Seeding demo reservations...')
  const demoReservations = [
    {
      email: 'thomas.bernard@pacity.io',
      room: 'Small Room',
      date: todayPlus(1),
      start_time: '10:00:00',
      duration_hours: 1,
    },
    {
      email: 'sofia.rossi@pacity.io',
      room: 'Medium Room',
      date: todayPlus(2),
      start_time: '14:00:00',
      duration_hours: 2,
    },
    {
      email: 'chloe.dubois@pacity.io',
      room: 'Phone Booth',
      date: todayPlus(-1),
      start_time: '09:00:00',
      duration_hours: 1,
    },
  ]

  for (const r of demoReservations) {
    const room = roomByName[r.room]
    const member = profileByEmail[r.email]
    const credits = r.duration_hours * room.credits_per_hour

    const { data: reservation, error: resErr } = await supabase
      .from('reservations')
      .insert({
        member_id: member.id,
        room_id: room.id,
        date: r.date,
        start_time: r.start_time,
        duration_hours: r.duration_hours,
        credits_consumed: credits,
        status: 'confirmed',
      })
      .select()
      .single()
    if (resErr) throw resErr

    const { error: debitErr } = await supabase.from('credit_transactions').insert({
      member_id: member.id,
      type: 'booking_debit',
      amount: -credits,
      reservation_id: reservation.id,
    })
    if (debitErr) throw debitErr
    console.log(`  -> ${r.email} / ${r.room} / ${r.date} ${r.start_time} (${credits} credits)`)
  }

  console.log('\nDone. Login password for all seeded members:', SEED_PASSWORD)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
