"use client";

import { Minus, Pause, Play, Plus, SkipForward, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { SubjectOptionGroup } from "@/features/assignments/queries";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { saveFocusSession } from "../actions";
import {
  DEEP_WORK,
  DEEP_WORK_SHORTCUTS,
  IDLE,
  POMODORO_MINUTES,
  clampDeepWork,
  focusedMs,
  formatMinutes,
  pause,
  remainingMs,
  resume,
  start,
  stop,
  tick,
  type FinishedSession,
  type FocusMode,
  type TimerState,
} from "../lib/timer";

const STORAGE_KEY = "campusflow:focus-timer";
/** Dernière durée de deep work choisie, proposée à nouveau la fois suivante. */
const DEEP_WORK_KEY = "campusflow:deep-work-minutes";

function loadDeepWork() {
  try {
    return clampDeepWork(Number(window.localStorage.getItem(DEEP_WORK_KEY) ?? DEEP_WORK.default));
  } catch {
    return DEEP_WORK.default;
  }
}

function persistDeepWork(minutes: number) {
  try {
    window.localStorage.setItem(DEEP_WORK_KEY, String(minutes));
  } catch {
    // Stockage indisponible : la durée revient simplement à 2 h la prochaine fois.
  }
}

function load(): TimerState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TimerState) : null;
  } catch {
    return null;
  }
}

function persist(state: TimerState) {
  try {
    if (state.status === "idle") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Stockage indisponible (navigation privée) : le minuteur marche, sans reprise après rechargement.
  }
}

/** « 24:59 » ou « 1:59:59 ». */
function formatClock(ms: number) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Trois bips courts à la fin d'une phase. */
function chime() {
  try {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    [0, 0.25, 0.5].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.2);
    });
  } catch {
    // Pas de son disponible : sans gravité.
  }
}

type FocusTimerProps = {
  groups: SubjectOptionGroup[];
  pomodorosToday: number;
};

/**
 * Minuteur. Rendu uniquement dans le navigateur (voir FocusTimerLoader) : son état est relu
 * depuis le stockage local dès le départ, pour reprendre une session après un rechargement.
 */
