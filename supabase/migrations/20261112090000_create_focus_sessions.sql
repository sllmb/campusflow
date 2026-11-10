-- Sessions de concentration : Pomodoro (25 min) et deep work (2 h ou 4 h, en continu).
-- Une ligne est enregistrée à la fin d'une session (terminée ou arrêtée avant la fin).

create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Matière facultative. Si elle est supprimée, la session reste, sans matière.
  subject_id uuid,
  mode text not null check (mode in ('pomodoro', 'deep_work')),
  planned_minutes integer not null check (planned_minutes between 1 and 480),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  -- Temps réellement passé concentré (pauses exclues), en secondes.
  focused_seconds integer not null check (focused_seconds between 0 and 28800),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint focus_sessions_dates_check check (ended_at >= started_at),
  constraint focus_sessions_focused_check
    check (focused_seconds <= extract(epoch from (ended_at - started_at)) + 60),
  -- Clé étrangère composite : impossible de rattacher une session à la matière d'un autre compte.
  -- (MATCH SIMPLE : non vérifiée quand subject_id est null.)
  constraint focus_sessions_subject_fkey foreign key (subject_id, user_id)
    references public.subjects (id, user_id) on delete set null (subject_id)
);

comment on table public.focus_sessions is 'Sessions Pomodoro et deep work terminées, par utilisateur.';

create index focus_sessions_user_ended_idx on public.focus_sessions (user_id, ended_at desc);

alter table public.focus_sessions enable row level security;

create policy "Sessions : lecture de ses lignes" on public.focus_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Sessions : ajout pour soi" on public.focus_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Sessions : suppression de ses lignes" on public.focus_sessions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Pas de modification : une session terminée ne change plus.
revoke all on table public.focus_sessions from anon, authenticated;
grant select, insert, delete on table public.focus_sessions to authenticated;
