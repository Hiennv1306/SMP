-- Create public parent profile automatically after Supabase Auth signup.
-- This migration is safe to review before applying.

create or replace function public.handle_new_parent_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_phone text;
  v_requested_role text;
  v_existing_user public.users%rowtype;
  v_parent_id integer;
  v_child_name text;
  v_child_age integer;
  v_grade_level text;
begin
  v_requested_role := coalesce(new.raw_user_meta_data->>'role', '');
  if v_requested_role <> 'parent' then
    return new;
  end if;

  v_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    ''
  );
  v_phone := coalesce(new.raw_user_meta_data->>'phone', '');
  v_child_name := coalesce(new.raw_user_meta_data->>'child_name', '');
  v_child_age := nullif(new.raw_user_meta_data->>'child_age', '')::integer;
  v_grade_level := coalesce(new.raw_user_meta_data->>'grade_level', '');

  if v_phone = '' then
    raise exception 'Parent phone is required';
  end if;

  select *
  into v_existing_user
  from public.users
  where phone = v_phone;

  if v_existing_user.id is not null then
    if v_existing_user.role <> 'parent' then
      raise exception 'Phone number is already assigned to another role';
    end if;

    if v_existing_user.auth_user_id is not null
      and v_existing_user.auth_user_id <> new.id then
      raise exception 'Phone number already has a parent account';
    end if;

    update public.users
    set auth_user_id = new.id,
        full_name = v_full_name,
        role = 'parent'
    where id = v_existing_user.id;
    v_parent_id := v_existing_user.id;
  else
    insert into public.users(
      auth_user_id,
      phone,
      password_hash,
      full_name,
      role
    )
    values(
      new.id,
      v_phone,
      '',
      v_full_name,
      'parent'
    )
    returning id into v_parent_id;
  end if;

  if v_child_name <> '' and v_child_age is not null then
    insert into public.students(
      parent_id,
      full_name,
      age,
      grade_level,
      status
    )
    values(
      v_parent_id,
      v_child_name,
      v_child_age,
      v_grade_level,
      'active'
    );
  end if;

  return new;
end;
$$;

revoke all on function public.handle_new_parent_auth_user() from public;
revoke all on function public.handle_new_parent_auth_user() from authenticated;

drop trigger if exists on_auth_user_created_parent on auth.users;

create trigger on_auth_user_created_parent
after insert on auth.users
for each row
execute function public.handle_new_parent_auth_user();
