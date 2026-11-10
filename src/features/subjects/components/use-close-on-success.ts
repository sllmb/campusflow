"use client";

import { useEffect, useRef } from "react";
import type { FormState } from "@/lib/form-state";

/** Appelle `onDone` quand une Server Action renvoie un succès (pour refermer un formulaire). */
export function useCloseOnSuccess(state: FormState, onDone?: () => void) {
  const handled = useRef<FormState | null>(null);
  useEffect(() => {
    if (state.success && handled.current !== state) {
      handled.current = state;
      onDone?.();
    }
  }, [state, onDone]);
}
