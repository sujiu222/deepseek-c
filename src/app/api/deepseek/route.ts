/**
 * DeepSeek 流式对话 API（带会话记忆）
 *
 * 功能概览：
 * - 使用 Cookie 分配/识别 sessionId，在服务端维护会话级内存（进程内 Map）
 * - 将历史对话拼接到 Prompt，并在历史过长时进行“摘要压缩”，降低 token 压力
 * - 以 SSE 方式流式返回推理内容（reasoning）与回答内容（content）
 * - 当本轮流式结束后，再把本轮对话写入记忆，并按需触发总结与裁剪
 *
 * 说明：
 * - 记忆默认仅存储于当前 Node 进程内（内存级），重启/多实例不会共享。若需要持久化/横向扩展,请改为数据库或 KV 存储。
 */
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { prisma } from "@/lib/prisma";

// 定义一个泛型：为任何类型 T 附加 reasoning_content 属性（DeepSeek Reasoner 额外字段）
type WithReasoning<T> = T & { reasoning_content?: string | null };

// 将泛型应用于 OpenAI 的 Delta 类型，生成我们使用的 DeepSeekDelta 类型
type DeepSeekDelta = WithReasoning<ChatCompletionChunk.Choice.Delta>;

// 会话记忆结构：记录每轮对话的用户与助手消息，便于后续回溯
// 会话记忆结构：单条消息
// - role：消息角色
// - content：可见回答/用户输入
// - reasoning：模型推理过程（如需，可用于质量分析，不建议下游直接显示）
type MemoryMessage = {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
};

// 会话容器：包含若干消息与可选的“摘要”
// - summary：当历史较长时，对既往对话进行压缩总结，减少 token 消耗
type MemorySession = {
  messages: MemoryMessage[];
  summary?: string;
};

const globalForMemory = globalThis as unknown as {
  deepseekMemoryStore?: Map<string, MemorySession>;
};

// 基于全局 Map 在进程内维持记忆；若热重载会复用已有实例
// 基于全局 Map 在进程内维持记忆；若热重载会复用已有实例
const memoryStore =
  globalForMemory.deepseekMemoryStore ?? new Map<string, MemorySession>();

if (!globalForMemory.deepseekMemoryStore) {
  globalForMemory.deepseekMemoryStore = memoryStore;
}

// 记忆相关配置：基于 Cookie 暂存对话上下文并定期总结
// - MAX_HISTORY_MESSAGES：参与构建 Prompt 的最近消息条数（过多会影响开销）
// - SUMMARY_TRIGGER_MESSAGE_COUNT：达到此消息条数后尝试运行一次摘要
// - RECENT_MESSAGES_AFTER_SUMMARY：生成摘要后仅保留最近 N 条“原始消息”，其余靠 summary 复现上下文
const MAX_HISTORY_MESSAGES = 20;
const SUMMARY_TRIGGER_MESSAGE_COUNT = 24;
const RECENT_MESSAGES_AFTER_SUMMARY = 10;

const baseURL = process.env.DEEPSEEK_RPC_URL ?? "https://api.deepseek.com";
// const defaultApiKey = process.env.DEEPSEEK_API_KEY;

// // 未配置密钥时给出提示（请求将失败）
// if (!defaultApiKey) {
//   console.warn(
//     "Missing DEEPSEEK_API_KEY env var; Users must provide their own API keys."
//   );
// }

// 创建 OpenAI 客户端实例（支持自定义 API Key）
function createOpenAIClient(apiKey: string) {
  return new OpenAI({
    baseURL,
    apiKey: apiKey,
  });
}

// 获取或创建一个会话内存容器
function getOrCreateSession(sessionId: string) {
  let session = memoryStore.get(sessionId);
  if (!session) {
    session = { messages: [] };
    memoryStore.set(sessionId, session);
  }
  return session;
}

