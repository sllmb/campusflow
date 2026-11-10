"use client";

import dynamic from "next/dynamic";

/** L'invite d'installation dépend du navigateur : rendue côté client uniquement. */
export const InstallHintLoader = dynamic(
  () => import("./install-hint").then((module) => module.InstallHint),
  { ssr: false },
);
