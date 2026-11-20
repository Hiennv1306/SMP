create or replace function public.admin_get_class_detail(p_class_id integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_data jsonb;
begin
  select role
  into v_role
  from public.users
  where auth_user_id = auth.uid();

  if v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  end if;

  select jsonb_build_object(
    'id', c.id,
    'className', c.class_name,
    'teacherName', coalesce(u.full_name, ''),
    'maxStudents', c.max_students,
    'minAge', c.min_age,
    'maxAge', c.max_age,
    'status', c.status,
    'enrolled', (
      select count(*)
      from public.enrollments e
      where e.class_id = c.id
        and e.status = 'active'
    ),
    'schedules', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'dayOfWeek', cs.day_of_week,
          'dayName', case cs.day_of_week
            when 1 then 'Thu Hai'
            when 2 then 'Thu Ba'
            when 3 then 'Thu Tu'
            when 4 then 'Thu Nam'
            when 5 then 'Thu Sau'
            when 6 then 'Thu Bay'
            else 'Chu Nhat'
          end,
          'startTime', to_char(cs.start_time, 'HH24:MI'),
          'endTime', to_char(cs.end_time, 'HH24:MI')
        )
        order by cs.day_of_week
      ), '[]'::jsonb)
      from public.class_schedules cs
      where cs.class_id = c.id
    ),
    'students', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'code', 'HV' || lpad(s.id::text, 4, '0'),
          'studentName', s.full_name,
          'age', s.age,
          'gradeLevel', s.grade_level,
          'parentName', pu.full_name,
          'parentPhone', pu.phone,
          'status', e.status
        )
        order by s.full_name
      ), '[]'::jsonb)
      from public.enrollments e
      join public.students s on s.id = e.student_id
      join public.users pu on pu.id = s.parent_id
      where e.class_id = c.id
        and e.status = 'active'
    )
  )
  into v_data
  from public.classes c
  left join public.teachers t on t.id = c.teacher_id
  left join public.users u on u.id = t.user_id
  where c.id = p_class_id;

  if v_data is null then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  end if;

  return jsonb_build_object('ok', true, 'data', v_data);
end;
$$;

revoke all on function public.admin_get_class_detail(integer) from public;
grant execute on function public.admin_get_class_detail(integer) to authenticated;
