-- Profils utilisateurs : une ligne par compte, créée automatiquement à l'inscription.
-- Règle n°1 du projet : chaque utilisateur ne voit et ne modifie que SA ligne (RLS).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Profil public de chaque utilisateur (1 ligne par compte).';

-- RLS : activée AVANT toute exposition. Sans politique, tout est refusé par défaut.
alter table public.profiles enable row level security;

create policy "Chacun lit son propre profil"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Chacun modifie son propre profil"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Pas de politique insert ni delete : la ligne est créée par le trigger ci-dessous
-- et supprimée en cascade avec le compte.

-- Droits explicites : les visiteurs anonymes n'ont rien ; un utilisateur connecté
-- peut lire son profil et ne modifier que le nom affiché.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;

-- Création automatique du profil à l'inscription.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 50));
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mise à jour automatique de updated_at.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
