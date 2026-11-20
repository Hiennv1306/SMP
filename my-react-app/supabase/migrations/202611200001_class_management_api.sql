create or replace function public.admin_list_classes()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_data jsonb;
begin
  select role into v_role
  from public.users
  where auth_user_id = auth.uid();

  if v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'className', c.class_name,
      'teacherId', c.teacher_id,
      'teacherName', coalesce(u.full_name, ''),
      'maxStudents', c.max_students,
      'minAge', c.min_age,
      'maxAge', c.max_age,
      'status', c.status,
      'startDate', c.start_date,
      'schedules', (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'dayOfWeek', cs.day_of_week,
            'startTime', cs.start_time,
            'endTime', cs.end_time
          )
          order by cs.day_of_week
        ), '[]'::jsonb)
        from public.class_schedules cs
        where cs.class_id = c.id
      ),
      'enrolled', (
        select count(*)
        from public.enrollments e
        where e.class_id = c.id
          and e.status = 'active'
      )
    )
    order by c.id
  ), '[]'::jsonb)
  into v_data
  from public.classes c
  left join public.teachers t on t.id = c.teacher_id
  left join public.users u on u.id = t.user_id;

  return jsonb_build_object('ok', true, 'data', v_data);
end;
$$;

revoke all on function public.admin_list_classes() from public;
grant execute on function public.admin_list_classes() to authenticated;

create or replace function public.admin_create_class(
  p_class_name character varying,
  p_teacher_id integer,
  p_max_students integer,
  p_min_age integer,
  p_max_age integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_class_id integer;
begin
  select role into v_role
  from public.users
  where auth_user_id = auth.uid();

  if v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  end if;

  if p_class_name is null or btrim(p_class_name) = '' then
    return jsonb_build_object('ok', false, 'code', 'CLASS_NAME_REQUIRED');
  end if;

  if p_max_students is null or p_max_students < 1 then
    return jsonb_build_object('ok', false, 'code', 'INVALID_CAPACITY');
  end if;

  if p_min_age is null or p_max_age is null or p_min_age > p_max_age then
    return jsonb_build_object('ok', false, 'code', 'INVALID_AGE_RANGE');
  end if;

  if not exists (
    select 1
    from public.teachers
    where id = p_teacher_id
  ) then
    return jsonb_build_object('ok', false, 'code', 'TEACHER_NOT_FOUND');
  end if;

  insert into public.classes(
    teacher_id,
    class_name,
    min_age,
    max_age,
    max_students,
    tuition_fee,
    status
  )
  values(
    p_teacher_id,
    btrim(p_class_name),
    p_min_age,
    p_max_age,
    p_max_students,
    0,
    'open'
  )
  returning id into v_class_id;

  return jsonb_build_object('ok', true, 'class_id', v_class_id);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_EXISTS');
end;
$$;

revoke all on function public.admin_create_class(character varying, integer, integer, integer, integer) from public;
grant execute on function public.admin_create_class(character varying, integer, integer, integer, integer) to authenticated;

create or replace function public.admin_update_class(
  p_class_id integer,
  p_class_name character varying,
  p_teacher_id integer,
  p_max_students integer,
  p_min_age integer,
  p_max_age integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_enrolled integer;
begin
  select role into v_role
  from public.users
  where auth_user_id = auth.uid();

  if v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  end if;

  if p_class_name is null or btrim(p_class_name) = '' then
    return jsonb_build_object('ok', false, 'code', 'CLASS_NAME_REQUIRED');
  end if;

  if p_min_age is null or p_max_age is null or p_min_age > p_max_age then
    return jsonb_build_object('ok', false, 'code', 'INVALID_AGE_RANGE');
  end if;

  if p_max_students is null or p_max_students < 1 then
    return jsonb_build_object('ok', false, 'code', 'INVALID_CAPACITY');
  end if;

  if not exists (
    select 1
    from public.teachers
    where id = p_teacher_id
  ) then
    return jsonb_build_object('ok', false, 'code', 'TEACHER_NOT_FOUND');
  end if;

  select count(*)
  into v_enrolled
  from public.enrollments
  where class_id = p_class_id
    and status = 'active';

  if v_enrolled > p_max_students then
    return jsonb_build_object('ok', false, 'code', 'CAPACITY_BELOW_ENROLLED');
  end if;

  update public.classes
  set class_name = btrim(p_class_name),
      teacher_id = p_teacher_id,
      max_students = p_max_students,
      min_age = p_min_age,
      max_age = p_max_age,
      updated_at = now()
  where id = p_class_id;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  end if;

  return jsonb_build_object('ok', true, 'class_id', p_class_id);
end;
$$;

revoke all on function public.admin_update_class(integer, character varying, integer, integer, integer, integer) from public;
grant execute on function public.admin_update_class(integer, character varying, integer, integer, integer, integer) to authenticated;

create or replace function public.admin_delete_class(p_class_id integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role
  from public.users
  where auth_user_id = auth.uid();

  if v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  end if;

  update public.classes
  set status = 'closed',
      updated_at = now()
  where id = p_class_id;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  end if;

  return jsonb_build_object('ok', true, 'class_id', p_class_id);
end;
$$;

revoke all on function public.admin_delete_class(integer) from public;
grant execute on function public.admin_delete_class(integer) to authenticated;
