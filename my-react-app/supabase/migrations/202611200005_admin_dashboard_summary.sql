create or replace function public.admin_dashboard_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_teacher_count integer;
  v_student_count integer;
  v_active_class_count integer;
  v_parent_count integer;
  v_revenue jsonb;
  v_transactions jsonb;
  v_enrollments jsonb;
begin
  select role
  into v_role
  from public.users
  where auth_user_id = auth.uid();

  if v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  end if;

  select count(*)
  into v_teacher_count
  from public.teachers;

  select count(*)
  into v_student_count
  from public.students
  where status = 'active';

  select count(*)
  into v_active_class_count
  from public.classes
  where status = 'open';

  select count(*)
  into v_parent_count
  from public.users
  where role = 'parent';

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'month', to_char(month_start, 'MM/YYYY'),
      'value', coalesce(paid_amount, 0)
    )
    order by month_start
  ), '[]'::jsonb)
  into v_revenue
  from (
    select
      date_trunc('month', paid_at)::date as month_start,
      sum(amount) as paid_amount
    from public.payments
    where status = 'paid'
      and paid_at is not null
      and paid_at >= date_trunc('month', current_date) - interval '5 months'
    group by date_trunc('month', paid_at)
  ) revenue_query;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'name', s.full_name,
      'amount', p.amount,
      'status', p.status,
      'date', to_char(p.paid_at, 'DD/MM/YYYY')
    )
    order by p.paid_at desc nulls last
  ), '[]'::jsonb)
  into v_transactions
  from (
    select *
    from public.payments
    order by paid_at desc nulls last
    limit 5
  ) p
  left join public.enrollments e on e.id = p.enrollment_id
  left join public.students s on s.id = e.student_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'name', s.full_name,
      'course', c.class_name,
      'date', to_char(e.enroll_date, 'DD/MM/YYYY'),
      'status', e.status
    )
    order by e.enroll_date desc
  ), '[]'::jsonb)
  into v_enrollments
  from (
    select *
    from public.enrollments
    order by enroll_date desc
    limit 5
  ) e
  left join public.students s on s.id = e.student_id
  left join public.classes c on c.id = e.class_id;

  return jsonb_build_object(
    'ok', true,
    'data', jsonb_build_object(
      'cards', jsonb_build_array(
        jsonb_build_object('label', 'Tong giao vien', 'value', v_teacher_count::text, 'trend', 'Du lieu thuc te'),
        jsonb_build_object('label', 'Tong hoc vien', 'value', v_student_count::text, 'trend', 'Trang thai dang hoat dong'),
        jsonb_build_object('label', 'Lop dang hoat dong', 'value', v_active_class_count::text, 'trend', 'Lop dang mo'),
        jsonb_build_object('label', 'Tong phu huynh', 'value', v_parent_count::text, 'trend', 'Tai khoan phu huynh')
      ),
      'revenue', v_revenue,
      'transactions', v_transactions,
      'recentEnrollments', v_enrollments
    )
  );
end;
$$;

revoke all on function public.admin_dashboard_summary() from public;
grant execute on function public.admin_dashboard_summary() to authenticated;
