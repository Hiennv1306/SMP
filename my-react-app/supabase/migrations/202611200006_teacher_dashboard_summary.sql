create or replace function public.teacher_dashboard_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_teacher_id integer;
  v_class_count integer;
  v_student_count integer;
  v_today_session_count integer;
  v_attendance_total integer;
  v_attendance_present integer;
  v_attendance_rate integer;
  v_today_sessions jsonb;
begin
  select u.role, t.id
  into v_role, v_teacher_id
  from public.users u
  left join public.teachers t on t.user_id = u.id
  where u.auth_user_id = auth.uid();

  if v_role <> 'teacher' or v_teacher_id is null then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  end if;

  select count(*)
  into v_class_count
  from public.classes
  where teacher_id = v_teacher_id
    and status in ('open', 'closed');

  select count(distinct e.student_id)
  into v_student_count
  from public.enrollments e
  join public.classes c on c.id = e.class_id
  where c.teacher_id = v_teacher_id
    and e.status = 'active';

  select count(*)
  into v_today_session_count
  from public.class_schedules cs
  join public.classes c on c.id = cs.class_id
  where c.teacher_id = v_teacher_id
    and c.status = 'open'
    and cs.day_of_week = (
      case extract(isodow from current_date)
        when 1 then 1
        when 2 then 2
        when 3 then 3
        when 4 then 4
        when 5 then 5
        when 6 then 6
        when 7 then 7
      end
    );

  select
    count(*),
    count(*) filter (where a.status = 'present')
  into v_attendance_total, v_attendance_present
  from public.attendances a
  join public.class_sessions cs on cs.id = a.session_id
  join public.classes c on c.id = cs.class_id
  where c.teacher_id = v_teacher_id;

  v_attendance_rate := case
    when coalesce(v_attendance_total, 0) = 0 then 0
    else round((coalesce(v_attendance_present, 0)::numeric / v_attendance_total::numeric) * 100)::integer
  end;

  select coalesce(jsonb_agg(
    jsonb_build_object(
    'time', to_char(cs.start_time, 'HH24:MI') || ' - ' || to_char(cs.end_time, 'HH24:MI'),
      'name', c.class_name,
    'room', coalesce(cs.room_name, ''),
      'students', (
        select count(*)
        from public.enrollments e
        where e.class_id = c.id
          and e.status = 'active'
      )
    )
    order by cs.start_time
  ), '[]'::jsonb)
  into v_today_sessions
  from public.class_schedules cs
  join public.classes c on c.id = cs.class_id
  where c.teacher_id = v_teacher_id
    and c.status = 'open'
    and cs.day_of_week = extract(isodow from current_date)::integer;

  return jsonb_build_object(
    'ok', true,
    'data', jsonb_build_object(
      'cards', jsonb_build_array(
        jsonb_build_object('label', 'Lop dang day', 'value', v_class_count::text),
        jsonb_build_object('label', 'Tong hoc vien', 'value', v_student_count::text),
        jsonb_build_object('label', 'Buoi hoc hom nay', 'value', v_today_session_count::text),
        jsonb_build_object('label', 'Ty le diem danh', 'value', v_attendance_rate::text || '%')
      ),
      'todaySessions', v_today_sessions,
      'attendanceRate', v_attendance_rate
    )
  );
end;
$$;

revoke all on function public.teacher_dashboard_summary() from public;
grant execute on function public.teacher_dashboard_summary() to authenticated;
