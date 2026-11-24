-- Version 3 business rules. Review before applying.

alter table public.enrollments
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_reason text,
  add column if not exists updated_at timestamptz default now();

update public.enrollments
set status = 'active'
where status = 'pending_payment';

do $$
begin
  alter table public.enrollments
    drop constraint if exists enrollments_status_check;

  if not exists (
    select 1 from pg_constraint
    where conname = 'enrollments_status_check_v3'
  ) then
    alter table public.enrollments
      add constraint enrollments_status_check_v3
      check (status in ('pending', 'active', 'cancelled'));
  end if;
end $$;

create unique index if not exists enrollments_active_student_class_key
  on public.enrollments(student_id, class_id)
  where status = 'active';

alter table public.classes
  add column if not exists enrollment_end_date date,
  add column if not exists updated_at timestamptz default now();

create unique index if not exists class_schedules_class_day_key
  on public.class_schedules(class_id, day_of_week);

create or replace function public.validate_class_schedule()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  schedule_count integer;
begin
  if new.day_of_week < 1 or new.day_of_week > 7 then
    raise exception 'day_of_week phai nam trong khoang 1 den 7';
  end if;

  if new.end_time - new.start_time <> interval '90 minutes' then
    raise exception 'Moi buoi hoc phai keo dai dung 90 phut';
  end if;

  select count(*)
  into schedule_count
  from public.class_schedules
  where class_id = new.class_id
    and id <> coalesce(new.id, -1);

  if schedule_count >= 2 then
    raise exception 'Moi lop chi duoc toi da hai buoi hoc moi tuan';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_class_schedule_trigger on public.class_schedules;
create trigger validate_class_schedule_trigger
before insert or update on public.class_schedules
for each row execute function public.validate_class_schedule();

alter table public.payments
  add column if not exists updated_at timestamptz default now(),
  add column if not exists cancelled_reason text,
  add column if not exists bank_transaction_id text,
  add column if not exists bank_reference text,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by integer;

do $$
begin
  alter table public.payments
    drop constraint if exists payments_status_check;

  if not exists (
    select 1 from pg_constraint
    where conname = 'payments_status_check_v3'
  ) then
    alter table public.payments
      add constraint payments_status_check_v3
      check (status in ('unpaid', 'pending', 'paid', 'cancelled'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'payments_verified_by_fkey'
  ) then
    alter table public.payments
      add constraint payments_verified_by_fkey
      foreign key (verified_by) references public.users(id);
  end if;
end $$;

create unique index if not exists payments_bank_transaction_key
  on public.payments(bank_transaction_id)
  where bank_transaction_id is not null;

alter table public.notifications
  add column if not exists payment_id integer,
  add column if not exists student_id integer,
  add column if not exists class_id integer,
  add column if not exists created_by integer,
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_payment_id_fkey'
  ) then
    alter table public.notifications
      add constraint notifications_payment_id_fkey
      foreign key (payment_id) references public.payments(id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_student_id_fkey'
  ) then
    alter table public.notifications
      add constraint notifications_student_id_fkey
      foreign key (student_id) references public.students(id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_class_id_fkey'
  ) then
    alter table public.notifications
      add constraint notifications_class_id_fkey
      foreign key (class_id) references public.classes(id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_created_by_fkey'
  ) then
    alter table public.notifications
      add constraint notifications_created_by_fkey
      foreign key (created_by) references public.users(id);
  end if;
end $$;

create index if not exists notifications_payment_id_idx
  on public.notifications(payment_id);

create or replace function public.enroll_student(
  p_student_id integer,
  p_class_id integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent_id integer;
  v_student record;
  v_class record;
  v_active_count integer;
  v_enrollment_id integer;
begin
  select id
  into v_parent_id
  from public.users
  where auth_user_id = auth.uid();

  if v_parent_id is null then
    return jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  end if;

  select *
  into v_student
  from public.students
  where id = p_student_id;

  if v_student is null then
    return jsonb_build_object('ok', false, 'code', 'STUDENT_NOT_FOUND');
  end if;

  if v_student.parent_id <> v_parent_id then
    return jsonb_build_object('ok', false, 'code', 'NOT_STUDENT_OWNER');
  end if;

  select *
  into v_class
  from public.classes
  where id = p_class_id
  for update;

  if v_class is null then
    return jsonb_build_object('ok', false, 'code', 'CLASS_NOT_FOUND');
  end if;

  if v_class.status <> 'open'
    or (v_class.enrollment_end_date is not null
      and v_class.enrollment_end_date < current_date) then
    return jsonb_build_object('ok', false, 'code', 'CLASS_CLOSED');
  end if;

  if v_student.age < v_class.min_age
    or v_student.age > v_class.max_age then
    return jsonb_build_object('ok', false, 'code', 'AGE_NOT_ELIGIBLE');
  end if;

  if exists (
    select 1
    from public.enrollments
    where student_id = p_student_id
      and class_id = p_class_id
      and status = 'active'
  ) then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_ENROLLED');
  end if;

  select count(*)
  into v_active_count
  from public.enrollments
  where class_id = p_class_id
    and status = 'active';

  if v_active_count >= v_class.max_students then
    return jsonb_build_object('ok', false, 'code', 'CLASS_FULL');
  end if;

  insert into public.enrollments(student_id, class_id, status)
  values (p_student_id, p_class_id, 'active')
  returning id into v_enrollment_id;

  return jsonb_build_object(
    'ok', true,
    'code', 'ENROLLED',
    'enrollment_id', v_enrollment_id
  );
end;
$$;

revoke all on function public.enroll_student(integer, integer) from public;
grant execute on function public.enroll_student(integer, integer) to authenticated;

create index if not exists enrollments_active_class_idx
  on public.enrollments(class_id)
  where status = 'active';

create index if not exists payments_status_paid_at_idx
  on public.payments(status, paid_at);

create index if not exists payments_enrollment_month_idx
  on public.payments(enrollment_id, billing_month);

create or replace function public.create_tuition_notifications(
  p_class_id integer,
  p_student_ids integer[],
  p_billing_month character varying,
  p_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_user_id integer;
  v_student_id integer;
  v_enrollment record;
  v_payment_id integer;
  v_parent_id integer;
  v_created_count integer := 0;
  v_updated_count integer := 0;
  v_month_start date;
  v_month_end date;
  v_absent_count integer;
  v_calculated_amount numeric;
begin
  select t.user_id
  into v_teacher_user_id
  from public.teachers t
  join public.classes c on c.teacher_id = t.id
  where c.id = p_class_id
    and t.user_id = public.current_user_id();

  if v_teacher_user_id is null then
    return jsonb_build_object('ok', false, 'code', 'NOT_CLASS_TEACHER');
  end if;

  if p_billing_month is null
    or p_billing_month !~ '^[0-9]{2}/[0-9]{4}$'
    or substring(p_billing_month from 1 for 2)::integer not between 1 and 12 then
    return jsonb_build_object('ok', false, 'code', 'INVALID_BILLING_MONTH');
  end if;

  v_month_start := make_date(
    substring(p_billing_month from 4 for 4)::integer,
    substring(p_billing_month from 1 for 2)::integer,
    1
  );
  v_month_end := (v_month_start + interval '1 month' - interval '1 day')::date;

  foreach v_student_id in array p_student_ids
  loop
    select e.*, s.parent_id
    into v_enrollment
    from public.enrollments e
    join public.students s on s.id = e.student_id
    where e.class_id = p_class_id
      and e.student_id = v_student_id
      and e.status = 'active';

    if v_enrollment.id is not null then
      select count(distinct cs.session_id)
      into v_absent_count
      from public.attendances cs
      join public.class_sessions s on s.id = cs.session_id
      where cs.student_id = v_student_id
        and s.class_id = p_class_id
        and s.session_date between v_month_start and v_month_end
        and cs.status = 'absent';

      v_calculated_amount := greatest(8 - coalesce(v_absent_count, 0), 0) * 35000;

      select id
      into v_payment_id
      from public.payments
      where enrollment_id = v_enrollment.id
        and billing_month = p_billing_month;

      if v_payment_id is null then
        insert into public.payments(
          enrollment_id,
          billing_month,
          amount,
          status
        )
        values (
          v_enrollment.id,
          p_billing_month,
          v_calculated_amount,
          'unpaid'
        )
        returning id into v_payment_id;
        v_created_count := v_created_count + 1;
      else
        update public.payments
        set amount = v_calculated_amount
        where id = v_payment_id
          and status = 'unpaid';
        if found then
          v_updated_count := v_updated_count + 1;
        end if;
      end if;

      v_parent_id := v_enrollment.parent_id;

      insert into public.notifications(
        user_id,
        title,
        message,
        type,
        payment_id,
        student_id,
        class_id,
        created_by
      )
      values (
        v_parent_id,
        'Thong bao dong hoc phi',
        'Trung tam da tao hoc phi cho con ban. Vui long xem chi tiet va thanh toan.',
        'tuition',
        v_payment_id,
        v_student_id,
        p_class_id,
        v_teacher_user_id
      );
    end if;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'code', 'TUITION_NOTIFICATIONS_CREATED',
    'createdCount', v_created_count,
    'updatedCount', v_updated_count
  );
end;
$$;

revoke all on function public.create_tuition_notifications(integer, integer[], character varying, numeric) from public;
grant execute on function public.create_tuition_notifications(integer, integer[], character varying, numeric) to authenticated;

create or replace function public.validate_paid_payment()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status = 'paid'
    and (
      new.bank_transaction_id is null
      or new.verified_at is null
      or new.verified_by is null
    ) then
    raise exception 'Chi cap nhat Paid sau khi giao dich ngan hang duoc xac minh';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_paid_payment_trigger on public.payments;
create trigger validate_paid_payment_trigger
before insert or update on public.payments
for each row execute function public.validate_paid_payment();

create policy payments_teacher_read
on public.payments for select
to authenticated
using (
  exists (
    select 1
    from public.enrollments e
    join public.classes c on c.id = e.class_id
    join public.teachers t on t.id = c.teacher_id
    where e.id = enrollment_id
      and t.user_id = public.current_user_id()
  )
);

create policy notifications_teacher_insert
on public.notifications for insert
to authenticated
with check (
  public.current_user_role() = 'teacher'
  and exists (
    select 1
    from public.classes c
    join public.teachers t on t.id = c.teacher_id
    where c.id = class_id
      and t.user_id = public.current_user_id()
  )
);
