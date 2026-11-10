-- Devoirs, projets et examens, rattachés à une matière.
-- Échéances stockées en timestamptz (UTC) ; l'application les affiche dans le fuseau de l'utilisateur.

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null,
  kind text not null default 'homework' check (kind in ('homework', 'project', 'exam')),
  title text not null check (char_length(trim(title)) between 1 and 120),
  notes text check (notes is null or char_length(notes) <= 2000),
  due_at timestamptz not null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Clé étrangère composite : impossible de rattacher un devoir à la matière d'un autre compte.
  constraint assignments_subject_fkey foreign key (subject_id, user_id)
    references public.subjects (id, user_id) on delete cascade
);

comment on table public.assignments is 'Devoirs, projets et examens de chaque utilisateur, avec échéance.';

create index assignments_user_due_idx on public.assignments (user_id, due_at);
create index assignments_subject_idx on public.assignments (subject_id, user_id);

-- RLS : chacun ne voit et ne modifie que ses propres lignes.
alter table public.assignments enable row level security;

create policy "Devoirs : lecture de ses lignes" on public.assignments
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Devoirs : ajout pour soi" on public.assignments
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Devoirs : modification de ses lignes" on public.assignments
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Devoirs : suppression de ses lignes" on public.assignments
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on table public.assignments from anon, authenticated;
grant select, insert, update, delete on table public.assignments to authenticated;

create trigger assignments_set_updated_at before update on public.assignments
  for each row execute function public.set_updated_at();

-- completed_at : renseigné quand le devoir passe à « terminé », effacé sinon.
create function public.set_assignment_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'done' then
    if tg_op = 'INSERT' or old.status is distinct from 'done' then
      new.completed_at = now();
    end if;
  else
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger assignments_set_completed_at before insert or update on public.assignments
  for each row execute function public.set_assignment_completed_at();
