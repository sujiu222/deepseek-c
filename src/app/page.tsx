"use client";

import { useState } from "react";

function App() {
  const [contentString, setContentString] = useState("Loading...");
  const [thinkingString, setThinkingString] = useState("");

  const fetchData = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const input = e.currentTarget.value;
    try {
      const response = await fetch("/api/deepseek", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      setContentString("");
      setThinkingString("");

      const processStream = async () => {
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
              setThinkingString((p) => p + parsed.content);
            } else if (parsed.type === "content") {
              setContentString((p) => p + parsed.content);
            }
          }
        }
      };
      processStream();
    } catch (err) {
      console.error("Error fetching data", err);
      setContentString("Error fetching data");
    }
  };

  return (
    <>
      <div>
        <input
          type="text"
          onKeyDown={fetchData}
          className="border-2 border-gray-300 p-2 rounded"
        />
      </div>
      <div>{thinkingString}</div>
      <div>{contentString}</div>
    </>
  );
}

export default App;
