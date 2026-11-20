-- Supabase compatibility and RLS foundation for the existing 10-table schema.

alter table public.users
  add column if not exists auth_user_id uuid;

alter table public.users
  add constraint users_auth_user_id_fkey
  foreign key (auth_user_id) references auth.users(id) on delete cascade;

create unique index if not exists users_auth_user_id_key
  on public.users(auth_user_id);

alter table public.teachers
  add constraint teachers_user_id_key unique (user_id);

alter table public.enrollments
  add constraint enrollments_student_class_key unique (student_id, class_id);

alter table public.attendances
  add constraint attendances_session_student_key unique (session_id, student_id);

alter table public.payments
  add constraint payments_enrollment_month_key unique (enrollment_id, billing_month);

alter table public.users
  add constraint users_role_check
  check (role in ('admin', 'teacher', 'parent'));

alter table public.classes
  add constraint classes_age_check check (min_age <= max_age);

alter table public.classes
  add constraint classes_capacity_check check (max_students > 0);

alter table public.classes
  add constraint classes_fee_check check (tuition_fee >= 0);

alter table public.class_schedules
  add constraint class_schedules_day_check check (day_of_week between 1 and 7);

alter table public.class_schedules
  add constraint class_schedules_time_check check (start_time < end_time);

alter table public.payments
  add constraint payments_amount_check check (amount >= 0);

alter table public.attendances
  add constraint attendances_status_check
  check (status in ('present', 'excused', 'absent', 'late'));

alter table public.enrollments
  add constraint enrollments_status_check
  check (status in ('pending_payment', 'active', 'cancelled'));

alter table public.payments
  add constraint payments_status_check
  check (status in ('unpaid', 'paid', 'refunded'));

alter table public.students
  add constraint students_status_check
  check (status in ('active', 'inactive'));

alter table public.classes
  add constraint classes_status_check
  check (status in ('open', 'closed', 'cancelled'));

create index if not exists students_parent_id_idx on public.students(parent_id);
create index if not exists classes_teacher_id_idx on public.classes(teacher_id);
create index if not exists class_schedules_class_id_idx on public.class_schedules(class_id);
create index if not exists enrollments_student_id_idx on public.enrollments(student_id);
create index if not exists enrollments_class_id_idx on public.enrollments(class_id);
create index if not exists class_sessions_class_id_idx on public.class_sessions(class_id);
create index if not exists attendances_session_id_idx on public.attendances(session_id);
create index if not exists attendances_student_id_idx on public.attendances(student_id);
create index if not exists payments_enrollment_id_idx on public.payments(enrollment_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, is_read)
  where is_read = false;

create or replace function public.current_user_id()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.users
  where auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users
  where auth_user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_user_id() from public;
revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;

alter table public.users enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.classes enable row level security;
alter table public.class_schedules enable row level security;
alter table public.enrollments enable row level security;
alter table public.class_sessions enable row level security;
alter table public.attendances enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;

create policy users_select
on public.users for select
to authenticated
using (
  auth_user_id = auth.uid()
  or public.current_user_role() = 'admin'
);

create policy users_update_own_profile
on public.users for update
to authenticated
using (auth_user_id = auth.uid())
with check (
  auth_user_id = auth.uid()
  and role = (
    select u.role
    from public.users u
    where u.auth_user_id = auth.uid()
  )
);

create policy users_admin_insert
on public.users for insert
to authenticated
with check (public.current_user_role() = 'admin');

create policy teachers_admin_manage
on public.teachers for all
to authenticated
using (
  public.current_user_role() = 'admin'
  or user_id = public.current_user_id()
)
with check (public.current_user_role() = 'admin');

create policy students_parent_admin
on public.students for select
to authenticated
using (
  parent_id = public.current_user_id()
  or public.current_user_role() = 'admin'
);

create policy students_admin_manage
on public.students for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

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
  or exists (
    select 1
    from public.enrollments e
    join public.students s on s.id = e.student_id
    where e.class_id = public.classes.id
      and s.parent_id = public.current_user_id()
  )
);

create policy classes_admin_manage
on public.classes for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy class_schedules_read
on public.class_schedules for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or exists (
    select 1
    from public.classes c
    join public.teachers t on t.id = c.teacher_id
    where c.id = class_id
      and t.user_id = public.current_user_id()
  )
);

create policy class_schedules_admin_manage
on public.class_schedules for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy enrollments_read
on public.enrollments for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or exists (
    select 1
    from public.students s
    where s.id = student_id
      and s.parent_id = public.current_user_id()
  )
  or exists (
    select 1
    from public.classes c
    join public.teachers t on t.id = c.teacher_id
    where c.id = class_id
      and t.user_id = public.current_user_id()
  )
);

create policy enrollments_admin_manage
on public.enrollments for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy class_sessions_read
on public.class_sessions for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or exists (
    select 1
    from public.classes c
    join public.teachers t on t.id = c.teacher_id
    where c.id = class_id
      and t.user_id = public.current_user_id()
  )
);

create policy class_sessions_admin_teacher_manage
on public.class_sessions for all
to authenticated
using (
  public.current_user_role() = 'admin'
  or exists (
    select 1
    from public.classes c
    join public.teachers t on t.id = c.teacher_id
    where c.id = class_id
      and t.user_id = public.current_user_id()
  )
)
with check (
  public.current_user_role() = 'admin'
  or exists (
    select 1
    from public.classes c
    join public.teachers t on t.id = c.teacher_id
    where c.id = class_id
      and t.user_id = public.current_user_id()
  )
);

create policy attendances_teacher_admin
on public.attendances for all
to authenticated
using (
  public.current_user_role() = 'admin'
  or exists (
    select 1
    from public.class_sessions cs
    join public.classes c on c.id = cs.class_id
    join public.teachers t on t.id = c.teacher_id
    where cs.id = session_id
      and t.user_id = public.current_user_id()
  )
)
with check (
  public.current_user_role() = 'admin'
  or exists (
    select 1
    from public.class_sessions cs
    join public.classes c on c.id = cs.class_id
    join public.teachers t on t.id = c.teacher_id
    where cs.id = session_id
      and t.user_id = public.current_user_id()
  )
);

create policy payments_parent_admin
on public.payments for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or exists (
    select 1
    from public.enrollments e
    join public.students s on s.id = e.student_id
    where e.id = enrollment_id
      and s.parent_id = public.current_user_id()
  )
);

create policy payments_admin_manage
on public.payments for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy notifications_owner_admin
on public.notifications for select
to authenticated
using (
  user_id = public.current_user_id()
  or public.current_user_role() = 'admin'
);

create policy notifications_owner_update
on public.notifications for update
to authenticated
using (user_id = public.current_user_id())
with check (user_id = public.current_user_id());

create policy notifications_admin_manage
on public.notifications for insert
to authenticated
with check (public.current_user_role() = 'admin');
