"use client";

import dynamic from "next/dynamic";

/** La carte lit le stockage du navigateur (« Plus tard ») : rendue côté client seulement. */
export const PendingFormsLoader = dynamic(
  () => import("./pending-forms-card").then((module) => module.PendingFormsCard),
  { ssr: false },
);
