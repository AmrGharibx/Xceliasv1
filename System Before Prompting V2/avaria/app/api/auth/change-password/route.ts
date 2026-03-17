import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, verifyPassword, hashPassword } from "@/lib/auth";
import { changePasswordSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireAuth();
    const body = await request.json();
    const parsed = parseBody(changePasswordSchema, body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await db.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const newHash = await hashPassword(newPassword);
    await db.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const authErr = error as { message: string; status: number };
      return NextResponse.json({ error: authErr.message }, { status: authErr.status });
    }
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
