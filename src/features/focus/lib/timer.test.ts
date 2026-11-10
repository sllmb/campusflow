import { describe, expect, it } from "vitest";
import {
  FOCUS_PRESETS,
  breakMinutesAfter,
  focusedMs,
  pause,
  remainingMs,
  resume,
  start,
  stop,
  tick,
} from "./timer";

const MIN = 60_000;
const T0 = Date.UTC(2026, 10, 12, 8, 0); // 12 nov. 2026, 08:00 UTC

describe("préréglages", () => {
  it("Pomodoro 25 min, deep work 2 h et 4 h", () => {
    expect(FOCUS_PRESETS.map((p) => [p.id, p.mode, p.minutes])).toEqual([
      ["pomodoro", "pomodoro", 25],
      ["deep2", "deep_work", 120],
      ["deep4", "deep_work", 240],
    ]);
  });
  it("pause de 5 min après un Pomodoro, 15 min après le 4e", () => {
    expect(breakMinutesAfter(1)).toBe(5);
    expect(breakMinutesAfter(3)).toBe(5);
    expect(breakMinutesAfter(4)).toBe(15);
    expect(breakMinutesAfter(8)).toBe(15);
  });
});

describe("minuteur basé sur l'heure de fin", () => {
  it("décompte à partir de l'heure de fin, sans dériver", () => {
    const s = start({ mode: "pomodoro", minutes: 25, subjectId: null }, T0);
    expect(remainingMs(s, T0)).toBe(25 * MIN);
    // Même si l'onglet a dormi 10 minutes, le temps restant est juste.
    expect(remainingMs(s, T0 + 10 * MIN)).toBe(15 * MIN);
    expect(focusedMs(s, T0 + 10 * MIN)).toBe(10 * MIN);
  });

  it("la pause gèle le temps restant et n'est pas comptée comme concentration", () => {
    let s = start({ mode: "deep_work", minutes: 120, subjectId: "s1" }, T0);
    s = pause(s, T0 + 30 * MIN);
    expect(remainingMs(s, T0 + 50 * MIN)).toBe(90 * MIN); // 20 min de pause : rien ne bouge
    s = resume(s, T0 + 50 * MIN);
    expect(remainingMs(s, T0 + 60 * MIN)).toBe(80 * MIN);
    expect(focusedMs(s, T0 + 60 * MIN)).toBe(40 * MIN);
  });

  it("se termine à l'heure prévue, même découverte plus tard", () => {
    const s = start({ mode: "pomodoro", minutes: 25, subjectId: null }, T0);
    expect(tick(s, T0 + 24 * MIN).finished).toBeNull();
    const { finished } = tick(s, T0 + 40 * MIN); // l'onglet rouvert 15 min après la fin
    expect(finished).toEqual({
      mode: "pomodoro",
      plannedMinutes: 25,
      subjectId: null,
      startedAt: T0,
      endedAt: T0 + 25 * MIN, // et non T0 + 40 min
      focusedSeconds: 25 * 60,
      completed: true,
    });
  });

  it("enchaîne une pause après un Pomodoro terminé, pas après un deep work", () => {
    const pomo = tick(
      start({ mode: "pomodoro", minutes: 25, subjectId: null }, T0),
      T0 + 25 * MIN,
      1,
    );
    expect(pomo.state.phase).toBe("break");
    expect(remainingMs(pomo.state, T0 + 25 * MIN)).toBe(5 * MIN);
    const deep = tick(
      start({ mode: "deep_work", minutes: 120, subjectId: null }, T0),
      T0 + 120 * MIN,
    );
    expect(deep.state.status).toBe("idle");
  });

  it("la fin de la pause ne crée pas de session", () => {
    const afterFocus = tick(
      start({ mode: "pomodoro", minutes: 25, subjectId: null }, T0),
      T0 + 25 * MIN,
      1,
    );
    const afterBreak = tick(afterFocus.state, T0 + 30 * MIN);
    expect(afterBreak.finished).toBeNull();
    expect(afterBreak.state.status).toBe("idle");
  });

  it("arrêter avant la fin enregistre le temps fait, non terminé", () => {
    let s = start({ mode: "deep_work", minutes: 240, subjectId: "s1" }, T0);
    s = pause(s, T0 + 60 * MIN);
    s = resume(s, T0 + 70 * MIN);
    const result = stop(s, T0 + 100 * MIN);
    expect(result).toMatchObject({
      mode: "deep_work",
      plannedMinutes: 240,
      subjectId: "s1",
      focusedSeconds: 90 * 60,
      endedAt: T0 + 100 * MIN,
      completed: false,
    });
  });

  it("arrêter pendant une pause enregistre la fin au moment de la pause", () => {
    let s = start({ mode: "deep_work", minutes: 120, subjectId: null }, T0);
    s = pause(s, T0 + 30 * MIN);
    expect(stop(s, T0 + 45 * MIN)).toMatchObject({
      focusedSeconds: 30 * 60,
      endedAt: T0 + 45 * MIN,
    });
  });

  it("arrêter une pause de Pomodoro n'enregistre rien", () => {
    const { state } = tick(
      start({ mode: "pomodoro", minutes: 25, subjectId: null }, T0),
      T0 + 25 * MIN,
      1,
    );
    expect(stop(state, T0 + 27 * MIN)).toBeNull();
  });
});