// 将会话记忆 + 用户新输入 组装为模型可用的 messages 列表
function buildPromptMessages(
  session: MemorySession,
  userInput: string
): ChatCompletionMessageParam[] {
  const messages: ChatCompletionMessageParam[] = [];

  // 优先注入总结作为压缩后的“系统提示”，避免完整历史重复带入
  if (session.summary) {
    messages.push({
      role: "system",
      content: `Conversation memory:
${session.summary}

Use the summary plus the recent messages to respond.`,
    });
  }

  // 带上近期的若干条原始消息，保证对话连续性
  const recentMessages = session.messages.slice(-MAX_HISTORY_MESSAGES);
  for (const message of recentMessages) {
    messages.push({ role: message.role, content: message.content });
  }

  // 追加本轮用户输入
  messages.push({ role: "user", content: userInput });
  return messages;
}

// 适度裁剪内存，避免无限增长
function trimSession(session: MemorySession) {
  if (session.messages.length > MAX_HISTORY_MESSAGES * 2) {
    session.messages = session.messages.slice(-MAX_HISTORY_MESSAGES * 2);
  }
}

// 达到阈值后触发一次会话总结：
// - 用总结替代更远的原始消息，减少后续 prompt 体积
// - 保留最近若干条原始消息，让模型能"贴地"对话
async function maybeSummarizeSession(
  session: MemorySession,
  userApiKey: string
) {
  if (session.messages.length <= SUMMARY_TRIGGER_MESSAGE_COUNT) {
    return;
  }

  const conversationForSummary = session.messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  try {
    const openai = createOpenAIClient(userApiKey);
    const summaryCompletion = await openai.chat.completions.create({
      model: "deepseek-reasoner",
      stream: false,
      messages: [
        {
          role: "system",
          content:
            "You are summarizing a conversation so a future assistant can recall user preferences, facts, and pending questions.",
        },
        {
          role: "user",
          content: `Please summarize the key details and open threads from the conversation below so it can be recalled later. Keep it brief but comprehensive.\n\n${conversationForSummary}`,
        },
      ],
      max_tokens: 256,
    });

    // 记录新摘要，并在内存中仅保留最近 N 条消息
    const summary = summaryCompletion.choices[0]?.message?.content?.trim();
    if (summary) {
      session.summary = summary;
      session.messages = session.messages.slice(-RECENT_MESSAGES_AFTER_SUMMARY);
    }
  } catch (error) {
    console.error("Failed to summarize conversation", error);
  }
}

// 与模型进行一次流式对话：
// - 返回可读流（SSE）用于边写边读到客户端
// - 同时返回 finalContent Promise，供流结束后写入记忆
async function main(
  messages: ChatCompletionMessageParam[],
  modelId: string,
  userApiKey: string
) {
  const openai = createOpenAIClient(userApiKey);
  const completion = await openai.chat.completions.create({
    model: modelId,
    messages,
    stream: true,
  });
  //   console.log("DeepSeek response:", completion);

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  // 聚合整段 content 与 reasoning，便于在流结束后一次性写入会话记忆
  let accumulatedContent = "";
  let accumulatedReasoning = "";
  // NOTE 需要并行了使用Promise会更好一点，使用await的话就要用async IIFE包裹进行异步操作
  const finalContent = new Promise<{ content: string; reasoning: string }>(
    (resolve, reject) => {
      (async () => {
        try {
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta as DeepSeekDelta | undefined;
            const part = delta?.content;
            const reasoning_content = delta?.reasoning_content;
            const res = {
              type: "",
              content: "",
            };
            if (part) {
              accumulatedContent += part;
              res.type = "content";
              res.content = part;
              await writer.write(
                encoder.encode(`data: ${JSON.stringify(res)}\n\n`)
              );
            } else if (reasoning_content) {
              accumulatedReasoning += reasoning_content;
              res.type = "reasoning";
              res.content = reasoning_content;
              await writer.write(
                encoder.encode(`data: ${JSON.stringify(res)}\n\n`)
              );
            }
          }
          await writer.write(encoder.encode("data: [DONE]\n\n"));
          resolve({
            content: accumulatedContent,
            reasoning: accumulatedReasoning,
          });
        } catch (error) {
          // 在 SSE 中告知错误，同时保证写端关闭
          const errorPayload = {
            type: "error",
            content: "Stream interrupted unexpectedly.",
          };
          try {
            await writer.write(
              encoder.encode(`data: ${JSON.stringify(errorPayload)}\n\n`)
            );
          } catch {
            // ignore secondary stream failures
          }
          reject(error);
        } finally {
          await writer.close();
        }
      })();
    }
  );

  return { readable, finalContent };
}

