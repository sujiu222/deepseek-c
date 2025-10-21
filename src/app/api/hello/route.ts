import { NextResponse } from "next/server";

export async function GET() {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  let counter = 0;
  const timer = setInterval(() => {
    if (counter++ == 3) {
      writer.write(encoder.encode("data: [DONE]\n\n"));
      writer.close();
      clearInterval(timer);
      return;
    }
    writer.write(encoder.encode(`data: Message part ${counter}\n\n`));
  }, 1000);

  return new NextResponse(readable, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
