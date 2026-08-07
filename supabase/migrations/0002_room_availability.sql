-- Members can only SELECT their own rows in `reservations` (RLS), which is
-- correct for privacy but meant the booking calendar couldn't see slots
-- taken by OTHER members, letting them select an already-booked slot (the
-- create_reservation RPC then correctly rejected it, but the UI didn't
-- reflect this). Expose just enough to render availability, with no member
-- identity attached.

create or replace function get_room_bookings(p_room_id uuid, p_date date)
returns table (start_time time, duration_hours numeric)
language sql
security definer
stable
set search_path = public
as $$
  select r.start_time, r.duration_hours
  from reservations r
  where r.room_id = p_room_id
    and r.date = p_date
    and r.status = 'confirmed';
$$;

grant execute on function get_room_bookings(uuid, date) to authenticated;
