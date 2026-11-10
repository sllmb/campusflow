import { z } from "zod";

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Indique ton prénom.").max(50, "50 caractères maximum."),
});
