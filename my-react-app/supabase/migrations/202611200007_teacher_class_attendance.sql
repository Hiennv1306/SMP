create unique index if not exists class_sessions_class_date_key
  on public.class_sessions(class_id, session_date);

create or replace function public.teacher_get_class_detail(
  p_class_id integer,
  p_session_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_teacher_id integer;
  v_session_id integer;
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

  select id
  into v_session_id
  from public.class_sessions
  where class_id = p_class_id
    and session_date = p_session_date;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'fullName', s.full_name,
      'age', s.age,
      'gradeLevel', s.grade_level,
      'attendanceStatus', a.status
    )
    order by s.full_name
  ), '[]'::jsonb)
  into v_students
  from public.enrollments e
  join public.students s on s.id = e.student_id
  left join public.attendances a
    on a.student_id = s.id
    and a.session_id = v_session_id
  where e.class_id = p_class_id
    and e.status = 'active';

  return jsonb_build_object(
    'ok', true,
    'data', jsonb_build_object(
      'sessionId', v_session_id,
      'students', v_students
    )
  );
end;
$$;

revoke all on function public.teacher_get_class_detail(integer, date) from public;
grant execute on function public.teacher_get_class_detail(integer, date) to authenticated;

create or replace function public.teacher_save_attendance(
  p_class_id integer,
  p_session_date date,
  p_attendance jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_teacher_id integer;
  v_session_id integer;
  v_row jsonb;
  v_student_id integer;
  v_status text;
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

  insert into public.class_sessions(class_id, session_date)
  values(p_class_id, p_session_date)
  on conflict (class_id, session_date) do update
  set session_date = excluded.session_date
  returning id into v_session_id;

  for v_row in
    select * from jsonb_array_elements(p_attendance)
  loop
    v_student_id := (v_row->>'student_id')::integer;
    v_status := v_row->>'status';

    if v_status not in ('present', 'excused', 'absent', 'late') then
      return jsonb_build_object('ok', false, 'code', 'INVALID_ATTENDANCE_STATUS');
    end if;

    if not exists (
      select 1
      from public.enrollments
      where class_id = p_class_id
        and student_id = v_student_id
        and status = 'active'
    ) then
      return jsonb_build_object('ok', false, 'code', 'STUDENT_NOT_ENROLLED');
    end if;

    insert into public.attendances(session_id, student_id, status, note)
    values(
      v_session_id,
      v_student_id,
      v_status,
      nullif(v_row->>'note', '')
    )
    on conflict (session_id, student_id)
    do update set
      status = excluded.status,
      note = excluded.note;
  end loop;

  return jsonb_build_object('ok', true, 'session_id', v_session_id);
end;
$$;

revoke all on function public.teacher_get_class_detail(integer, date) from public;
revoke all on function public.teacher_save_attendance(integer, date, jsonb) from public;
grant execute on function public.teacher_get_class_detail(integer, date) to authenticated;
grant execute on function public.teacher_save_attendance(integer, date, jsonb) to authenticated;
