/**
 * API Key 管理端点
 */
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 获取用户是否已设置 API Key
export async function GET(req: NextRequest) {
  try {
    const userId = (() => {
      const userIdCookie = req.cookies.get("user-id")?.value;
      return JSON.parse(userIdCookie ?? "null") as string | null;
    })();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { apiKey: true },
    });

    return NextResponse.json({
      hasApiKey: !!user?.apiKey,
    });
  } catch (error) {
    console.error("Failed to get API key status", error);
    return NextResponse.json(
      { error: "Failed to get API key status" },
      { status: 500 }
    );
  }
}

// 保存/更新 API Key
export async function POST(req: NextRequest) {
  try {
    const userId = (() => {
      const userIdCookie = req.cookies.get("user-id")?.value;
      return JSON.parse(userIdCookie ?? "null") as string | null;
    })();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const apiKey = body.apiKey?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key is required" },
        { status: 400 }
      );
    }

    // 验证 API Key 格式（DeepSeek API Key 通常以 sk- 开头）
    if (!apiKey.startsWith("sk-")) {
      return NextResponse.json(
        { error: "Invalid API Key format" },
        { status: 400 }
      );
    }

    // 更新用户的 API Key
    await prisma.user.update({
      where: { id: userId },
      data: { apiKey },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save API key", error);
    return NextResponse.json(
      { error: "Failed to save API key" },
      { status: 500 }
    );
  }
}

// 删除 API Key
export async function DELETE(req: NextRequest) {
  try {
    const userId = (() => {
      const userIdCookie = req.cookies.get("user-id")?.value;
      return JSON.parse(userIdCookie ?? "null") as string | null;
    })();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { apiKey: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete API key", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}
