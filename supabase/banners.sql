-- Banners do Dashboard e Livraria — Kingdom Academy
-- Execute no SQL Editor do Supabase

create table if not exists site_banners (
  id uuid primary key default gen_random_uuid(),
  location text not null check (location in ('dashboard', 'bookstore')),
  image_url text not null,
  alt_text text not null default '',
  link text,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists site_banners_location_order_idx
  on site_banners (location, order_index);

alter table site_banners enable row level security;

create policy "Usuários autenticados veem banners ativos"
  on site_banners for select
  using (auth.role() = 'authenticated' and is_active = true);

create policy "Admin gerencia banners"
  on site_banners for all
  using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('site-banners', 'site-banners', true)
on conflict (id) do update set public = true;

drop policy if exists "Banners são públicos" on storage.objects;
drop policy if exists "Admin envia banners" on storage.objects;
drop policy if exists "Admin atualiza banners" on storage.objects;
drop policy if exists "Admin exclui banners" on storage.objects;

create policy "Banners são públicos"
  on storage.objects for select
  using (bucket_id = 'site-banners');

create policy "Admin envia banners"
  on storage.objects for insert
  with check (bucket_id = 'site-banners' and public.is_admin());

create policy "Admin atualiza banners"
  on storage.objects for update
  using (bucket_id = 'site-banners' and public.is_admin());

create policy "Admin exclui banners"
  on storage.objects for delete
  using (bucket_id = 'site-banners' and public.is_admin());
