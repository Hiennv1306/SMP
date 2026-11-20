drop policy if exists classes_admin_teacher on public.classes;

create policy classes_admin_teacher
on public.classes for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or exists (
    select 1
    from public.teachers t
    where t.id = teacher_id
      and t.user_id = public.current_user_id()
  )
);

drop policy if exists students_admin_manage on public.students;
create policy students_admin_manage
on public.students for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
