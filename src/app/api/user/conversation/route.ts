import { NextRequest, NextResponse } from "next/server";
import { USER_COOKIE } from "../route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const cookies = request.cookies;
  if (!cookies.has(USER_COOKIE)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = cookies.get(USER_COOKIE)?.value;

  const conversation = await prisma.conversation.findUnique({
    where: { id: userId },
  });
  return NextResponse.json({ conversation });
}
