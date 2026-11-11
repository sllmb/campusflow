-- Suppression de son propre compte (droit à l'effacement, RGPD).
--
-- Supprime l'utilisateur connecté dans auth.users ; toutes ses données (profil, semestres, UE,
-- matières, devoirs, notes, sessions) partent avec, grâce aux clés étrangères ON DELETE CASCADE.
-- SECURITY DEFINER : un utilisateur ne peut pas toucher à auth.users lui-même ; la fonction
-- ne supprime jamais que auth.uid(), c'est-à-dire l'appelant.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'Non connecté' using errcode = '42501';
  end if;
  -- Compte protégé par la 2FA : le code doit avoir été saisi (session « aal2 »).
  if not (select private.mfa_satisfied()) then
    raise exception 'Code de double authentification requis' using errcode = '42501';
  end if;
  delete from auth.users where id = me;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
