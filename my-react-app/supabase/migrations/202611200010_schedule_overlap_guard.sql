create or replace function public.schedule_overlaps_existing(
  p_class_id integer,
  p_teacher_id integer,
  p_day_of_week integer,
  p_start_time time,
  p_end_time time
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.class_schedules cs
    join public.classes c on c.id = cs.class_id
    where cs.class_id <> p_class_id
      and cs.day_of_week = p_day_of_week
      and c.status not in ('closed', 'cancelled')
      and c.teacher_id = p_teacher_id
      and p_start_time < cs.end_time
      and cs.start_time < p_end_time
  );
$$;

create or replace function public.validate_class_schedule()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  schedule_count integer;
  conflicting_class_name character varying;
  v_teacher_id integer;
begin
  select teacher_id
  into v_teacher_id
  from public.classes
  where id = new.class_id;

  if new.day_of_week < 1 or new.day_of_week > 7 then
    raise exception 'day_of_week phai nam trong khoang 1 den 7';
  end if;

  if new.end_time - new.start_time <> interval '105 minutes' then
    raise exception 'Moi buoi hoc phai keo dai dung 105 phut';
  end if;

  select count(*)
  into schedule_count
  from public.class_schedules
  where class_id = new.class_id
    and id <> coalesce(new.id, -1);

  if schedule_count >= 2 then
    raise exception 'Moi lop chi duoc toi da hai buoi hoc moi tuan';
  end if;

  if exists (
    select 1
    from public.class_schedules
    where class_id = new.class_id
      and day_of_week = new.day_of_week
      and id <> coalesce(new.id, -1)
  ) then
    raise exception 'Hai buoi hoc phai vao hai ngay khac nhau';
  end if;

  select c.class_name
  into conflicting_class_name
  from public.class_schedules cs
  join public.classes c on c.id = cs.class_id
  where cs.class_id <> new.class_id
    and cs.day_of_week = new.day_of_week
    and c.status not in ('closed', 'cancelled')
    and c.teacher_id = v_teacher_id
    and new.start_time < cs.end_time
    and cs.start_time < new.end_time
  limit 1;

  if conflicting_class_name is not null then
    raise exception 'Lich hoc bi trung voi lop %', conflicting_class_name;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_class_schedule_trigger on public.class_schedules;
create trigger validate_class_schedule_trigger
before insert or update on public.class_schedules
for each row execute function public.validate_class_schedule();

create or replace function public.admin_create_class(
  p_class_name character varying,
  p_teacher_id integer,
  p_max_students integer,
  p_min_age integer,
  p_max_age integer,
  p_first_day integer,
  p_first_start_time time,
  p_second_day integer,
  p_second_start_time time
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_class_id integer;
  v_first_end time := p_first_start_time + interval '105 minutes';
  v_second_end time := p_second_start_time + interval '105 minutes';
begin
  select role into v_role
  from public.users
  where auth_user_id = auth.uid();

  if v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  end if;

  if p_first_day = p_second_day then
    return jsonb_build_object('ok', false, 'code', 'DAYS_MUST_BE_DIFFERENT');
  end if;

  if p_first_day not between 1 and 7 or p_second_day not between 1 and 7 then
    return jsonb_build_object('ok', false, 'code', 'INVALID_DAY');
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

  if not exists (select 1 from public.teachers where id = p_teacher_id) then
    return jsonb_build_object('ok', false, 'code', 'TEACHER_NOT_FOUND');
  end if;

  if public.schedule_overlaps_existing(0, p_teacher_id, p_first_day, p_first_start_time, v_first_end)
    or public.schedule_overlaps_existing(0, p_teacher_id, p_second_day, p_second_start_time, v_second_end) then
    return jsonb_build_object('ok', false, 'code', 'SCHEDULE_CONFLICT');
  end if;

  insert into public.classes(
    teacher_id, class_name, min_age, max_age, max_students, tuition_fee, status
  )
  values(
    p_teacher_id, btrim(p_class_name), p_min_age, p_max_age,
    p_max_students, 0, 'open'
  )
  returning id into v_class_id;

  insert into public.class_schedules(
    class_id, day_of_week, start_time, end_time
  )
  values
    (v_class_id, p_first_day, p_first_start_time, v_first_end),
    (v_class_id, p_second_day, p_second_start_time, v_second_end);

  return jsonb_build_object('ok', true, 'class_id', v_class_id);
end;
$$;

revoke all on function public.admin_create_class(character varying, integer, integer, integer, integer, integer, time, integer, time) from public;
grant execute on function public.admin_create_class(character varying, integer, integer, integer, integer, integer, time, integer, time) to authenticated;

create or replace function public.admin_update_class(
  p_class_id integer,
  p_class_name character varying,
  p_teacher_id integer,
  p_max_students integer,
  p_min_age integer,
  p_max_age integer,
  p_first_day integer,
  p_first_start_time time,
  p_second_day integer,
  p_second_start_time time
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_enrolled integer;
  v_first_end time := p_first_start_time + interval '105 minutes';
  v_second_end time := p_second_start_time + interval '105 minutes';
begin
  select role into v_role
  from public.users
  where auth_user_id = auth.uid();

  if v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  end if;

  if p_first_day = p_second_day then
    return jsonb_build_object('ok', false, 'code', 'DAYS_MUST_BE_DIFFERENT');
  end if;

  if p_min_age is null or p_max_age is null or p_min_age > p_max_age then
    return jsonb_build_object('ok', false, 'code', 'INVALID_AGE_RANGE');
  end if;

  if p_max_students is null or p_max_students < 1 then
    return jsonb_build_object('ok', false, 'code', 'INVALID_CAPACITY');
  end if;

  if public.schedule_overlaps_existing(p_class_id, p_teacher_id, p_first_day, p_first_start_time, v_first_end)
    or public.schedule_overlaps_existing(p_class_id, p_teacher_id, p_second_day, p_second_start_time, v_second_end) then
    return jsonb_build_object('ok', false, 'code', 'SCHEDULE_CONFLICT');
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

  delete from public.class_schedules
  where class_id = p_class_id;

  insert into public.class_schedules(
    class_id, day_of_week, start_time, end_time
  )
  values
    (p_class_id, p_first_day, p_first_start_time, v_first_end),
    (p_class_id, p_second_day, p_second_start_time, v_second_end);

  return jsonb_build_object('ok', true, 'class_id', p_class_id);
end;
$$;

revoke all on function public.admin_update_class(integer, character varying, integer, integer, integer, integer, integer, time, integer, time) from public;
grant execute on function public.admin_update_class(integer, character varying, integer, integer, integer, integer, integer, time, integer, time) to authenticated;
