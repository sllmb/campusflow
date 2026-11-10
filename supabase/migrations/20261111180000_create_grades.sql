-- Notes et décision du jury.
-- Une note appartient à une matière ; sa valeur est saisie sur un barème (sur 20 par défaut)
-- et pèse dans la moyenne de la matière selon son poids (coefficient de l'épreuve).

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null,
  title text not null check (char_length(trim(title)) between 1 and 80),
  score numeric(6, 2) not null check (score >= 0),
  out_of numeric(6, 2) not null default 20 check (out_of > 0 and out_of <= 1000),
  weight numeric(5, 2) not null default 1 check (weight > 0 and weight <= 100),
  graded_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grades_score_max_check check (score <= out_of),
  -- Clé étrangère composite : impossible de rattacher une note à la matière d'un autre compte.
  constraint grades_subject_fkey foreign key (subject_id, user_id)
    references public.subjects (id, user_id) on delete cascade
);

comment on table public.grades is 'Notes de chaque utilisateur, par matière, avec barème et poids.';

create index grades_subject_idx on public.grades (subject_id, user_id);

alter table public.grades enable row level security;

create policy "Notes : lecture de ses lignes" on public.grades
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Notes : ajout pour soi" on public.grades
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Notes : modification de ses lignes" on public.grades
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Notes : suppression de ses lignes" on public.grades
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on table public.grades from anon, authenticated;
grant select, insert, update, delete on table public.grades to authenticated;

create trigger grades_set_updated_at before update on public.grades
  for each row execute function public.set_updated_at();

-- Décision du jury : une UE sous 10/20 peut être validée par le conseil.
alter table public.teaching_units
  add column jury_validated boolean not null default false;

comment on column public.teaching_units.jury_validated is
  'UE validée par décision du jury malgré une moyenne inférieure à 10/20.';
