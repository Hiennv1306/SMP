create or replace function public.admin_confirm_payment(
  p_payment_id integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_admin_id integer;
begin
  select role, id
  into v_role, v_admin_id
  from public.users
  where auth_user_id = auth.uid();

  if v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  end if;

  if not exists (
    select 1
    from public.payments
    where id = p_payment_id
  ) then
    return jsonb_build_object('ok', false, 'code', 'PAYMENT_NOT_FOUND');
  end if;

  update public.payments
  set
    status = 'paid',
    bank_transaction_id = coalesce(
      bank_transaction_id,
      'ADMIN-' || lpad(p_payment_id::text, 8, '0')
    ),
    verified_at = coalesce(verified_at, now()),
    verified_by = coalesce(verified_by, v_admin_id),
    paid_at = coalesce(paid_at, now())
  where id = p_payment_id
    and status = 'unpaid';

  if not found then
    return jsonb_build_object('ok', false, 'code', 'PAYMENT_ALREADY_PROCESSED');
  end if;

  return jsonb_build_object('ok', true, 'code', 'PAYMENT_CONFIRMED');
end;
$$;

revoke all on function public.admin_confirm_payment(integer) from public;
grant execute on function public.admin_confirm_payment(integer) to authenticated;

create or replace function public.admin_send_payment_notifications(
  p_payment_ids integer[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_admin_id integer;
  v_payment_id integer;
  v_sent_count integer := 0;
begin
  select role, id
  into v_role, v_admin_id
  from public.users
  where auth_user_id = auth.uid();

  if v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  end if;

  foreach v_payment_id in array p_payment_ids
  loop
    insert into public.notifications(
      user_id,
      title,
      message,
      type,
      payment_id,
      student_id,
      class_id,
      created_by
    )
    select
      s.parent_id,
      'Thong bao hoc phi',
      'Hoc phi thang ' || p.billing_month || ' cua con ban la '
        || to_char(p.amount, 'FM999G999G999') || ' d.',
      'tuition',
      p.id,
      s.id,
      e.class_id,
      v_admin_id
    from public.payments p
    join public.enrollments e on e.id = p.enrollment_id
    join public.students s on s.id = e.student_id
    where p.id = v_payment_id
      and p.status = 'unpaid';

    if found then
      v_sent_count := v_sent_count + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'sentCount', v_sent_count
  );
end;
$$;

revoke all on function public.admin_send_payment_notifications(integer[]) from public;
grant execute on function public.admin_send_payment_notifications(integer[]) to authenticated;
