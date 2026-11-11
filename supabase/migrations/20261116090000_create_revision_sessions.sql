-- Planning de révisions : des créneaux (un jour, une durée) rattachés à un examen ou un projet.
-- Supprimer l'examen supprime ses créneaux.

-- Clé unique (id, user_id) sur les devoirs, cible de la clé étrangère composite ci-dessous.
alter table public.assignments
  add constraint assignments_id_user_key unique (id, user_id);

create table public.revision_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  assignment_id uuid not null,
  -- Jour prévu (date de calendrier, dans le fuseau de l'étudiant).
  planned_on date not null,
  -- De 15 min à 10 h, par quarts d'heure.
  minutes integer not null check (minutes between 15 and 600 and minutes % 15 = 0),
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Clé étrangère composite : impossible de rattacher un créneau à l'examen d'un autre compte.
  constraint revision_sessions_assignment_fkey foreign key (assignment_id, user_id)
    references public.assignments (id, user_id) on delete cascade
);

comment on table public.revision_sessions is
  'Créneaux de révision planifiés avant un examen ou un projet.';

create index revision_sessions_user_day_idx on public.revision_sessions (user_id, planned_on);
create index revision_sessions_assignment_idx
  on public.revision_sessions (assignment_id, user_id, planned_on);

-- RLS : chacun ne voit et ne modifie que ses propres lignes.
alter table public.revision_sessions enable row level security;

create policy "Révisions : lecture de ses lignes" on public.revision_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Révisions : ajout pour soi" on public.revision_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Révisions : modification de ses lignes" on public.revision_sessions
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Révisions : suppression de ses lignes" on public.revision_sessions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Double authentification : comme pour les autres tables, rien tant que le code n'est pas saisi.
create policy "2FA : code exigé si activée" on public.revision_sessions
  as restrictive for all to authenticated
  using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()));

revoke all on table public.revision_sessions from anon, authenticated;
grant select, insert, update, delete on table public.revision_sessions to authenticated;

create trigger revision_sessions_set_updated_at before update on public.revision_sessions
  for each row execute function public.set_updated_at();
