-- Arena Battles game tables
-- Run this in Supabase SQL editor

-- Mercenary type definitions (seeded data)
create table if not exists public.mercenary_templates (
  id          serial primary key,
  name        text not null,
  type        text not null,
  base_hp     int not null,
  base_atk    int not null,
  base_def    int not null,
  base_range  numeric(3,1) not null,
  base_speed  numeric(4,1) not null,
  tier        int not null default 1,
  description text,
  color       text not null
);

-- Each player's owned mercenaries (one row per merc, duplicates of same type allowed)
create table if not exists public.player_mercenaries (
  id              serial primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  template_id     int not null references public.mercenary_templates(id),
  level           int not null default 1,
  xp              int not null default 0,
  battles_fought  int not null default 0
);

create index if not exists player_mercenaries_user_idx
  on public.player_mercenaries(user_id);

-- Player progression
create table if not exists public.player_progress (
  id                  serial primary key,
  user_id             uuid not null references auth.users(id) on delete cascade unique,
  level               int not null default 1,
  total_xp            int not null default 0,
  gold                int not null default 200,
  highest_arena       int not null default 0
);

-- Battle history
create table if not exists public.battle_results (
  id            serial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  arena_id      int not null,
  won           boolean not null,
  mercs_lost    int not null default 0,
  xp_gained     int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists battle_results_user_idx
  on public.battle_results(user_id, created_at desc);

-- RLS
alter table public.player_mercenaries enable row level security;
alter table public.player_progress enable row level security;
alter table public.battle_results enable row level security;

-- Player mercenaries: users can CRUD their own
create policy "Users can CRUD own mercenaries" on public.player_mercenaries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Player progress: users can CRUD their own
create policy "Users can CRUD own progress" on public.player_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Battle results: users can CRUD their own
create policy "Users can CRUD own battle results" on public.battle_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed mercenary templates (player units)
insert into public.mercenary_templates (id, name, type, base_hp, base_atk, base_def, base_range, base_speed, tier, description, color) values
  (1, 'Spearman',    'spearman',      100, 15, 8,  1.0, 80,  1, 'Balanced melee fighter',     '#4ade80'),
  (2, 'Swordsman',   'swordsman',     70,  25, 5,  1.0, 110, 1, 'Fast, high damage, fragile', '#facc15'),
  (3, 'Archer',      'archer',        60,  18, 3,  3.0, 70,  1, 'Ranged attacker, weak up close', '#60a5fa'),
  (4, 'Shieldbearer','shieldbearer',  150, 8,  18, 1.0, 60,  2, 'High HP and defense',        '#fb923c'),
  (5, 'Healer',      'healer',        80,  5,  4,  2.0, 75,  2, 'Heals nearby allies',        '#a78bfa')
on conflict (id) do nothing;

-- Seed enemy templates
insert into public.mercenary_templates (id, name, type, base_hp, base_atk, base_def, base_range, base_speed, tier, description, color) values
  (6,  'Zombie',       'zombie',        100, 12, 5,  1.0, 60,  1, 'Slow, durable undead',   '#86efac'),
  (7,  'Fast Zombie',  'fast_zombie',   60,  8,  3,  1.0, 100, 1, 'Quick but fragile',      '#fde68a'),
  (8,  'Ranged Zombie','ranged_zombie', 50,  15, 2,  3.0, 55,  1, 'Throws bones from afar', '#93c5fd'),
  (9,  'Tank Zombie',  'tank_zombie',   180, 6,  15, 1.0, 40,  2, 'Extremely tough',        '#fdba74')
on conflict (id) do nothing;
