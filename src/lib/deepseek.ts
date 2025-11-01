// 封装token / 推理

export async function* fetchData(
  input: string,
  conversationId: string | null,
  modelId?: string
) {
  try {
    const response = await fetch("/api/deepseek", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input, conversationId, modelId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      yield {
        type: "error",
        content: errorData.error || "请求失败，请稍后重试",
      };
      return;
    }

    if (!response.body) {
      yield { type: "error", content: "服务器响应异常" };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const headers = response.headers;
    const returnedConversationId = headers.get("X-Conversation-Id");
    yield { type: "conversationId", conversationId: returnedConversationId };
    // NOTE 每次通过await将管理权还给浏览器
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const chunk = decoder.decode(value);
      const lines = chunk
        .split("\n\n")
        .filter((line) => line.startsWith("data: "));
      for (const line of lines) {
        const data = line.substring("data: ".length);
        if (data === "[DONE]") {
          return;
        }
        const parsed = JSON.parse(data);
        if (parsed.type === "reasoning") {
          yield { type: parsed.type, content: parsed.content };
        } else if (parsed.type === "content") {
          yield { type: parsed.type, content: parsed.content };
        } else if (parsed.type === "error") {
          yield { type: "error", content: parsed.content };
        }
      }
    }
  } catch (err) {
    console.error("Error fetching data", err);
    yield {
      type: "error",
      content: err instanceof Error ? err.message : "网络错误，请检查网络连接",
    };
  }
}
