-- Bucket para capas de cursos
-- Execute no SQL Editor do Supabase.

insert into storage.buckets (id, name, public)
values ('course-thumbnails', 'course-thumbnails', true)
on conflict (id) do update set public = true;

drop policy if exists "Capas de cursos são públicas" on storage.objects;
drop policy if exists "Admin pode enviar capas de cursos" on storage.objects;
drop policy if exists "Admin pode atualizar capas de cursos" on storage.objects;
drop policy if exists "Admin pode excluir capas de cursos" on storage.objects;

create policy "Capas de cursos são públicas"
  on storage.objects for select
  using (bucket_id = 'course-thumbnails');

create policy "Admin pode enviar capas de cursos"
  on storage.objects for insert
  with check (bucket_id = 'course-thumbnails' and public.is_admin());

create policy "Admin pode atualizar capas de cursos"
  on storage.objects for update
  using (bucket_id = 'course-thumbnails' and public.is_admin());

create policy "Admin pode excluir capas de cursos"
  on storage.objects for delete
  using (bucket_id = 'course-thumbnails' and public.is_admin());
