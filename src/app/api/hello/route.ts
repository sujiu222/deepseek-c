import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello from the Next.js API route!" });
}

export async function POST(request: Request) {
  const payload = await request.json();
  return NextResponse.json({ received: payload });
}
