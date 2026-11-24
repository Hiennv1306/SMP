create or replace function public.teacher_submit_tuition_request(
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
  v_teacher_user_id integer;
  v_admin record;
  v_student_id integer;
  v_submitted_count integer := 0;
begin
  select u.role, u.id, t.id
  into v_role, v_teacher_user_id, v_teacher_id
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

  foreach v_student_id in array p_student_ids
  loop
    if exists (
      select 1
      from public.enrollments
      where class_id = p_class_id
        and student_id = v_student_id
        and status = 'active'
    ) then
      v_submitted_count := v_submitted_count + 1;
    end if;
  end loop;

  for v_admin in
    select id
    from public.users
    where role = 'admin'
  loop
    insert into public.notifications(
      user_id,
      title,
      message,
      type,
      student_id,
      class_id,
      created_by
    )
    values (
      v_admin.id,
      'Yeu cau thu hoc phi',
      'Giao vien yeu cau xu ly hoc phi thang ' || p_billing_month
        || ' cho lop ma EDU-' || lpad(p_class_id::text, 3, '0')
        || ' voi ' || v_submitted_count || ' hoc vien.',
      'tuition',
      null,
      p_class_id,
      v_teacher_user_id
    );
  end loop;

  return jsonb_build_object(
    'ok', true,
    'submittedCount', v_submitted_count
  );
end;
$$;

revoke all on function public.teacher_submit_tuition_request(integer, integer[], character varying) from public;
grant execute on function public.teacher_submit_tuition_request(integer, integer[], character varying) to authenticated;
