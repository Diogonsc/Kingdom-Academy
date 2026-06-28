-- Dashboard Admin — métricas agregadas via API (RPC)
-- Execute no SQL Editor do Supabase após schema.sql e fix-rls-recursion.sql

drop policy if exists "Admin vê todos os certificados" on certificates;

create policy "Admin vê todos os certificados"
  on certificates for select
  using (public.is_admin());

create or replace function public.get_admin_dashboard_metrics()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_ago timestamptz := now() - interval '7 days';
  v_six_months_start date := date_trunc('month', now() - interval '5 months')::date;
  v_total_courses bigint;
  v_total_users bigint;
  v_total_enrollments bigint;
  v_total_certificates bigint;
  v_new_members bigint;
  v_approved_enrollments bigint;
  v_completion_rate integer;
  v_enrollments_by_month json;
  v_status_distribution json;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado';
  end if;

  select count(*) into v_total_courses from courses;
  select count(*) into v_total_users from profiles;
  select count(*) into v_total_enrollments from enrollments;
  select count(*) into v_total_certificates from certificates;
  select count(*) into v_new_members from profiles where created_at >= v_week_ago;
  select count(*) into v_approved_enrollments from enrollments where status = 'approved';

  v_completion_rate := case
    when v_approved_enrollments > 0 then
      round((v_total_certificates::numeric / v_approved_enrollments) * 100)
    else 0
  end;

  select coalesce(
    json_agg(
      json_build_object(
        'month', to_char(m.month_date, 'YYYY-MM'),
        'label',
          case extract(month from m.month_date)::int
            when 1 then 'jan.'
            when 2 then 'fev.'
            when 3 then 'mar.'
            when 4 then 'abr.'
            when 5 then 'mai.'
            when 6 then 'jun.'
            when 7 then 'jul.'
            when 8 then 'ago.'
            when 9 then 'set.'
            when 10 then 'out.'
            when 11 then 'nov.'
            when 12 then 'dez.'
          end || ' de ' || to_char(m.month_date, 'YY'),
        'count', coalesce(e.cnt, 0)
      )
      order by m.month_date
    ),
    '[]'::json
  )
  into v_enrollments_by_month
  from (
    select generate_series(
      v_six_months_start,
      date_trunc('month', now())::date,
      interval '1 month'
    )::date as month_date
  ) m
  left join (
    select date_trunc('month', enrolled_at)::date as month_date, count(*) as cnt
    from enrollments
    where enrolled_at >= v_six_months_start
    group by 1
  ) e on e.month_date = m.month_date;

  select coalesce(
    json_agg(
      json_build_object(
        'status', s.status,
        'label', s.label,
        'count', coalesce(c.cnt, 0)
      )
      order by s.ord
    ),
    '[]'::json
  )
  into v_status_distribution
  from (
    values
      ('pending', 'Pendente', 1),
      ('approved', 'Aprovada', 2),
      ('rejected', 'Rejeitada', 3)
  ) as s(status, label, ord)
  left join (
    select status, count(*) as cnt
    from enrollments
    group by status
  ) c on c.status = s.status;

  return json_build_object(
    'totalCourses', v_total_courses,
    'totalUsers', v_total_users,
    'totalEnrollments', v_total_enrollments,
    'totalCertificates', v_total_certificates,
    'newMembersThisWeek', v_new_members,
    'courseCompletionRate', v_completion_rate,
    'enrollmentsByMonth', v_enrollments_by_month,
    'enrollmentStatusDistribution', v_status_distribution
  );
end;
$$;

grant execute on function public.get_admin_dashboard_metrics() to authenticated;
