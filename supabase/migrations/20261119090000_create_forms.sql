-- Formulaires (inspirés de Google Forms) : l'admin les crée, les étudiants y répondent une fois,
-- l'admin lit les réponses. Tout passe par la RLS : aucune clé secrète n'est nécessaire.
--
-- Anonymat : pour un formulaire anonyme, la réponse est enregistrée SANS lien avec le compte.
-- Le fait d'avoir répondu est noté à part (form_participations), sans date, pour empêcher une
-- deuxième réponse sans permettre de relier une réponse à une personne.

-- Vrai si la session est celle d'un admin (rôle posé par le serveur dans app_metadata) qui a
-- saisi son code 2FA.
create or replace function private.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create table public.forms (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  anonymous boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.form_questions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete cascade,
  position integer not null default 0,
  kind text not null
    check (kind in ('short_text', 'long_text', 'single_choice', 'multiple_choice', 'scale')),
  label text not null check (char_length(trim(label)) between 1 and 300),
  required boolean not null default false,
  options text[] not null default '{}' check (cardinality(options) <= 20),
  created_at timestamptz not null default now()
);

create index form_questions_form_idx on public.form_questions (form_id, position);

-- « Cet étudiant a répondu à ce formulaire » : une ligne par personne et par formulaire.
create table public.form_participations (
  form_id uuid not null references public.forms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (form_id, user_id)
);

create table public.form_responses (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete cascade,
  -- null pour un formulaire anonyme.
  user_id uuid references auth.users (id) on delete set null,
  -- { "<id de question>": "texte" | ["choix", …] | 4 }
  answers jsonb not null check (jsonb_typeof(answers) = 'object' and pg_column_size(answers) <= 20000),
  submitted_at timestamptz not null default now()
);

create index form_responses_form_idx on public.form_responses (form_id);

alter table public.forms enable row level security;
alter table public.form_questions enable row level security;
alter table public.form_participations enable row level security;
alter table public.form_responses enable row level security;

-- Formulaires et questions : les étudiants lisent ceux qui sont ouverts ; l'admin fait tout.
create policy "Formulaires : lecture des ouverts, ou admin" on public.forms
  for select to authenticated using (status = 'open' or (select private.is_admin()));
create policy "Formulaires : écriture admin" on public.forms
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Questions : lecture si formulaire ouvert, ou admin" on public.form_questions
  for select to authenticated using (
    (select private.is_admin())
    or exists (select 1 from public.forms f where f.id = form_id and f.status = 'open')
  );
create policy "Questions : écriture admin" on public.form_questions
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- Participations : chacun ne voit que les siennes (l'admin ne voit pas qui a répondu).
create policy "Participations : lecture des siennes" on public.form_participations
  for select to authenticated using ((select auth.uid()) = user_id);

-- Réponses : lues par l'admin seulement. L'écriture passe par submit_form_response.
create policy "Réponses : lecture admin" on public.form_responses
  for select to authenticated using ((select private.is_admin()));

-- Double authentification : comme partout, rien tant que le code n'est pas saisi.
create policy "2FA : code exigé si activée" on public.forms
  as restrictive for all to authenticated
  using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()));
create policy "2FA : code exigé si activée" on public.form_questions
  as restrictive for all to authenticated
  using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()));
create policy "2FA : code exigé si activée" on public.form_participations
  as restrictive for all to authenticated
  using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()));
create policy "2FA : code exigé si activée" on public.form_responses
  as restrictive for all to authenticated
  using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()));

revoke all on table public.forms, public.form_questions, public.form_participations,
  public.form_responses from anon, authenticated;
grant select, insert, update, delete on table public.forms, public.form_questions
  to authenticated;
grant select on table public.form_participations, public.form_responses to authenticated;

create trigger forms_set_updated_at before update on public.forms
  for each row execute function public.set_updated_at();

-- Envoie la réponse de l'étudiant connecté : une seule fois, seulement si le formulaire est
-- ouvert, anonyme ou non selon le formulaire. Les deux écritures réussissent ou échouent ensemble.
create function public.submit_form_response(p_form_id uuid, p_answers jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  form_anonymous boolean;
begin
  if me is null then
    raise exception 'Connexion requise.' using errcode = '42501';
  end if;
  if not (select private.mfa_satisfied()) then
    raise exception 'Code de double authentification requis.' using errcode = '42501';
  end if;

  select f.anonymous into form_anonymous
  from public.forms f
  where f.id = p_form_id and f.status = 'open';
  if not found then
    raise exception 'Formulaire fermé ou introuvable.' using errcode = 'P0002';
  end if;

  -- Échoue (clé primaire) si l'étudiant a déjà répondu.
  insert into public.form_participations (form_id, user_id) values (p_form_id, me);

  insert into public.form_responses (form_id, user_id, answers)
  values (p_form_id, case when form_anonymous then null else me end, p_answers);
end;
$$;

revoke all on function public.submit_form_response(uuid, jsonb) from public, anon;
grant execute on function public.submit_form_response(uuid, jsonb) to authenticated;
