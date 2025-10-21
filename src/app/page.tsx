"use client";

import { useState } from "react";

function App() {
  const [contentString, setContentString] = useState("Loading...");
  const [thinkingString, setThinkingString] = useState("");

  const fetchData = async (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    try {
      const source = new EventSource("/api/deepseek");
      source.onopen = () => {
        setContentString("");
        setThinkingString("");
      };
      source.onmessage = (event) => {
        if (event.data === "[DONE]") {
          source.close();
          return;
        }
        console.log("Received event data:", JSON.parse(event.data).content);
        const data = JSON.parse(event.data);
        if (data.type === "reasoning") {
          setThinkingString((p) => p + data.content);
        } else if (data.type === "content") {
          setContentString((p) => p + data.content);
        }
      };
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
