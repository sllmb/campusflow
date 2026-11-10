import { createHmac } from "node:crypto";

/** Décode une clé en base32 (RFC 4648), comme celles des applications d'authentification. */
function base32Decode(input: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = input.replace(/[\s=]/g, "").toUpperCase();
  let bits = "";
  for (const char of clean) {
    const value = alphabet.indexOf(char);
    if (value < 0) throw new Error(`Caractère base32 invalide : ${char}`);
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

/** Code TOTP à 6 chiffres (RFC 6238, SHA-1, 30 s) pour l'instant donné. */
export function totp(secret: string, now = Date.now()) {
  const counter = Math.floor(now / 1000 / 30);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", base32Decode(secret)).update(message).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 1_000_000).padStart(6, "0");
}

/** Attend le prochain code (Supabase refuse de réutiliser un code déjà accepté). */
export async function nextTotp(secret: string, previous: string) {
  for (;;) {
    const code = totp(secret);
    if (code !== previous) return code;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