export function FocusTimer({ groups, pomodorosToday }: FocusTimerProps) {
  const [initial] = useState(() => load());
  const [state, setState] = useState<TimerState>(initial ?? IDLE);
  const [now, setNow] = useState(() => Date.now());
  const [mode, setMode] = useState<FocusMode>(initial?.mode ?? "pomodoro");
  const [deepMinutes, setDeepMinutes] = useState(() =>
    initial?.mode === "deep_work" ? clampDeepWork(initial.plannedMinutes) : loadDeepWork(),
  );
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [, startSaving] = useTransition();

  const subjectName = useCallback(
    (id: string | null) =>
      groups.flatMap((g) => g.options).find((option) => option.id === id)?.label ?? null,
    [groups],
  );

  const save = useCallback(
    (session: FinishedSession) => {
      startSaving(async () => {
        const result = await saveFocusSession(session);
        const name = subjectName(session.subjectId);
        if (result.saved) {
          setMessage(
            `Session enregistrée : ${formatDuration(session.focusedSeconds)}${name ? ` en ${name}` : ""}.`,
          );
        } else if (result.error) {
          setMessage(result.error);
        } else {
          setMessage("Moins d'une minute : session non enregistrée.");
        }
      });
    },
    [subjectName],
  );

  const update = useCallback((next: TimerState) => {
    setState(next);
    persist(next);
  }, []);

  // Dernières valeurs, lues par l'horloge sans la redémarrer à chaque seconde.
  const latest = useRef({ state, pomodorosToday });
  useEffect(() => {
    latest.current = { state, pomodorosToday };
  }, [state, pomodorosToday]);

  // Horloge : rafraîchit l'affichage et détecte la fin de phase. Le temps restant, lui,
  // vient toujours de l'heure de fin ; l'horloge ne sert qu'à redessiner.
  useEffect(() => {
    if (state.status !== "running") return;
    const refresh = () => {
      const t = Date.now();
      setNow(t);
      const { state: current, pomodorosToday: count } = latest.current;
      if (current.status !== "running" || t < current.endsAt) return;
      // Pomodoros du jour, celui qui se termine compris (pour la pause longue tous les 4).
      const ending = current.phase === "focus" && current.mode === "pomodoro" ? 1 : 0;
      const result = tick(current, t, count + ending);
      if (result.finished) save(result.finished);
      latest.current = { state: result.state, pomodorosToday: count };
      chime();
      update(result.state);
    };
    const first = window.setTimeout(refresh, 0);
    const id = window.setInterval(refresh, 500);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [state.status, save, update]);

  // Titre de l'onglet : le temps restant.
  useEffect(() => {
    if (state.status === "idle") {
      document.title = "Pomodoro · CampusFlow";
      return;
    }
    const label = state.phase === "break" ? "Pause" : "Focus";
    document.title = `${formatClock(remainingMs(state, now))} · ${label}`;
  }, [state, now]);

  const minutes = mode === "pomodoro" ? POMODORO_MINUTES : deepMinutes;
  const idle = state.status === "idle";
  const remaining = idle ? minutes * 60_000 : remainingMs(state, now);
  const progress = idle || state.durationMs === 0 ? 0 : 1 - remaining / state.durationMs;
  const onBreak = state.phase === "break" && !idle;

  const onStart = () => {
    setMessage(null);
    const t = Date.now();
    setNow(t);
    if (mode === "deep_work") persistDeepWork(deepMinutes);
    update(start({ mode, minutes, subjectId: subjectId || null }, t));
  };

  const onStop = () => {
    const t = Date.now();
    const done = stop(state, t);
    if (done && done.focusedSeconds >= 60) {
      const ok = window.confirm(
        `Arrêter la session ? ${formatDuration(done.focusedSeconds)} de concentration seront enregistrées.`,
      );
      if (!ok) return;
      save(done);
    }
    update({
      ...IDLE,
      mode: state.mode,
      plannedMinutes: state.plannedMinutes,
      subjectId: state.subjectId,
    });
  };

  const chooseDeepWork = (value: number) => setDeepMinutes(clampDeepWork(value));

  // Anneau de progression.
  const R = 120;
  const C = 2 * Math.PI * R;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div
        className={cn(
          "flex flex-col items-center rounded-card border-2 p-6 shadow-hard transition-colors",
          onBreak ? "bg-blue" : state.mode === "deep_work" && !idle ? "bg-yellow" : "bg-green",
        )}
      >
        <p className="text-sm font-extrabold tracking-[0.08em] uppercase">
          {idle
            ? "Prêt"
            : onBreak
              ? `Pause · ${Math.round(state.durationMs / 60_000)} min`
              : `${state.mode === "deep_work" ? "Deep work" : "Pomodoro"} · concentration`}
        </p>

        <div className="relative my-4 size-64 max-w-full">
          <svg viewBox="0 0 260 260" className="size-full -rotate-90" aria-hidden>
            <circle
              cx="130"
              cy="130"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.15"
              strokeWidth="14"
            />
            <circle
              cx="130"
              cy="130"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p
              role="timer"
              aria-live="off"
              className="text-[56px] leading-none font-extrabold tracking-[-0.04em] tabular-nums"
            >
              {formatClock(remaining)}
            </p>
            {!idle && state.subjectId && (
              <p className="mt-2 max-w-48 truncate text-sm font-bold">
                {subjectName(state.subjectId)}
              </p>
            )}
            {state.status === "paused" && <p className="mt-1 text-sm font-bold">En pause</p>}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {idle && (
            <Button variant="dark" size="lg" onClick={onStart}>
              <Play className="fill-current" /> Démarrer
            </Button>
          )}
          {state.status === "running" && !onBreak && (
            <Button variant="outline" size="lg" onClick={() => update(pause(state, Date.now()))}>
              <Pause className="fill-current" /> Pause
            </Button>
          )}
          {state.status === "paused" && (
            <Button variant="dark" size="lg" onClick={() => update(resume(state, Date.now()))}>
              <Play className="fill-current" /> Reprendre
            </Button>
          )}
          {onBreak && (
            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                update({
                  ...IDLE,
                  mode: state.mode,
                  plannedMinutes: state.plannedMinutes,
                  subjectId: state.subjectId,
                })
              }
            >
              <SkipForward /> Passer la pause
            </Button>
          )}
          {!idle && !onBreak && (
            <Button variant="outline" size="lg" onClick={onStop}>
              <Square className="fill-current" /> Arrêter
            </Button>
          )}
        </div>

        {!idle && !onBreak && (
          <p className="mt-4 text-sm font-semibold">
            Concentré depuis {formatDuration(Math.floor(focusedMs(state, now) / 1000))}
          </p>
        )}
        {message && (
          <p
            role="status"
            className="mt-4 rounded-2xl border-2 bg-surface px-4 py-2 text-center text-sm font-bold"
          >
            {message}
          </p>
        )}
      </div>

      <div className="grid gap-5 rounded-card border-2 bg-surface p-5 shadow-hard">
        <fieldset disabled={!idle} className="disabled:opacity-60">
          <legend className="text-sm font-bold">Type de session</legend>
          <div className="mt-2 grid gap-2">
            {(
              [
                { value: "pomodoro", label: "Pomodoro", detail: formatMinutes(POMODORO_MINUTES) },
                { value: "deep_work", label: "Deep work", detail: formatMinutes(deepMinutes) },
              ] as const
            ).map((option) => (
              <label key={option.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value={option.value}
                  checked={mode === option.value}
                  onChange={() => setMode(option.value)}
                  className="peer sr-only"
                />
                <span className="flex items-center justify-between rounded-2xl border-2 bg-background px-4 py-3 font-bold peer-checked:bg-primary peer-checked:shadow-hard-sm peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue">
                  {option.label}
                  <span className="text-sm">{option.detail}</span>
                </span>
              </label>
            ))}
          </div>

          {mode === "deep_work" && (
            <div
              role="group"
              aria-labelledby="deep-work-duration"
              className="mt-4 rounded-2xl border-2 border-dashed p-3"
            >
              <p id="deep-work-duration" className="text-sm font-bold">
                Durée du deep work
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Retirer 15 minutes"
                  disabled={deepMinutes <= DEEP_WORK.min}
                  onClick={() => chooseDeepWork(deepMinutes - DEEP_WORK.step)}
                >
                  <Minus strokeWidth={2.6} />
                </Button>
                <output
                  aria-live="polite"
                  className="text-3xl font-extrabold tracking-tight tabular-nums"
                >
                  {formatMinutes(deepMinutes)}
                </output>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Ajouter 15 minutes"
                  disabled={deepMinutes >= DEEP_WORK.max}
                  onClick={() => chooseDeepWork(deepMinutes + DEEP_WORK.step)}
                >
                  <Plus strokeWidth={2.6} />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {DEEP_WORK_SHORTCUTS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={deepMinutes === value}
                    onClick={() => chooseDeepWork(value)}
                    className={cn(
                      "inline-flex h-9 cursor-pointer items-center rounded-full border-2 px-3 text-sm font-bold",
                      deepMinutes === value
                        ? "bg-ink text-background"
                        : "bg-background hover:bg-muted",
                    )}
                  >
                    {formatMinutes(value)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[13px] text-ink-soft">
                De {formatMinutes(DEEP_WORK.min)} à {formatMinutes(DEEP_WORK.max)}, par quarts
                d&apos;heure.
              </p>
            </div>
          )}
          <p className="mt-2 text-[13px] text-ink-soft">
            Pomodoro : 25 min puis 5 min de pause (15 min tous les 4). Deep work : une session
            continue de la durée de ton choix, que tu mets en pause toi-même.
          </p>
        </fieldset>

        <div className="grid gap-1.5">
          <Label htmlFor="focus-subject">Matière (facultatif)</Label>
          <Select
            id="focus-subject"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            disabled={!idle}
          >
            <option value="">Sans matière</option>
            {groups.map((group) => (
              <optgroup key={group.semesterId} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
