"use client";

import dynamic from "next/dynamic";

/** La carte lit les capacités du navigateur : elle n'est rendue que côté client. */
export const RemindersCardLoader = dynamic(
  () => import("./reminders-card").then((module) => module.RemindersCard),
  { ssr: false, loading: () => <div className="h-44 animate-pulse rounded-card bg-muted" /> },
);
