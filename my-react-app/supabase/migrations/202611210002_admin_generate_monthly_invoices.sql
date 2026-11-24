create or replace function public.admin_generate_monthly_invoices(
  p_billing_month character varying,
  p_class_id integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_created_count integer := 0;
  v_skipped_count integer := 0;
  v_updated_count integer := 0;
  v_enrollment record;
  v_month_start date;
  v_month_end date;
  v_absent_count integer;
  v_attended_count integer;
  v_amount numeric;
  v_payment_id integer;
  v_payment_ids integer[] := '{}';
begin
  select role
  into v_role
  from public.users
  where auth_user_id = auth.uid();

  if v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  end if;

  if p_billing_month is null
    or p_billing_month !~ '^[0-9]{2}/[0-9]{4}$'
    or substring(p_billing_month from 1 for 2)::integer not between 1 and 12 then
    return jsonb_build_object('ok', false, 'code', 'INVALID_BILLING_MONTH');
  end if;

  v_month_start := make_date(
    substring(p_billing_month from 4 for 4)::integer,
    substring(p_billing_month from 1 for 2)::integer,
    1
  );
  v_month_end := (v_month_start + interval '1 month' - interval '1 day')::date;

  for v_enrollment in
    select e.id as enrollment_id, e.student_id, c.id as class_id
    from public.enrollments e
    join public.classes c on c.id = e.class_id
    where e.status = 'active'
      and c.status = 'open'
      and (p_class_id is null or e.class_id = p_class_id)
  loop
    select count(distinct cs.session_id)
    into v_absent_count
    from public.attendances cs
    join public.class_sessions s
      on s.id = cs.session_id
    where cs.student_id = v_enrollment.student_id
      and s.class_id = v_enrollment.class_id
      and s.session_date between v_month_start and v_month_end
      and cs.status = 'absent';

    v_attended_count := greatest(8 - coalesce(v_absent_count, 0), 0);
    v_amount := v_attended_count * 35000;

    select p.id
    into v_payment_id
      from public.payments p
    where p.enrollment_id = v_enrollment.enrollment_id
      and p.billing_month = p_billing_month
    limit 1;

    if v_payment_id is not null then
      update public.payments
      set amount = v_amount
      where id = v_payment_id
        and status = 'unpaid';

      if found then
        v_updated_count := v_updated_count + 1;
        v_payment_ids := array_append(v_payment_ids, v_payment_id);
      else
        v_skipped_count := v_skipped_count + 1;
      end if;
    else
      insert into public.payments(
        enrollment_id,
        billing_month,
        amount,
        status
      )
      values (
        v_enrollment.enrollment_id,
        p_billing_month,
        v_amount,
        'unpaid'
      )
      returning id into v_payment_id;
      v_created_count := v_created_count + 1;
      v_payment_ids := array_append(v_payment_ids, v_payment_id);
    end if;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'createdCount', v_created_count,
    'updatedCount', v_updated_count,
    'skippedCount', v_skipped_count,
    'paymentIds', v_payment_ids
  );
end;
$$;

revoke all on function public.admin_generate_monthly_invoices(character varying, integer) from public;
grant execute on function public.admin_generate_monthly_invoices(character varying, integer) to authenticated;
