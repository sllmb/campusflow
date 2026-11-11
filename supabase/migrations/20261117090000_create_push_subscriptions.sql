-- Rappels d'échéances : abonnements aux notifications « push », un par appareil.
--
-- Un abonnement est l'adresse fournie par le navigateur (endpoint) et ses deux clés de
-- chiffrement. Le rappel du matin est envoyé par le serveur (clé secrète) : il lit tous les
-- abonnements et note le jour du dernier envoi pour ne jamais envoyer deux fois le même jour.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique check (endpoint like 'https://%' and char_length(endpoint) <= 1000),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  -- Fuseau de l'appareil, pour calculer « aujourd'hui » au moment de l'envoi.
  time_zone text not null default 'Europe/Paris' check (char_length(time_zone) <= 64),
  last_sent_on date,
  created_at timestamptz not null default now()
);

comment on table public.push_subscriptions is
  'Abonnements aux rappels (notifications push), un par appareil.';

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- RLS : chacun voit et supprime ses abonnements. L'ajout passe par la fonction ci-dessous.
alter table public.push_subscriptions enable row level security;

create policy "Rappels : lecture de ses abonnements" on public.push_subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Rappels : suppression de ses abonnements" on public.push_subscriptions
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "2FA : code exigé si activée" on public.push_subscriptions
  as restrictive for all to authenticated
  using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()));

revoke all on table public.push_subscriptions from anon, authenticated;
grant select, delete on table public.push_subscriptions to authenticated;

-- Enregistre l'abonnement de l'appareil pour l'utilisateur connecté. Un même appareil ne
-- reçoit les rappels que d'un seul compte : le dernier qui s'y est abonné.
-- SECURITY DEFINER pour pouvoir retirer l'abonnement d'un autre compte sur cet appareil.
create function public.save_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_time_zone text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'Connexion requise.' using errcode = '42501';
  end if;
  if not (select private.mfa_satisfied()) then
    raise exception 'Code de double authentification requis.' using errcode = '42501';
  end if;

  delete from public.push_subscriptions where endpoint = p_endpoint;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, time_zone)
  values (me, p_endpoint, p_p256dh, p_auth, p_time_zone);
end;
$$;

revoke all on function public.save_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text) to authenticated;
