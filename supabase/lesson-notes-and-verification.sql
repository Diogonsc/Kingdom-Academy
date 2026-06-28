-- Anotações por aula (P3-05)
create table if not exists lesson_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade not null,
  lesson_id uuid references lessons on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, lesson_id)
);

alter table lesson_notes enable row level security;

create policy "Usuário gerencia suas anotações"
  on lesson_notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Verificação pública de certificados (P4-02)
create or replace function public.verify_certificate(p_certificate_id uuid)
returns table (
  certificate_id uuid,
  student_name text,
  course_title text,
  issued_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select c.id, p.name, co.title, c.issued_at
  from certificates c
  join profiles p on p.id = c.user_id
  join courses co on co.id = c.course_id
  where c.id = p_certificate_id;
$$;

grant execute on function public.verify_certificate(uuid) to anon, authenticated;

-- Bucket de avatares (leitura pública)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

create policy "Avatares são públicos para leitura"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Usuário faz upload do próprio avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Usuário atualiza o próprio avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Usuário remove o próprio avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
