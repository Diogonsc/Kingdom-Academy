-- Corrige: "Database error saving new user" no signup
-- Execute no SQL Editor do Supabase.

-- 1. Garante coluna email (se o schema antigo foi aplicado sem ela)
alter table public.profiles add column if not exists email text;

-- 2. Recria a função com SECURITY DEFINER + search_path (padrão Supabase)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      split_part(new.email, '@', 1)
    ),
    new.email,
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Policy de INSERT (RLS bloqueia insert sem policy, mesmo no trigger em alguns casos)
drop policy if exists "Usuário pode criar seu perfil" on public.profiles;

create policy "Usuário pode criar seu perfil"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- 4. Permissões para roles do Supabase Auth
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on public.profiles to postgres, service_role;
grant execute on function public.handle_new_user() to postgres, service_role;
