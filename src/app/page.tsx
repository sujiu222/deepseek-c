"use client";

import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("加载中...");
  const [echo, setEcho] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/hello");
      if (!response.ok) {
        setMessage("请求失败");
        return;
      }
      const data: { message: string } = await response.json();
      setMessage(data.message);
    };

    load().catch(() => setMessage("请求失败"));
  }, []);

  const sendEcho = async () => {
    const response = await fetch("/api/hello", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ timestamp: new Date().toISOString() }),
    });

    if (!response.ok) {
      setEcho("POST 请求失败");
      return;
    }

    const data: { received: unknown } = await response.json();
    setEcho(JSON.stringify(data.received));
  };

  return (
    <main
      style={{
        display: "grid",
        gap: "1rem",
        padding: "2rem",
        fontSize: "1.1rem",
      }}
    >
      <div>GET: {message}</div>
      <button type="button" onClick={sendEcho}>
        发送 POST 请求
      </button>
      {echo && <div>POST: {echo}</div>}
    </main>
  );
}

export default App;
