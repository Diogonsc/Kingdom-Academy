-- Fluxo de aprovação manual de matrículas
-- Execute no SQL Editor do Supabase.

alter table public.enrollments
  add column if not exists status text not null default 'pending'
  check (status in ('pending', 'approved', 'rejected'));

-- Matrículas existentes passam a aprovadas (já estavam ativas antes desta mudança)
update public.enrollments
set status = 'approved';

drop policy if exists "Usuário pode se matricular" on public.enrollments;
drop policy if exists "Usuário pode atualizar solicitação rejeitada" on public.enrollments;
drop policy if exists "Admin gerencia matrículas" on public.enrollments;

create policy "Usuário pode solicitar matrícula"
  on public.enrollments for insert
  with check (auth.uid() = user_id and status = 'pending');

create policy "Usuário pode re-solicitar matrícula rejeitada"
  on public.enrollments for update
  using (auth.uid() = user_id and status = 'rejected')
  with check (auth.uid() = user_id and status = 'pending');

create policy "Admin gerencia matrículas"
  on public.enrollments for update
  using (public.is_admin());
