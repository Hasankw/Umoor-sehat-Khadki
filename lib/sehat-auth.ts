import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SECRET = process.env.SEHAT_SECRET ?? "sehat-khadki-1448-default";
const COOKIE = "sehat_session";
const TOKEN_VALUE = "authenticated";
const enc = new TextEncoder();

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signToken(): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(TOKEN_VALUE));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${TOKEN_VALUE}.${hex}`;
}

export async function verifyToken(token: string): Promise<boolean> {
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const value = token.slice(0, dot);
  const hex   = token.slice(dot + 1);
  if (value !== TOKEN_VALUE || !hex) return false;
  try {
    const key = await getKey();
    const sigBytes = new Uint8Array(
      (hex.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16))
    );
    return await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(TOKEN_VALUE));
  } catch {
    return false;
  }
}

/** Server component: check cookie via next/headers */
export async function isSehatAuthed(): Promise<boolean> {
  const jar = await cookies();
  const val = jar.get(COOKIE)?.value;
  if (!val) return false;
  return verifyToken(val);
}

/** Middleware / API route: check cookie from NextRequest */
export async function isSehatAuthedReq(req: NextRequest): Promise<boolean> {
  const val = req.cookies.get(COOKIE)?.value;
  if (!val) return false;
  return verifyToken(val);
}

export { COOKIE };
