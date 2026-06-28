-- Corrige calculate_exam_score: alias da tabela alvo (ea) não pode ser usado no JOIN do FROM
-- Execute no SQL Editor do Supabase

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

-- Recupera tentativas que ficaram com submitted_at mas status ainda in_progress
-- (falha da versão antiga que atualizava antes da RPC)
update exam_attempts
set submitted_at = null
where status = 'in_progress' and submitted_at is not null;

-- Depois rode para cada tentativa afetada, ou todas de uma vez:
-- select calculate_exam_score(id) from exam_attempts where status = 'in_progress' and submitted_at is not null;
