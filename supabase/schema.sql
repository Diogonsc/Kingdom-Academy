-- Perfis de usuário (extende auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text,
  avatar_url text,
  role text not null default 'member' check (role in ('member', 'leader', 'admin')),
  created_at timestamptz default now()
);

-- Cursos
create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  thumbnail_url text,
  is_published boolean default false,
  requires_enrollment boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Aulas (lessons)
create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses on delete cascade not null,
  title text not null,
  description text,
  video_id text,
  thumbnail_url text,
  duration text,
  order_index integer not null default 0,
  created_at timestamptz default now()
);

-- Matrículas
create table enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade not null,
  course_id uuid references courses on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  enrolled_at timestamptz default now(),
  unique(user_id, course_id)
);

-- Progresso por aula
create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade not null,
  lesson_id uuid references lessons on delete cascade not null,
  is_completed boolean default false,
  completed_at timestamptz,
  unique(user_id, lesson_id)
);

-- Certificados
create table certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade not null,
  course_id uuid references courses on delete cascade not null,
  issued_at timestamptz default now(),
  unique(user_id, course_id)
);

-- Livros da livraria
create table books (
  id text primary key,
  title text not null,
  description text,
  author text,
  link text,
  image_url text,
  created_at timestamptz default now()
);

-- RLS (Row Level Security)
alter table profiles enable row level security;
alter table courses enable row level security;
alter table lessons enable row level security;
alter table enrollments enable row level security;
alter table lesson_progress enable row level security;
alter table certificates enable row level security;
alter table books enable row level security;

-- Função auxiliar (SECURITY DEFINER evita recursão infinita nas policies)
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

-- Policies
create policy "Profiles são visíveis para o próprio usuário" on profiles for select using (auth.uid() = id);
create policy "Usuário pode criar seu perfil" on profiles for insert with check (auth.uid() = id);
create policy "Usuário pode atualizar seu próprio perfil" on profiles for update using (auth.uid() = id);
create policy "Admin pode ver todos os perfis" on profiles for select using (public.is_admin());
create policy "Admin pode atualizar perfis" on profiles for update using (public.is_admin());
create policy "Cursos publicados são públicos" on courses for select using (is_published = true or public.is_admin());
create policy "Apenas admin pode gerenciar cursos" on courses for all using (public.is_admin());
create policy "Aulas de cursos publicados são visíveis" on lessons for select using (exists (select 1 from courses where id = course_id and is_published = true) or public.is_admin());
create policy "Apenas admin pode gerenciar aulas" on lessons for all using (public.is_admin());
create policy "Usuário vê suas matrículas" on enrollments for select using (auth.uid() = user_id);
create policy "Usuário pode solicitar matrícula" on enrollments for insert with check (auth.uid() = user_id and status = 'pending');
create policy "Usuário pode re-solicitar matrícula rejeitada" on enrollments for update using (auth.uid() = user_id and status = 'rejected') with check (auth.uid() = user_id and status = 'pending');
create policy "Admin vê todas as matrículas" on enrollments for select using (public.is_admin());
create policy "Admin gerencia matrículas" on enrollments for update using (public.is_admin());
create policy "Usuário vê seu progresso" on lesson_progress for select using (auth.uid() = user_id);
create policy "Usuário pode atualizar seu progresso" on lesson_progress for all using (auth.uid() = user_id);
create policy "Usuário vê seus certificados" on certificates for select using (auth.uid() = user_id);
create policy "Usuário pode gerar certificados" on certificates for insert with check (auth.uid() = user_id);
create policy "Livros são públicos" on books for select using (true);
create policy "Apenas admin pode gerenciar livros" on books for all using (public.is_admin());

-- Trigger para criar profile ao registrar
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
