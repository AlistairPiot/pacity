-- Split from 0003: an added enum value can't be referenced in the same
-- transaction it was created in, so this RPC (which uses 'credit_purchase'
-- as an enum literal) is applied as a separate migration/psql session.

create or replace function purchase_credits(p_amount numeric)
returns credit_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid := auth.uid();
  v_subscription subscription_type;
  v_transaction credit_transactions;
begin
  if v_member_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount not in (10, 25, 50) then
    raise exception 'Invalid credit pack';
  end if;

  select subscription_type into v_subscription from profiles where id = v_member_id;

  if v_subscription <> 'full_time' then
    raise exception 'Only full_time members can purchase additional credits';
  end if;

  insert into credit_transactions (member_id, type, amount)
  values (v_member_id, 'credit_purchase', p_amount)
  returning * into v_transaction;

  return v_transaction;
end;
$$;

grant execute on function purchase_credits(numeric) to authenticated;
