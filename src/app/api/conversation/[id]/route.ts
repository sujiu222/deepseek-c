import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const userId = (() => {
    const userId = req.cookies.get("user-id")?.value;
    return JSON.parse(userId ?? "null") as string | null;
  })();

  if (!userId) {
    return NextResponse.json(
      {
        error: "未登录",
      },
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const conversationId = id;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId: userId,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json(
      {
        error: "会话不存在或无权访问",
      },
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return NextResponse.json(conversation);
}
