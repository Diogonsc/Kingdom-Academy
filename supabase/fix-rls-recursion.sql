-- Corrige: "infinite recursion detected in policy for relation profiles"
-- Execute este script no SQL Editor do Supabase (projeto já existente).

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- profiles
drop policy if exists "Admin pode ver todos os perfis" on profiles;
drop policy if exists "Admin pode atualizar perfis" on profiles;

create policy "Admin pode ver todos os perfis"
  on profiles for select
  using (public.is_admin());

create policy "Admin pode atualizar perfis"
  on profiles for update
  using (public.is_admin());

-- courses
drop policy if exists "Cursos publicados são públicos" on courses;
drop policy if exists "Apenas admin pode gerenciar cursos" on courses;

create policy "Cursos publicados são públicos"
  on courses for select
  using (is_published = true or public.is_admin());

create policy "Apenas admin pode gerenciar cursos"
  on courses for all
  using (public.is_admin());

-- lessons
drop policy if exists "Aulas de cursos publicados são visíveis" on lessons;
drop policy if exists "Apenas admin pode gerenciar aulas" on lessons;

create policy "Aulas de cursos publicados são visíveis"
  on lessons for select
  using (
    exists (
      select 1 from courses
      where id = course_id and is_published = true
    )
    or public.is_admin()
  );

create policy "Apenas admin pode gerenciar aulas"
  on lessons for all
  using (public.is_admin());

-- enrollments
drop policy if exists "Admin vê todas as matrículas" on enrollments;

create policy "Admin vê todas as matrículas"
  on enrollments for select
  using (public.is_admin());

-- books
drop policy if exists "Apenas admin pode gerenciar livros" on books;

create policy "Apenas admin pode gerenciar livros"
  on books for all
  using (public.is_admin());
