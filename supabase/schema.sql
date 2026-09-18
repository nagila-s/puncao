-- Punção — schema de perfis, desenhos, categorias e tags.
-- Aplique no SQL Editor do Supabase. Para promover admin:
--   update public.profiles set role = 'admin' where id = '<user-uuid>';

-- ---------------------------------------------------------------------------
-- Perfis
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists role text not null default 'user';

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'admin'));

alter table public.profiles enable row level security;

drop policy if exists "users can read own profile" on public.profiles;
drop policy if exists "users can update own profile" on public.profiles;
drop policy if exists "users can insert own profile" on public.profiles;
drop policy if exists "authenticated can read profiles" on public.profiles;

create policy "authenticated can read profiles"
on public.profiles
for select
to authenticated
using (true);

create policy "users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and new.role is distinct from old.role then
    new.role := old.role;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before update on public.profiles
for each row execute procedure public.protect_profile_role();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Categorias
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);

alter table public.categories enable row level security;

drop policy if exists "authenticated can read categories" on public.categories;
create policy "authenticated can read categories"
on public.categories
for select
to authenticated
using (true);

insert into public.categories (slug, name) values
  ('alfabeto', 'Alfabeto'),
  ('alimentos', 'Alimentos'),
  ('animais', 'Animais'),
  ('bandeiras', 'Bandeiras'),
  ('construcoes', 'Construções'),
  ('corpo-humano', 'Corpo humano'),
  ('dinheiro', 'Dinheiro'),
  ('formas-geometricas', 'Formas geométricas'),
  ('malha', 'Malha'),
  ('material-dourado', 'Material dourado'),
  ('matematica', 'Matemática'),
  ('numeros', 'Números'),
  ('objetos', 'Objetos'),
  ('personagens', 'Personagens'),
  ('pessoas', 'Pessoas'),
  ('plantas', 'Plantas'),
  ('quimica', 'Química'),
  ('roupas-e-calcados', 'Roupas e calçados'),
  ('veiculos', 'Veículos')
on conflict (slug) do update set name = excluded.name;

-- ---------------------------------------------------------------------------
-- Desenhos
-- ---------------------------------------------------------------------------
create table if not exists public.drawings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Sem título',
  author_name text,
  grid jsonb not null,
  letters_preview text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.drawings
  drop constraint if exists drawings_status_check;

alter table public.drawings
  add constraint drawings_status_check
  check (status in ('draft', 'pending', 'published', 'rejected'));

create index if not exists drawings_owner_id_idx on public.drawings (owner_id);
create index if not exists drawings_status_idx on public.drawings (status);
create index if not exists drawings_updated_at_idx on public.drawings (updated_at desc);

alter table public.drawings enable row level security;

drop policy if exists "owners can select own drawings" on public.drawings;
drop policy if exists "authenticated can select published drawings" on public.drawings;
drop policy if exists "admins can select all drawings" on public.drawings;
drop policy if exists "owners can insert own drafts" on public.drawings;
drop policy if exists "owners can update own drawings" on public.drawings;
drop policy if exists "admins can update drawings" on public.drawings;
drop policy if exists "owners can delete own drawings" on public.drawings;

create policy "owners can select own drawings"
on public.drawings
for select
to authenticated
using (auth.uid() = owner_id);

create policy "authenticated can select published drawings"
on public.drawings
for select
to authenticated
using (status = 'published');

create policy "admins can select all drawings"
on public.drawings
for select
to authenticated
using (public.is_admin());

create policy "owners can insert own drafts"
on public.drawings
for insert
to authenticated
with check (auth.uid() = owner_id and status = 'draft');

create policy "owners can update own drawings"
on public.drawings
for update
to authenticated
using (auth.uid() = owner_id)
with check (
  auth.uid() = owner_id
  and status in ('draft', 'pending', 'rejected')
);

create policy "admins can update drawings"
on public.drawings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "owners can delete own drawings"
on public.drawings
for delete
to authenticated
using (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------------
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists tags_name_lower_idx on public.tags (lower(name));

alter table public.tags enable row level security;

drop policy if exists "authenticated can read tags" on public.tags;
drop policy if exists "authenticated can insert tags" on public.tags;

create policy "authenticated can read tags"
on public.tags
for select
to authenticated
using (true);

create policy "authenticated can insert tags"
on public.tags
for insert
to authenticated
with check (created_by is null or created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- Junções
-- ---------------------------------------------------------------------------
create table if not exists public.drawing_categories (
  drawing_id uuid not null references public.drawings (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (drawing_id, category_id)
);

create table if not exists public.drawing_tags (
  drawing_id uuid not null references public.drawings (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (drawing_id, tag_id)
);

alter table public.drawing_categories enable row level security;
alter table public.drawing_tags enable row level security;

drop policy if exists "select drawing_categories visible" on public.drawing_categories;
drop policy if exists "owners insert drawing_categories" on public.drawing_categories;
drop policy if exists "owners delete drawing_categories" on public.drawing_categories;
drop policy if exists "admins manage drawing_categories" on public.drawing_categories;

create policy "select drawing_categories visible"
on public.drawing_categories
for select
to authenticated
using (
  exists (
    select 1 from public.drawings d
    where d.id = drawing_id
      and (d.owner_id = auth.uid() or d.status = 'published' or public.is_admin())
  )
);

create policy "owners insert drawing_categories"
on public.drawing_categories
for insert
to authenticated
with check (
  exists (
    select 1 from public.drawings d
    where d.id = drawing_id and d.owner_id = auth.uid()
  )
);

create policy "owners delete drawing_categories"
on public.drawing_categories
for delete
to authenticated
using (
  exists (
    select 1 from public.drawings d
    where d.id = drawing_id and d.owner_id = auth.uid()
  )
);

drop policy if exists "select drawing_tags visible" on public.drawing_tags;
drop policy if exists "owners insert drawing_tags" on public.drawing_tags;
drop policy if exists "owners delete drawing_tags" on public.drawing_tags;

create policy "select drawing_tags visible"
on public.drawing_tags
for select
to authenticated
using (
  exists (
    select 1 from public.drawings d
    where d.id = drawing_id
      and (d.owner_id = auth.uid() or d.status = 'published' or public.is_admin())
  )
);

create policy "owners insert drawing_tags"
on public.drawing_tags
for insert
to authenticated
with check (
  exists (
    select 1 from public.drawings d
    where d.id = drawing_id and d.owner_id = auth.uid()
  )
);

create policy "owners delete drawing_tags"
on public.drawing_tags
for delete
to authenticated
using (
  exists (
    select 1 from public.drawings d
    where d.id = drawing_id and d.owner_id = auth.uid()
  )
);
