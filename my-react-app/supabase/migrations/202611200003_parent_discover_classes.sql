create or replace function public.parent_list_discoverable_classes(p_student_id integer default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent_id integer;
  v_student_age integer;
  v_data jsonb;
begin
  select id
  into v_parent_id
  from public.users
  where auth_user_id = auth.uid();

  if v_parent_id is null then
    return jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  end if;

  if p_student_id is not null then
    select age
    into v_student_age
    from public.students
    where id = p_student_id
      and parent_id = v_parent_id
      and status <> 'inactive';

    if v_student_age is null then
      return jsonb_build_object('ok', false, 'code', 'STUDENT_NOT_FOUND');
    end if;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'className', c.class_name,
      'description', c.description,
      'teacherId', c.teacher_id,
      'teacherName', coalesce(u.full_name, ''),
      'minAge', c.min_age,
      'maxAge', c.max_age,
      'maxStudents', c.max_students,
      'enrolled', (
        select count(*)
        from public.enrollments e
        where e.class_id = c.id
          and e.status = 'active'
      ),
      'availableSeats', c.max_students - (
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
      )
    )
    order by c.class_name
  ), '[]'::jsonb)
  into v_data
  from public.classes c
  left join public.teachers t on t.id = c.teacher_id
  left join public.users u on u.id = t.user_id
  where c.status = 'open'
    and (c.enrollment_end_date is null or c.enrollment_end_date >= current_date)
    and (
      p_student_id is null
      or (v_student_age between c.min_age and c.max_age)
    )
    and (
      select count(*)
      from public.enrollments e
      where e.class_id = c.id
        and e.status = 'active'
    ) < c.max_students
    and not exists (
      select 1
      from public.enrollments e
      where e.class_id = c.id
        and e.student_id = p_student_id
        and e.status = 'active'
    );

  return jsonb_build_object('ok', true, 'data', v_data);
end;
$$;

revoke all on function public.parent_list_discoverable_classes(integer) from public;
grant execute on function public.parent_list_discoverable_classes(integer) to authenticated;
