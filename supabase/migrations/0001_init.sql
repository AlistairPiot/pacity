-- Pacity MVP schema
create extension if not exists pgcrypto;

create type subscription_type as enum ('nomad', 'full_time');
create type user_role as enum ('member', 'admin');
create type room_status as enum ('available', 'unavailable');
create type reservation_status as enum ('confirmed', 'cancelled');
create type transaction_type as enum ('monthly_renewal', 'booking_debit', 'cancellation_refund');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  subscription_type subscription_type not null default 'nomad',
  role user_role not null default 'member',
  created_at timestamptz not null default now()
);

create table rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity integer not null,
  usage_type text not null,
  credits_per_hour numeric not null,
  equipment text,
  photo_url text,
  status room_status not null default 'available',
  unavailable_reason text,
  created_at timestamptz not null default now()
);

create table reservations (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references profiles(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete cascade,
  date date not null,
  start_time time not null,
  duration_hours numeric not null check (duration_hours > 0),
  credits_consumed numeric not null,
  status reservation_status not null default 'confirmed',
  created_at timestamptz not null default now()
);

create table credit_transactions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references profiles(id) on delete cascade,
  type transaction_type not null,
  amount numeric not null,
  reservation_id uuid references reservations(id) on delete set null,
  created_at timestamptz not null default now()
);

create index on reservations (room_id, date);
create index on reservations (member_id);
create index on credit_transactions (member_id);

-- ---------------------------------------------------------------------------
-- Balance view (security_invoker so caller's RLS on credit_transactions applies)
-- ---------------------------------------------------------------------------

create view member_credit_balance
with (security_invoker = true) as
  select member_id, coalesce(sum(amount), 0)::numeric as balance
  from credit_transactions
  group by member_id;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Auto-create a profile row when a new auth user signs up
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------------------------
-- Booking RPCs (SECURITY DEFINER: centralize authorization + keep the credit
-- ledger consistent instead of trusting client-side writes)
-- ---------------------------------------------------------------------------

create or replace function create_reservation(
  p_room_id uuid,
  p_date date,
  p_start_time time,
  p_duration_hours numeric
)
returns reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid := auth.uid();
  v_credits_per_hour numeric;
  v_room_status room_status;
  v_cost numeric;
  v_balance numeric;
  v_end_time time;
  v_reservation reservations;
begin
  if v_member_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_duration_hours <= 0 then
    raise exception 'Invalid duration';
  end if;

  select credits_per_hour, status into v_credits_per_hour, v_room_status
  from rooms where id = p_room_id;

  if not found then
    raise exception 'Room not found';
  end if;
  if v_room_status <> 'available' then
    raise exception 'Room is not available';
  end if;

  v_end_time := p_start_time + (p_duration_hours || ' hours')::interval;
  v_cost := p_duration_hours * v_credits_per_hour;

  if exists (
    select 1 from reservations
    where room_id = p_room_id
      and date = p_date
      and status = 'confirmed'
      and start_time < v_end_time
      and (start_time + (duration_hours || ' hours')::interval) > p_start_time
  ) then
    raise exception 'Time slot overlaps an existing reservation';
  end if;

  select coalesce(sum(amount), 0) into v_balance
  from credit_transactions where member_id = v_member_id;

  if v_balance < v_cost then
    raise exception 'Insufficient credit balance';
  end if;

  insert into reservations (member_id, room_id, date, start_time, duration_hours, credits_consumed, status)
  values (v_member_id, p_room_id, p_date, p_start_time, p_duration_hours, v_cost, 'confirmed')
  returning * into v_reservation;

  insert into credit_transactions (member_id, type, amount, reservation_id)
  values (v_member_id, 'booking_debit', -v_cost, v_reservation.id);

  return v_reservation;
end;
$$;

create or replace function cancel_reservation(p_reservation_id uuid)
returns reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_reservation reservations;
begin
  select * into v_reservation from reservations where id = p_reservation_id;

  if not found then
    raise exception 'Reservation not found';
  end if;
  if v_reservation.member_id <> v_uid and not is_admin() then
    raise exception 'Not authorized';
  end if;
  if v_reservation.status <> 'confirmed' then
    raise exception 'Reservation already cancelled';
  end if;

  update reservations set status = 'cancelled'
  where id = p_reservation_id
  returning * into v_reservation;

  insert into credit_transactions (member_id, type, amount, reservation_id)
  values (v_reservation.member_id, 'cancellation_refund', v_reservation.credits_consumed, v_reservation.id);

  return v_reservation;
end;
$$;

grant execute on function create_reservation(uuid, date, time, numeric) to authenticated;
grant execute on function cancel_reservation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table rooms enable row level security;
alter table reservations enable row level security;
alter table credit_transactions enable row level security;

create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or is_admin());

create policy "profiles_update_own_or_admin" on profiles
  for update using (id = auth.uid() or is_admin());

create policy "rooms_select_authenticated" on rooms
  for select using (auth.role() = 'authenticated');

create policy "reservations_select_own_or_admin" on reservations
  for select using (member_id = auth.uid() or is_admin());

create policy "credit_transactions_select_own_or_admin" on credit_transactions
  for select using (member_id = auth.uid() or is_admin());

-- Writes to reservations / credit_transactions only happen through the
-- SECURITY DEFINER RPCs above, which enforce their own authorization and
-- run with elevated privileges (no client-facing insert/update policy needed).
