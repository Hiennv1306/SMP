alter table public.users
  add column if not exists is_active boolean not null default true;

create or replace function public.admin_list_teachers()
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
      'id', t.id,
      'user_id', t.user_id,
      'specialty', t.specialty,
      'bio', t.bio,
      'users', jsonb_build_object(
        'auth_user_id', u.auth_user_id,
        'full_name', u.full_name,
        'phone', u.phone,
        'role', u.role,
        'created_at', u.created_at,
        'is_active', u.is_active
      ),
      'email', coalesce(a.email, ''),
      'auth_phone', coalesce(a.phone, u.phone),
      'classCount', (
        select count(*)
        from public.classes c
        where c.teacher_id = t.id
      )
    )
    order by t.id
  ), '[]'::jsonb)
  into v_data
  from public.teachers t
  join public.users u on u.id = t.user_id
  left join auth.users a on a.id = u.auth_user_id;

  return jsonb_build_object('ok', true, 'data', v_data);
end;
$$;

revoke all on function public.admin_list_teachers() from public;
grant execute on function public.admin_list_teachers() to authenticated;

create or replace function public.admin_create_teacher(
  p_auth_user_id uuid,
  p_phone character varying,
  p_full_name character varying,
  p_specialty character varying,
  p_bio text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_user_id integer;
  v_teacher_id integer;
begin
  select role into v_role
  from public.users
  where auth_user_id = auth.uid();

  if v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  end if;

  insert into public.users(
    auth_user_id, phone, password_hash, full_name, role, is_active
  )
  values(p_auth_user_id, p_phone, '', p_full_name, 'teacher', true)
  returning id into v_user_id;

  insert into public.teachers(user_id, specialty, bio)
  values(v_user_id, p_specialty, p_bio)
  returning id into v_teacher_id;

  return jsonb_build_object(
    'ok', true,
    'user_id', v_user_id,
    'teacher_id', v_teacher_id
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_EXISTS');
end;
$$;

revoke all on function public.admin_create_teacher(uuid, character varying, character varying, character varying, text) from public;
grant execute on function public.admin_create_teacher(uuid, character varying, character varying, character varying, text) to authenticated;

create or replace function public.admin_update_teacher(
  p_teacher_id integer,
  p_phone character varying,
  p_full_name character varying,
  p_specialty character varying,
  p_bio text default null,
  p_is_active boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_user_id integer;
begin
  select role into v_role
  from public.users
  where auth_user_id = auth.uid();

  if v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  end if;

  select user_id into v_user_id
  from public.teachers
  where id = p_teacher_id;

  if v_user_id is null then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  end if;

  update public.users
  set phone = p_phone,
      full_name = p_full_name,
      is_active = coalesce(p_is_active, is_active)
  where id = v_user_id;

  update public.teachers
  set specialty = p_specialty,
      bio = p_bio
  where id = p_teacher_id;

  return jsonb_build_object('ok', true, 'teacher_id', p_teacher_id);
end;
$$;

revoke all on function public.admin_update_teacher(integer, character varying, character varying, character varying, text, boolean) from public;
grant execute on function public.admin_update_teacher(integer, character varying, character varying, character varying, text, boolean) to authenticated;

create or replace function public.admin_delete_teacher(p_teacher_id integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_user_id integer;
begin
  select role into v_role
  from public.users
  where auth_user_id = auth.uid();

  if v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  end if;

  select user_id into v_user_id
  from public.teachers
  where id = p_teacher_id;

  if v_user_id is null then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  end if;

  update public.users
  set is_active = false
  where id = v_user_id;

  return jsonb_build_object('ok', true, 'teacher_id', p_teacher_id, 'deleted', false);
end;
$$;

revoke all on function public.admin_delete_teacher(integer) from public;
grant execute on function public.admin_delete_teacher(integer) to authenticated;
