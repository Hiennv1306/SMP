create or replace function public.teacher_preview_monthly_tuition(
  p_class_id integer,
  p_billing_month character varying
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id integer;
  v_role text;
  v_month_start date;
  v_month_end date;
  v_students jsonb;
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

  v_month_start := make_date(
    substring(p_billing_month from 4 for 4)::integer,
    substring(p_billing_month from 1 for 2)::integer,
    1
  );
  v_month_end := (v_month_start + interval '1 month' - interval '1 day')::date;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'studentId', s.id,
      'studentCode', 'HV' || lpad(s.id::text, 4, '0'),
      'studentName', s.full_name,
      'parentName', coalesce(pu.full_name, ''),
      'absentCount', (
        select count(*)
        from public.attendances a
        join public.class_sessions cs on cs.id = a.session_id
        where a.student_id = s.id
          and cs.class_id = p_class_id
          and cs.session_date between v_month_start and v_month_end
          and a.status = 'absent'
      ),
      'chargeableSessions', greatest(8 - (
        select count(*)
        from public.attendances a
        join public.class_sessions cs on cs.id = a.session_id
        where a.student_id = s.id
          and cs.class_id = p_class_id
          and cs.session_date between v_month_start and v_month_end
          and a.status = 'absent'
      ), 0),
      'amount', greatest(8 - (
        select count(*)
        from public.attendances a
        join public.class_sessions cs on cs.id = a.session_id
        where a.student_id = s.id
          and cs.class_id = p_class_id
          and cs.session_date between v_month_start and v_month_end
          and a.status = 'absent'
      ), 0) * 35000
    )
    order by s.full_name
  ), '[]'::jsonb)
  into v_students
  from public.enrollments e
  join public.students s on s.id = e.student_id
  left join public.users pu on pu.id = s.parent_id
  where e.class_id = p_class_id
    and e.status = 'active';

  return jsonb_build_object(
    'ok', true,
    'data', jsonb_build_object('students', v_students)
  );
end;
$$;

revoke all on function public.teacher_preview_monthly_tuition(integer, character varying) from public;
grant execute on function public.teacher_preview_monthly_tuition(integer, character varying) to authenticated;
