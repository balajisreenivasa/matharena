// Accounts and sessions, local-first and dependency-free.
//   * Passwords: scrypt (Node crypto) with a per-user salt.
//   * Sessions: a signed cookie "ma_session" = <userId>.<expiresMs>.<hmac>. The HMAC uses
//     Web Crypto so the same verify() runs in Next.js middleware (edge) and in Node.
//   * Secret: AUTH_SECRET in .env, else a random one generated once into data/.auth-secret.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { SESSION_COOKIE, SESSION_DAYS } from "./session";
export { SESSION_COOKIE };

let cachedSecret: string | null = null;
export function authSecret(): string {
  if (cachedSecret) return cachedSecret;
  if (process.env.AUTH_SECRET) return (cachedSecret = process.env.AUTH_SECRET);
  const dir = join(process.cwd(), "data");
  const file = join(dir, ".auth-secret");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(file)) writeFileSync(file, randomBytes(32).toString("hex"));
  return (cachedSecret = readFileSync(file, "utf8").trim());
}

// ---- passwords -------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const test = scryptSync(password, salt, 64);
  const ref = Buffer.from(hash, "hex");
  return test.length === ref.length && timingSafeEqual(test, ref);
}

// ---- sessions (Web Crypto so middleware can verify) ------------------------

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSessionToken(userId: string, secret = authSecret()): Promise<{ token: string; expires: Date }> {
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const payload = `${userId}.${expires.getTime()}`;
  const token = `${payload}.${await hmac(secret, payload)}`;
  return { token, expires };
}

// Returns the userId or null. Pure; safe in edge middleware given the secret.
export async function verifySessionToken(token: string | undefined, secret: string): Promise<string | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expStr, sig] = parts;
  const exp = parseInt(expStr, 10);
  if (!userId || !Number.isFinite(exp) || exp < Date.now()) return null;
  const expected = await hmac(secret, `${userId}.${expStr}`);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0 ? userId : null;
}

export function normalizeEmail(e: string): string {
  return e.trim().toLowerCase();
}

export function passwordProblem(p: string): string | null {
  if (p.length < 6) return "Password needs at least 6 characters.";
  return null;
}
