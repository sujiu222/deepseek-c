// 封装token / 推理

export async function* fetchData(input: string, conversationId: string | null) {
  try {
    const response = await fetch("/api/deepseek", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input, conversationId }),
    });

    if (!response.body) {
      throw new Error("No response body");
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
        }
      }
    }
  } catch (err) {
    console.error("Error fetching data", err);
    // setContentString("Error fetching data");
  }
}
