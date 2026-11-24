create or replace function public.teacher_create_monthly_invoices(
  p_class_id integer,
  p_student_ids integer[],
  p_billing_month character varying
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_teacher_id integer;
  v_month_start date;
  v_month_end date;
  v_student_id integer;
  v_enrollment_id integer;
  v_payment_id integer;
  v_absent_count integer;
  v_amount numeric;
  v_created_count integer := 0;
  v_updated_count integer := 0;
  v_skipped_count integer := 0;
begin
  select u.role, t.id
  into v_role, v_teacher_id
  from public.users u
  left join public.teachers t on t.user_id = u.id
  where u.auth_user_id = auth.uid();

  if v_role <> 'teacher' or v_teacher_id is null then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  end if;

  if not exists (
    select 1
    from public.classes
    where id = p_class_id
      and teacher_id = v_teacher_id
  ) then
    return jsonb_build_object('ok', false, 'code', 'NOT_CLASS_TEACHER');
  end if;

  if p_billing_month is null
    or p_billing_month !~ '^[0-9]{2}/[0-9]{4}$'
    or substring(p_billing_month from 1 for 2)::integer not between 1 and 12 then
    return jsonb_build_object('ok', false, 'code', 'INVALID_BILLING_MONTH');
  end if;

  if coalesce(cardinality(p_student_ids), 0) = 0 then
    return jsonb_build_object('ok', false, 'code', 'NO_STUDENTS_SELECTED');
  end if;

  v_month_start := make_date(
    substring(p_billing_month from 4 for 4)::integer,
    substring(p_billing_month from 1 for 2)::integer,
    1
  );
  v_month_end := (v_month_start + interval '1 month' - interval '1 day')::date;

  for v_student_id in
    select distinct requested.student_id
    from unnest(p_student_ids) as requested(student_id)
  loop
    select e.id
    into v_enrollment_id
    from public.enrollments e
    where e.class_id = p_class_id
      and e.student_id = v_student_id
      and e.status = 'active';

    if v_enrollment_id is null then
      v_skipped_count := v_skipped_count + 1;
      continue;
    end if;

    select count(distinct a.session_id)
    into v_absent_count
    from public.attendances a
    join public.class_sessions cs on cs.id = a.session_id
    where a.student_id = v_student_id
      and cs.class_id = p_class_id
      and cs.session_date between v_month_start and v_month_end
      and a.status = 'absent';

    v_amount := greatest(8 - coalesce(v_absent_count, 0), 0) * 35000;

    select p.id
    into v_payment_id
    from public.payments p
    where p.enrollment_id = v_enrollment_id
      and p.billing_month = p_billing_month
    limit 1;

    if v_payment_id is null then
      insert into public.payments(
        enrollment_id,
        billing_month,
        amount,
        status
      )
      values (
        v_enrollment_id,
        p_billing_month,
        v_amount,
        'unpaid'
      )
      returning id into v_payment_id;
      v_created_count := v_created_count + 1;
    else
      update public.payments
      set amount = v_amount
      where id = v_payment_id
        and status = 'unpaid';

      if found then
        v_updated_count := v_updated_count + 1;
      else
        v_skipped_count := v_skipped_count + 1;
      end if;
    end if;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'createdCount', v_created_count,
    'updatedCount', v_updated_count,
    'skippedCount', v_skipped_count
  );
end;
$$;

revoke all on function public.teacher_create_monthly_invoices(integer, integer[], character varying) from public;
grant execute on function public.teacher_create_monthly_invoices(integer, integer[], character varying) to authenticated;
