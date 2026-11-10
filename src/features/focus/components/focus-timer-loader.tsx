"use client";

import dynamic from "next/dynamic";

/** Le minuteur lit le stockage du navigateur : il n'est rendu que côté client. */
export const FocusTimerLoader = dynamic(
  () => import("./focus-timer").then((module) => module.FocusTimer),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="h-[28rem] animate-pulse rounded-card bg-green/40" />
        <div className="h-72 animate-pulse rounded-card bg-muted" />
      </div>
    ),
  },
);
