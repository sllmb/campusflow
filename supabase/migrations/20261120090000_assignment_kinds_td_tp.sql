-- Deux nouveaux types d'échéance : TD (travaux dirigés) et TP (travaux pratiques).
--
-- La contrainte sur assignments.kind est élargie ; les échéances déjà enregistrées gardent leur
-- type (devoir, projet ou examen), donc rien n'est à corriger.

alter table public.assignments
  drop constraint assignments_kind_check,
  add constraint assignments_kind_check
    check (kind in ('homework', 'td', 'tp', 'project', 'exam'));
