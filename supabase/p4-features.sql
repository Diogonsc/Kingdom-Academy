-- P4 Features — Kingdom Academy
-- Execute no SQL Editor do Supabase após schema.sql e exams-schema.sql

-- ── P4-03: Múltiplas tentativas de prova ──────────────────────
alter table exam_attempts drop constraint if exists exam_attempts_exam_id_user_id_key;

alter table exam_attempts
  add column if not exists attempt_number integer not null default 1;

create unique index if not exists exam_attempts_exam_user_attempt_unique
  on exam_attempts (exam_id, user_id, attempt_number);

-- ── P4-04: Módulos de curso ───────────────────────────────────
create table if not exists course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses on delete cascade not null,
  title text not null,
  order_index integer not null default 0,
  created_at timestamptz default now()
);

alter table lessons
  add column if not exists module_id uuid references course_modules on delete set null;

alter table course_modules enable row level security;

create policy "Módulos visíveis em cursos publicados"
  on course_modules for select
  using (
    exists (
      select 1 from courses
      where id = course_id and (is_published = true or public.is_admin())
    )
  );

create policy "Admin gerencia módulos"
  on course_modules for all
  using (public.is_admin());

-- ── P4-01: Notificações in-app ────────────────────────────────
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "Usuário vê suas notificações"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Usuário atualiza suas notificações"
  on notifications for update
  using (auth.uid() = user_id);

create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_link text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into notifications (user_id, type, title, message, link)
  values (p_user_id, p_type, p_title, p_message, p_link)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.create_notification(uuid, text, text, text, text) to authenticated;

-- ── P4-08: Gamificação — Conquistas ───────────────────────────
create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade not null,
  type text not null,
  earned_at timestamptz default now(),
  unique(user_id, type)
);

alter table achievements enable row level security;

create policy "Usuário vê suas conquistas"
  on achievements for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Sistema registra conquistas"
  on achievements for insert
  with check (auth.uid() = user_id);
