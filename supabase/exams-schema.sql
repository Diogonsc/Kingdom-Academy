-- Sistema de Provas — Kingdom Academy
-- Execute no SQL Editor do Supabase (requer is_admin() de fix-rls-recursion.sql)

create type question_type as enum ('multiple_choice', 'essay');
create type exam_attempt_status as enum ('in_progress', 'submitted', 'graded');

create table exams (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses on delete cascade not null,
  title text not null,
  description text,
  instructions text,
  passing_score numeric(5,2) default 60,
  time_limit_minutes integer,
  max_attempts integer default 1,
  available_from timestamptz,
  available_until timestamptz,
  is_published boolean default false,
  show_feedback_after_grading boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams on delete cascade not null,
  type question_type not null,
  order_index integer not null default 0,
  statement text not null,
  points numeric(5,2) not null default 1,
  expected_answer text,
  created_at timestamptz default now()
);

create table exam_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references exam_questions on delete cascade not null,
  label char(1) not null check (label in ('A','B','C','D','E')),
  text text not null,
  is_correct boolean default false,
  order_index integer not null default 0
);

create table exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  status exam_attempt_status default 'in_progress',
  started_at timestamptz default now(),
  submitted_at timestamptz,
  graded_at timestamptz,
  graded_by uuid references profiles,
  final_score numeric(5,2),
  passed boolean,
  admin_feedback text,
  unique(exam_id, user_id)
);

create table exam_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references exam_attempts on delete cascade not null,
  question_id uuid references exam_questions on delete cascade not null,
  selected_option_id uuid references exam_question_options,
  essay_answer text,
  is_correct boolean,
  score_earned numeric(5,2) default 0,
  admin_feedback text,
  unique(attempt_id, question_id)
);

alter table exams enable row level security;
alter table exam_questions enable row level security;
alter table exam_question_options enable row level security;
alter table exam_attempts enable row level security;
alter table exam_answers enable row level security;

create policy "Alunos veem provas publicadas do curso"
  on exams for select
  using (is_published = true or public.is_admin());

create policy "Apenas admin gerencia provas"
  on exams for all
  using (public.is_admin());

create policy "Alunos veem questões de provas publicadas"
  on exam_questions for select
  using (
    exists (select 1 from exams where id = exam_id and is_published = true)
    or public.is_admin()
  );

create policy "Admin gerencia questões"
  on exam_questions for all
  using (public.is_admin());

create policy "Alunos veem opções de questões publicadas"
  on exam_question_options for select
  using (
    exists (
      select 1 from exam_questions eq
      join exams e on e.id = eq.exam_id
      where eq.id = question_id and e.is_published = true
    )
    or public.is_admin()
  );

create policy "Admin gerencia opções"
  on exam_question_options for all
  using (public.is_admin());

create policy "Aluno vê suas próprias tentativas"
  on exam_attempts for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Aluno cria sua tentativa"
  on exam_attempts for insert
  with check (auth.uid() = user_id);

create policy "Aluno atualiza sua tentativa em andamento"
  on exam_attempts for update
  using (
    (auth.uid() = user_id and status = 'in_progress')
    or public.is_admin()
  );

create policy "Aluno vê suas respostas"
  on exam_answers for select
  using (
    exists (
      select 1 from exam_attempts
      where id = attempt_id and user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "Aluno insere/atualiza respostas da tentativa em andamento"
  on exam_answers for insert
  with check (
    exists (
      select 1 from exam_attempts
      where id = attempt_id and user_id = auth.uid() and status = 'in_progress'
    )
  );

create policy "Aluno atualiza respostas da tentativa em andamento"
  on exam_answers for update
  using (
    exists (
      select 1 from exam_attempts
      where id = attempt_id and user_id = auth.uid() and status = 'in_progress'
    )
  );

create policy "Admin gerencia respostas"
  on exam_answers for all
  using (public.is_admin());

create or replace function calculate_exam_score(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exam_id uuid;
  v_total_points numeric := 0;
  v_earned_points numeric := 0;
  v_passing_score numeric;
  v_has_essay boolean;
begin
  select exam_id into v_exam_id from exam_attempts where id = p_attempt_id;
  select passing_score into v_passing_score from exams where id = v_exam_id;

  update exam_answers ea
  set
    is_correct = eqo.is_correct,
    score_earned = case when eqo.is_correct then eq.points else 0 end
  from exam_questions eq
  join exam_question_options eqo on eqo.question_id = eq.id
  where ea.question_id = eq.id
    and eqo.id = ea.selected_option_id
    and ea.attempt_id = p_attempt_id
    and eq.type = 'multiple_choice';

  select exists(
    select 1 from exam_answers ea
    join exam_questions eq on eq.id = ea.question_id
    where ea.attempt_id = p_attempt_id and eq.type = 'essay'
  ) into v_has_essay;

  select
    coalesce(sum(eq.points), 0),
    coalesce(sum(ea.score_earned), 0)
  into v_total_points, v_earned_points
  from exam_answers ea
  join exam_questions eq on eq.id = ea.question_id
  where ea.attempt_id = p_attempt_id;

  if not v_has_essay then
    update exam_attempts
    set
      status = 'graded',
      submitted_at = coalesce(submitted_at, now()),
      graded_at = now(),
      final_score = case when v_total_points > 0 then (v_earned_points / v_total_points) * 100 else 0 end,
      passed = case when v_total_points > 0 then (v_earned_points / v_total_points) * 100 >= v_passing_score else false end
    where id = p_attempt_id;
  else
    update exam_attempts
    set status = 'submitted', submitted_at = coalesce(submitted_at, now())
    where id = p_attempt_id;
  end if;
end;
$$;

grant execute on function calculate_exam_score(uuid) to authenticated;
