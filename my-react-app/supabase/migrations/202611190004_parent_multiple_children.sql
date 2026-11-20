-- One parent account owns a maximum of two active student records.

create or replace function public.validate_parent_children()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  active_count integer;
begin
  if new.status is null or new.status <> 'inactive' then
    select count(*)
    into active_count
    from public.students
    where parent_id = new.parent_id
      and status <> 'inactive'
      and id <> coalesce(new.id, -1);

    if active_count >= 2 then
      raise exception 'Moi so dien thoai chi duoc dang ky toi da 2 con';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_parent_children_trigger on public.students;
create trigger validate_parent_children_trigger
before insert or update on public.students
for each row execute function public.validate_parent_children();

drop policy if exists students_parent_insert on public.students;
create policy students_parent_insert
on public.students for insert
to authenticated
with check (
  public.current_user_role() = 'admin'
  or parent_id = public.current_user_id()
);

drop policy if exists students_parent_update on public.students;
create policy students_parent_update
on public.students for update
to authenticated
using (
  public.current_user_role() = 'admin'
  or parent_id = public.current_user_id()
)
with check (
  public.current_user_role() = 'admin'
  or parent_id = public.current_user_id()
);

create index if not exists students_parent_status_idx
  on public.students(parent_id, status);
