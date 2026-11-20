create or replace function public.parent_dashboard_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_parent_id integer;
  v_child_count integer;
  v_active_class_count integer;
  v_upcoming_count integer;
  v_unpaid_count integer;
  v_children jsonb;
  v_schedules jsonb;
begin
  select role, id
  into v_role, v_parent_id
  from public.users
  where auth_user_id = auth.uid();

  if v_role <> 'parent' or v_parent_id is null then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  end if;

  select count(*)
  into v_child_count
  from public.students
  where parent_id = v_parent_id
    and status = 'active';

  select count(distinct e.class_id)
  into v_active_class_count
  from public.enrollments e
  join public.students s on s.id = e.student_id
  where s.parent_id = v_parent_id
    and e.status = 'active';

  select count(*)
  into v_upcoming_count
  from public.class_schedules cs
  join public.classes c on c.id = cs.class_id
  join public.enrollments e on e.class_id = c.id
  join public.students s on s.id = e.student_id
  where s.parent_id = v_parent_id
    and e.status = 'active'
    and c.status = 'open';

  select count(*)
  into v_unpaid_count
  from public.payments p
  join public.enrollments e on e.id = p.enrollment_id
  join public.students s on s.id = e.student_id
  where s.parent_id = v_parent_id
    and p.status in ('unpaid', 'pending');

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'fullName', s.full_name,
      'detail', coalesce(s.grade_level, 'Chua co lop') || ' - ' || s.age::text || ' tuoi',
      'status', s.status
    )
    order by s.full_name
  ), '[]'::jsonb)
  into v_children
  from public.students s
  where s.parent_id = v_parent_id
    and s.status = 'active';

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'childId', s.id,
      'childName', s.full_name,
      'classId', c.id,
      'className', c.class_name,
      'dayOfWeek', cs.day_of_week,
      'startTime', to_char(cs.start_time, 'HH24:MI'),
      'endTime', to_char(cs.end_time, 'HH24:MI')
    )
    order by cs.day_of_week, cs.start_time, s.full_name
  ), '[]'::jsonb)
  into v_schedules
  from public.enrollments e
  join public.students s on s.id = e.student_id
  join public.classes c on c.id = e.class_id
  join public.class_schedules cs on cs.class_id = c.id
  where s.parent_id = v_parent_id
    and e.status = 'active'
    and c.status = 'open';

  return jsonb_build_object(
    'ok', true,
    'data', jsonb_build_object(
      'cards', jsonb_build_array(
        jsonb_build_object('label', 'Con dang hoc', 'value', v_child_count::text),
        jsonb_build_object('label', 'Lop dang hoat dong', 'value', v_active_class_count::text),
        jsonb_build_object('label', 'Buoi hoc trong tuan', 'value', v_upcoming_count::text),
        jsonb_build_object('label', 'Hoc phi chua thanh toan', 'value', v_unpaid_count::text)
      ),
      'children', v_children,
      'schedules', v_schedules
    )
  );
end;
$$;

revoke all on function public.parent_dashboard_summary() from public;
grant execute on function public.parent_dashboard_summary() to authenticated;
