// ============================================================
// AVARIA ACADEMY — AUTHENTICATION ENGINE
// JWT + bcrypt based auth with cookie sessions
// ============================================================

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

// ── Constants ──────────────────────────────────────────────
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? (() => { throw new Error("JWT_SECRET environment variable is required"); })()
);
const COOKIE_NAME = "avaria-session";
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "instructor" | "viewer";
  avatar: string | null;
}

interface SessionPayload extends JWTPayload {
  user: SessionUser;
}

// ── Password Utilities ─────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

// ── JWT Utilities ──────────────────────────────────────────

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

// ── Session Management ─────────────────────────────────────

export async function createSession(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  return payload?.user ?? null;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ── Auth Helpers ───────────────────────────────────────────

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new AuthError("Unauthorized", 401);
  return user;
}

export async function requireRole(...roles: string[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) throw new AuthError("Forbidden", 403);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "AuthError";
  }
}

// ── Seed Admin Account ─────────────────────────────────────

export async function ensureAdminExists(): Promise<boolean> {
  const adminCount = await db.user.count({ where: { role: "admin" } });
  return adminCount > 0;
}

export async function createAdmin(email: string, name: string, password: string): Promise<SessionUser> {
  const passwordHashed = await hashPassword(password);
  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash: passwordHashed,
      role: "admin",
    },
  });
  return { id: user.id, email: user.email, name: user.name, role: "admin", avatar: user.avatar };
}
