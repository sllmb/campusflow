-- Double authentification (2FA) : protection au niveau de la base de données.
--
-- Pour un compte qui a activé la 2FA, une session ouverte avec le seul mot de passe (« aal1 »)
-- ne peut ni lire ni modifier aucune donnée : il faut avoir saisi le code (« aal2 »).
-- Les comptes sans 2FA ne sont pas concernés.
--
-- Les politiques ci-dessous sont RESTRICTIVES : elles s'ajoutent (ET logique) aux politiques
-- existantes « chacun ne voit que ses lignes », sans les remplacer.

create schema if not exists private;
revoke all on schema private from public;

-- Vrai si la session respecte le niveau exigé : soit le code 2FA a été saisi, soit le compte
-- n'a pas de 2FA. SECURITY DEFINER pour lire auth.mfa_factors, inaccessible aux utilisateurs.
create or replace function private.mfa_satisfied()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    or not exists (
      select 1
      from auth.mfa_factors as factor
      where factor.user_id = (select auth.uid())
        and factor.status = 'verified'
    );
$$;

revoke all on function private.mfa_satisfied() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.mfa_satisfied() to authenticated;

create policy "2FA : code exigé si activée" on public.profiles
  as restrictive for all to authenticated
  using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()));
create policy "2FA : code exigé si activée" on public.semesters
  as restrictive for all to authenticated
  using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()));
create policy "2FA : code exigé si activée" on public.teaching_units
  as restrictive for all to authenticated
  using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()));
create policy "2FA : code exigé si activée" on public.subjects
  as restrictive for all to authenticated
  using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()));
create policy "2FA : code exigé si activée" on public.assignments
  as restrictive for all to authenticated
  using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()));
create policy "2FA : code exigé si activée" on public.grades
  as restrictive for all to authenticated
  using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()));
create policy "2FA : code exigé si activée" on public.focus_sessions
  as restrictive for all to authenticated
  using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()));
