/**
 * Minuteur Pomodoro / deep work — fonctions pures, sans React ni navigateur.
 *
 * Le temps restant se calcule toujours à partir de l'heure de fin (`endsAt`), jamais en
 * comptant des secondes : un onglet en arrière-plan ou un téléphone en veille ralentit les
 * minuteurs JavaScript, mais l'heure de fin, elle, ne bouge pas.
 */

export type FocusMode = "pomodoro" | "deep_work";

/** Pomodoro : durée fixe. */
export const POMODORO_MINUTES = 25;

/** Deep work : durée choisie par l'étudiant, de 1 h à 10 h, par pas de 15 min. */
export const DEEP_WORK = { min: 60, max: 600, step: 15, default: 120 } as const;

/** Durées proposées en un geste ; les autres se règlent avec − et +. */
export const DEEP_WORK_SHORTCUTS = [60, 90, 120, 180, 240, 360, 600] as const;

/** Ramène une durée de deep work dans les limites, au quart d'heure le plus proche. */
export function clampDeepWork(minutes: number) {
  if (!Number.isFinite(minutes)) return DEEP_WORK.default;
  const rounded = Math.round(minutes / DEEP_WORK.step) * DEEP_WORK.step;
  return Math.min(DEEP_WORK.max, Math.max(DEEP_WORK.min, rounded));
}

/** 90 → « 1 h 30 », 120 → « 2 h », 25 → « 25 min ». */
export function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

/** Réglage proposé à l'ouverture du minuteur (lien « Lancer » d'un créneau de révision). */
export type FocusPreset = {
  mode: FocusMode;
  /** Durée du deep work, déjà ramenée dans les limites. */
  minutes?: number;
  subjectId: string | null;
};

/** Pause après le n-ième Pomodoro du jour : 5 min, et 15 min tous les 4. */
export function breakMinutesAfter(pomodoroCount: number) {
  return pomodoroCount > 0 && pomodoroCount % 4 === 0 ? 15 : 5;
}

export type TimerState = {
  status: "idle" | "running" | "paused";
  phase: "focus" | "break";
  mode: FocusMode;
  plannedMinutes: number;
  subjectId: string | null;
  /** Début de la phase de concentration (ms). */
  startedAt: number;
  /** Heure de fin prévue, quand le minuteur tourne (ms). */
  endsAt: number;
  /** Temps restant figé, quand le minuteur est en pause (ms). */
  pausedRemaining: number;
  /** Début de la pause manuelle en cours (ms). */
  pausedAt: number;
  /** Durée totale de la phase en cours (ms). */
  durationMs: number;
};

/** Session à enregistrer en base. */
export type FinishedSession = {
  mode: FocusMode;
  plannedMinutes: number;
  subjectId: string | null;
  startedAt: number;
  endedAt: number;
  focusedSeconds: number;
  completed: boolean;
};

export const IDLE: TimerState = {
  status: "idle",
  phase: "focus",
  mode: "pomodoro",
  plannedMinutes: 25,
  subjectId: null,
  startedAt: 0,
  endsAt: 0,
  pausedRemaining: 0,
  pausedAt: 0,
  durationMs: 0,
};

export function start(
  config: { mode: FocusMode; minutes: number; subjectId: string | null },
  now: number,
): TimerState {
  const durationMs = config.minutes * 60_000;
  return {
    ...IDLE,
    status: "running",
    phase: "focus",
    mode: config.mode,
    plannedMinutes: config.minutes,
    subjectId: config.subjectId,
    startedAt: now,
    endsAt: now + durationMs,
    durationMs,
  };
}

export function remainingMs(state: TimerState, now: number) {
  if (state.status === "idle") return 0;
  if (state.status === "paused") return state.pausedRemaining;
  return Math.max(0, state.endsAt - now);
}

/** Temps de concentration écoulé dans la phase en cours (pauses manuelles exclues). */
export function focusedMs(state: TimerState, now: number) {
  if (state.status === "idle" || state.phase !== "focus") return 0;
  return state.durationMs - remainingMs(state, now);
}

export function pause(state: TimerState, now: number): TimerState {
  if (state.status !== "running") return state;
  return { ...state, status: "paused", pausedRemaining: remainingMs(state, now), pausedAt: now };
}

export function resume(state: TimerState, now: number): TimerState {
  if (state.status !== "paused") return state;
  return { ...state, status: "running", endsAt: now + state.pausedRemaining, pausedAt: 0 };
}

/**
 * À appeler régulièrement. Si la phase est finie : renvoie la session terminée (phase de
 * concentration) et l'état suivant (pause après un Pomodoro, sinon repos).
 * `pomodorosDone` : nombre de Pomodoros du jour, celui-ci compris (pour la longue pause).
 */
export function tick(
  state: TimerState,
  now: number,
  pomodorosDone = 0,
): { state: TimerState; finished: FinishedSession | null } {
  if (state.status !== "running" || now < state.endsAt) return { state, finished: null };

  if (state.phase === "break") return { state: idleKeeping(state), finished: null };

  const finished: FinishedSession = {
    mode: state.mode,
    plannedMinutes: state.plannedMinutes,
    subjectId: state.subjectId,
    startedAt: state.startedAt,
    endedAt: state.endsAt,
    focusedSeconds: Math.round(state.durationMs / 1000),
    completed: true,
  };

  if (state.mode === "pomodoro") {
    const breakMs = breakMinutesAfter(pomodorosDone) * 60_000;
    return {
      state: {
        ...state,
        phase: "break",
        status: "running",
        startedAt: state.endsAt,
        endsAt: state.endsAt + breakMs,
        durationMs: breakMs,
      },
      finished,
    };
  }
  return { state: idleKeeping(state), finished };
}

/** Arrête tout. Renvoie la session à enregistrer (phase de concentration), sinon null. */
export function stop(state: TimerState, now: number): FinishedSession | null {
  if (state.status === "idle" || state.phase !== "focus") return null;
  return {
    mode: state.mode,
    plannedMinutes: state.plannedMinutes,
    subjectId: state.subjectId,
    startedAt: state.startedAt,
    endedAt: now,
    focusedSeconds: Math.round(focusedMs(state, now) / 1000),
    completed: false,
  };
}

/** Repos, en gardant le mode et la matière choisis pour la prochaine session. */
function idleKeeping(state: TimerState): TimerState {
  return {
    ...IDLE,
    mode: state.mode,
    plannedMinutes: state.plannedMinutes,
    subjectId: state.subjectId,
  };
}
