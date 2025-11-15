-- Profiles table stores roles and master password metadata
create table if not exists public.profiles (
  id bigint primary key generated always as identity,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user','admin')),
  master_password_salt text,
  master_password_hash text,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_user_id_key on public.profiles(user_id);

-- Achievement tracker
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  fulfilling_score int not null default 3,
  happiness_score int not null default 3,
  accomplished_score int not null default 3,
  tags text[] default array[]::text[],
  created_at timestamptz not null default now()
);

create index if not exists achievements_user_created_idx
  on public.achievements(user_id, created_at desc);

-- Encryption vault (cipher text only)
create table if not exists public.vault_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  iv text not null,
  cipher text not null,
  created_at timestamptz not null default now()
);

create index if not exists vault_entries_user_created_idx
  on public.vault_entries(user_id, created_at desc);

-- Stoic problems & quotes
create table if not exists public.stoic_problems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.stoic_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.stoic_problems(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists stoic_quotes_problem_idx
  on public.stoic_quotes(problem_id);

-- Admin audit log
create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  entity text not null,
  entity_id text,
  details text,
  created_at timestamptz not null default now()
);

alter table public.admin_actions
  add constraint admin_actions_admin_id_fkey
  foreign key (admin_id) references public.profiles(user_id) on delete cascade;

-- Basic RLS
alter table public.profiles enable row level security;
alter table public.achievements enable row level security;
alter table public.vault_entries enable row level security;
alter table public.stoic_problems enable row level security;
alter table public.stoic_quotes enable row level security;
alter table public.admin_actions enable row level security;

-- Profiles: users can see their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = user_id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = user_id);

-- Achievements
create policy "Users can CRUD own achievements" on public.achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Vault
create policy "Users can CRUD own vault entries" on public.vault_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Stoic
create policy "Users can CRUD own stoic problems" on public.stoic_problems
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can CRUD own stoic quotes" on public.stoic_quotes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Admin actions: only admins can see
create policy "Admins can view admin_actions" on public.admin_actions
  for select using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- Insert admin actions only by admins
create policy "Admins can insert admin_actions" on public.admin_actions
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );
