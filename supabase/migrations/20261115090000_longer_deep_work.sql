-- Deep work de durée libre : jusqu'à 10 h (600 minutes) au lieu de 8 h.
--
-- Les contraintes de la table focus_sessions sont élargies ; les sessions déjà enregistrées
-- respectent toutes les anciennes limites, plus strictes, donc rien n'est à corriger.

alter table public.focus_sessions
  drop constraint focus_sessions_planned_minutes_check,
  add constraint focus_sessions_planned_minutes_check
    check (planned_minutes between 1 and 600),
  drop constraint focus_sessions_focused_seconds_check,
  add constraint focus_sessions_focused_seconds_check
    check (focused_seconds between 0 and 36000);
