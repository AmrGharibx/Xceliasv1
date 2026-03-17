import { NextRequest, NextResponse } from "next/server";
import { ensureAdminExists, createAdmin, createSession, type SessionUser } from "@/lib/auth";
import { registerSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

/**
 * First-time setup: Create the initial admin account.
 * Only works when no admin exists.
 */
export async function POST(request: NextRequest) {
  try {
    const hasAdmin = await ensureAdminExists();
    if (hasAdmin) {
      return NextResponse.json(
        { error: "Setup already completed. An admin account exists." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = parseBody(registerSchema, body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { email, name, password } = parsed.data;
    const user = await createAdmin(email, name, password);

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: "admin",
      avatar: user.avatar,
    };

    await createSession(sessionUser);

    return NextResponse.json({ user: sessionUser }, { status: 201 });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}

/** Check if setup is needed */
export async function GET() {
  try {
    const hasAdmin = await ensureAdminExists();
    return NextResponse.json({ setupRequired: !hasAdmin });
  } catch {
    return NextResponse.json({ setupRequired: true });
  }
}
