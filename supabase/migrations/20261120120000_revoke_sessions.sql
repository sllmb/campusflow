-- Fermeture immédiate des sessions (compte suspendu par un admin).
--
-- Jusqu'ici, suspendre un compte bloquait les nouvelles connexions, mais le jeton déjà délivré
-- restait valable jusqu'à son expiration (1 h) : la base ne vérifiait que sa signature.
--
-- 1. private.session_active() : vrai si la session du jeton existe encore dans auth.sessions.
--    Des politiques RESTRICTIVES l'exigent sur toutes les tables : une session supprimée ne lit
--    ni n'écrit plus rien, tout de suite. (Même principe que la 2FA, migration 20261113090000.)
-- 2. public.revoke_user_sessions(uuid) : supprime toutes les sessions d'un compte (et leurs
--    jetons de renouvellement). Réservée à la clé secrète (service_role), donc à l'admin côté
--    serveur ; jamais appelable depuis le navigateur.

create or replace function private.session_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.sessions as session
    where session.id = nullif(auth.jwt() ->> 'session_id', '')::uuid
  );
$$;

revoke all on function private.session_active() from public, anon;
grant execute on function private.session_active() to authenticated;

create policy "Session active exigée" on public.profiles
  as restrictive for all to authenticated
  using ((select private.session_active())) with check ((select private.session_active()));
create policy "Session active exigée" on public.semesters
  as restrictive for all to authenticated
  using ((select private.session_active())) with check ((select private.session_active()));
create policy "Session active exigée" on public.teaching_units
  as restrictive for all to authenticated
  using ((select private.session_active())) with check ((select private.session_active()));
create policy "Session active exigée" on public.subjects
  as restrictive for all to authenticated
  using ((select private.session_active())) with check ((select private.session_active()));
create policy "Session active exigée" on public.assignments
  as restrictive for all to authenticated
  using ((select private.session_active())) with check ((select private.session_active()));
create policy "Session active exigée" on public.grades
  as restrictive for all to authenticated
  using ((select private.session_active())) with check ((select private.session_active()));
create policy "Session active exigée" on public.focus_sessions
  as restrictive for all to authenticated
  using ((select private.session_active())) with check ((select private.session_active()));
create policy "Session active exigée" on public.revision_sessions
  as restrictive for all to authenticated
  using ((select private.session_active())) with check ((select private.session_active()));
create policy "Session active exigée" on public.push_subscriptions
  as restrictive for all to authenticated
  using ((select private.session_active())) with check ((select private.session_active()));
create policy "Session active exigée" on public.forms
  as restrictive for all to authenticated
  using ((select private.session_active())) with check ((select private.session_active()));
create policy "Session active exigée" on public.form_questions
  as restrictive for all to authenticated
  using ((select private.session_active())) with check ((select private.session_active()));
create policy "Session active exigée" on public.form_participations
  as restrictive for all to authenticated
  using ((select private.session_active())) with check ((select private.session_active()));
create policy "Session active exigée" on public.form_responses
  as restrictive for all to authenticated
  using ((select private.session_active())) with check ((select private.session_active()));

create or replace function public.revoke_user_sessions(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.refresh_tokens where user_id = target::text;
  delete from auth.sessions where user_id = target;
end;
$$;

revoke all on function public.revoke_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.revoke_user_sessions(uuid) to service_role;
