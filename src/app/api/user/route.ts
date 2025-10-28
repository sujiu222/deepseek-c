import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"], // 开发阶段可看 SQL
});

export const USER_COOKIE = "deepseek_user";

export async function POST(request: NextRequest) {
  const { username, password, isSignup } = await request.json();
  let user = null;
  if (isSignup) {
    user = await signUp(username, password);
  } else {
    user = await login(username, password);
  }
  if (user && "error" in user) {
    return new NextResponse(JSON.stringify(user), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const res = new NextResponse(JSON.stringify(user), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

  const id = user?.id;

  res.cookies.set({
    name: USER_COOKIE,
    value: JSON.stringify(id),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}

async function signUp(username: string, password: string) {
  try {
    return await prisma.user.create({
      data: { username, password },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return { error: "User already exists" };
    }
  }
}

async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return { error: "Invalid username!" };
  }
  if (user.password !== password) {
    return { error: "Invalid password!" };
  }
  return user;
}
