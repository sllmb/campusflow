-- Semestres, unités d'enseignement (UE) et matières.
-- Modèle LMD : semestre → UE (crédits ECTS) → matières (coefficient dans l'UE).
-- Règle n°1 : chaque ligne appartient à un utilisateur, qui seul peut la voir et la modifier (RLS).
-- Les clés étrangères composites (id, user_id) empêchent de rattacher une UE ou une matière
-- à un semestre ou une UE d'un autre compte, même en connaissant son identifiant.

-- ---------------------------------------------------------------------------
-- Semestres
-- ---------------------------------------------------------------------------
create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint semesters_dates_check check (ends_on > starts_on),
  constraint semesters_id_user_key unique (id, user_id)
);

comment on table public.semesters is 'Périodes de cours (semestre, trimestre) de chaque utilisateur.';

create index semesters_user_id_starts_on_idx on public.semesters (user_id, starts_on desc);

-- ---------------------------------------------------------------------------
-- Unités d'enseignement (UE)
-- ---------------------------------------------------------------------------
create table public.teaching_units (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  semester_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 80),
  code text check (code is null or char_length(trim(code)) between 1 and 20),
  ects_credits numeric(4, 1) not null check (ects_credits > 0 and ects_credits <= 60),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teaching_units_semester_fkey foreign key (semester_id, user_id)
    references public.semesters (id, user_id) on delete cascade,
  constraint teaching_units_id_user_key unique (id, user_id)
);

comment on table public.teaching_units is 'Unités d''enseignement d''un semestre, avec leurs crédits ECTS.';

create index teaching_units_semester_idx on public.teaching_units (semester_id, user_id, position);

-- ---------------------------------------------------------------------------
-- Matières
-- ---------------------------------------------------------------------------
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  unit_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 80),
  -- Couleur parmi les 8 du design system (--subject-1 à --subject-8).
  color smallint not null default 1 check (color between 1 and 8),
  -- Poids de la matière dans la moyenne de son UE.
  coefficient numeric(5, 2) not null default 1 check (coefficient > 0 and coefficient <= 100),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subjects_unit_fkey foreign key (unit_id, user_id)
    references public.teaching_units (id, user_id) on delete cascade,
  constraint subjects_id_user_key unique (id, user_id)
);

comment on table public.subjects is 'Matières (ECUE) d''une UE, avec leur coefficient et leur couleur.';

create index subjects_unit_idx on public.subjects (unit_id, user_id, position);

-- ---------------------------------------------------------------------------
-- RLS : chacun ne voit et ne modifie que ses propres lignes
-- ---------------------------------------------------------------------------
alter table public.semesters enable row level security;
alter table public.teaching_units enable row level security;
alter table public.subjects enable row level security;

create policy "Semestres : lecture de ses lignes" on public.semesters
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Semestres : ajout pour soi" on public.semesters
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Semestres : modification de ses lignes" on public.semesters
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Semestres : suppression de ses lignes" on public.semesters
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "UE : lecture de ses lignes" on public.teaching_units
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "UE : ajout pour soi" on public.teaching_units
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "UE : modification de ses lignes" on public.teaching_units
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "UE : suppression de ses lignes" on public.teaching_units
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Matières : lecture de ses lignes" on public.subjects
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Matières : ajout pour soi" on public.subjects
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Matières : modification de ses lignes" on public.subjects
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Matières : suppression de ses lignes" on public.subjects
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Droits explicites : rien pour les visiteurs anonymes.
revoke all on table public.semesters, public.teaching_units, public.subjects from anon, authenticated;
grant select, insert, update, delete
  on table public.semesters, public.teaching_units, public.subjects to authenticated;

-- updated_at automatique (fonction créée dans la migration des profils).
create trigger semesters_set_updated_at before update on public.semesters
  for each row execute function public.set_updated_at();
create trigger teaching_units_set_updated_at before update on public.teaching_units
  for each row execute function public.set_updated_at();
create trigger subjects_set_updated_at before update on public.subjects
  for each row execute function public.set_updated_at();
