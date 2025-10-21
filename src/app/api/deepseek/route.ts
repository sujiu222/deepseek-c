import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";

// 定义一个泛型，为任何类型 T 附加 reasoning_content 属性
type WithReasoning<T> = T & { reasoning_content?: string | null };

// 将泛型应用于 OpenAI 的 Delta 类型，生成我们自己的 DeepSeekDelta 类型
type DeepSeekDelta = WithReasoning<ChatCompletionChunk.Choice.Delta>;

const baseURL = process.env.DEEPSEEK_RPC_URL ?? "https://api.deepseek.com";
const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
  console.warn(
    "Missing DEEPSEEK_API_KEY env var; DeepSeek requests will fail."
  );
}

const openai = new OpenAI({
  baseURL,
  apiKey,
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: "deepseek-reasoner",
    messages: [{ role: "user", content: "9.11 and 9.8, which is greater?" }],
    stream: true,
  });
  //   console.log("DeepSeek response:", completion);

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  (async () => {
    for await (const chunk of completion) {
      //   console.log("DeepSeek chunk:", chunk.choices[0]?.delta);
      const delta = chunk.choices[0]?.delta as DeepSeekDelta | undefined;
      const part = delta?.content;
      const reasoning_content = delta?.reasoning_content;
      const res = {
        type: "",
        content: "",
      };
      if (part) {
        res.type = "content";
        res.content = part;
      } else if (reasoning_content) {
        res.type = "reasoning";
        res.content = reasoning_content;
      }
      writer.write(encoder.encode(`data: ${JSON.stringify(res)}\n\n`));
    }
    writer.write(encoder.encode("data: [DONE]\n\n"));
    writer.close();
  })();

  return readable;
}

export async function GET() {
  try {
    const readable = await main();
    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("DeepSeek request failed", error);
    return NextResponse.json(
      { error: "Failed to contact DeepSeek" },
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
