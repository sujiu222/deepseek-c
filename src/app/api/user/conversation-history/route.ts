import { NextRequest, NextResponse } from "next/server";
import { USER_COOKIE } from "../route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const cookies = request.cookies;
  if (!cookies.has(USER_COOKIE)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = JSON.parse(cookies.get(USER_COOKIE)?.value as string);

  const conversation = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });
  return NextResponse.json({ conversation });
}