type deepseekRequestBody = {
  input: string;
  reset?: boolean;
  conversationId?: string;
  modelId?: string;
};

/**
 *
 * @param req:{body:{input:string,reset?:boolean,modelId?:string}}
 * @returns
 */
export async function POST(req: NextRequest) {
  // 入口：接收用户输入，基于历史记忆构建 Prompt，流式返回，同时更新会话记忆
  try {
    const body: deepseekRequestBody = await req.json();
    const input =
      typeof body?.input === "string" ? body.input.trim() : undefined;

    const userId = (() => {
      const userId = req.cookies.get("user-id")?.value;
      return JSON.parse(userId ?? "null") as string | null;
    })();
    const modelId = body.modelId ?? "deepseek-r1"; // 默认使用 deepseek-r1

    if (!input) {
      // 参数校验：必须提供 input
      return NextResponse.json(
        { error: "Missing input" },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 获取用户的 API Key（如果已设置）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { apiKey: true },
    });
    const userApiKey = user?.apiKey;

    if (!userApiKey) {
      return NextResponse.json(
        { error: "User API Key not set" },
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 记录用户选择的模型（仅用于日志）
    console.log(
      `User ${userId} selected model: ${modelId}, using ${
        userApiKey ? "user" : "default"
      } API key`
    );

    let conversationId: string = body.conversationId ?? "";
    let isNewConversation = false;

    if (!conversationId) {
      ({ id: conversationId } = await prisma.conversation.create({
        data: {
          userId,
        },
      }));
      isNewConversation = true;
    }

    // 1) 使用 conversationId 作为 sessionId，确保每个对话有独立的记忆
    const session = getOrCreateSession(conversationId);

    // 2) 新对话或外部请求重置时，清空记忆
    if (isNewConversation || body?.reset === true) {
      session.messages = [];
      session.summary = undefined;
    }

    // 3) 构建本轮 Prompt 消息
    const messages = buildPromptMessages(session, input);

    // 4) 与 AI 模型进行流式对话（使用用户选择的模型和API Key）
    const { readable, finalContent } = await main(
      messages,
      modelId,
      userApiKey
    );

    // 5) 返回 SSE 响应给客户端
    const response = new NextResponse(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "X-Conversation-Id": conversationId,
      },
    });

    // 6) 流结束后异步写入会话记忆，并按需总结、裁剪
    finalContent
      .then(async ({ content, reasoning }) => {
        session.messages.push({ role: "user", content: input });
        const assistantMessage: MemoryMessage = {
          role: "assistant",
          content,
        };
        if (reasoning.trim()) {
          assistantMessage.reasoning = reasoning;
        }
        session.messages.push(assistantMessage);

        await maybeSummarizeSession(session, userApiKey);
        trimSession(session);

        // 同步更新数据库中的会话记录,添加user和assistant两条消息

        await prisma.$transaction(async (tx) => {
          const updated = await tx.conversation.update({
            where: { id: conversationId },
            data: {
              updatedAt: new Date(),
              messageCount: { increment: 2 },
            },
          });

          // seq 从 0 开始计数，messageCount 是消息总数
          // 更新后 messageCount = 2，则 userSeq = 0, assistantSeq = 1
          const userSeq = updated.messageCount - 2;
          const assistantSeq = updated.messageCount - 1;

          await tx.message.create({
            data: {
              conversationId,
              role: "user",
              content: input,
              seq: userSeq,
            },
          });

          await tx.message.create({
            data: {
              conversationId,
              role: "assistant",
              content,
              reasoning: reasoning.trim() ? reasoning : undefined,
              seq: assistantSeq,
            },
          });
        });
      })
      .catch((error) => {
        console.error("Failed to finalize DeepSeek response", error);
      });
    // 7.返回response
    return response;
  } catch (error) {
    console.error("DeepSeek request failed", error);
    return NextResponse.json(
      { message: "Failed to contact DeepSeek", error },
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
