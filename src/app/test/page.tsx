"use client";
import { useEffect, useState } from "react";

function TestPage() {
  const [content, setContent] = useState<string>("");

  const startStream = async () => {
    const source = new EventSource("/api/hello");
    source.onmessage = (event) => {
      if (event.data === "[DONE]") {
        source.close();
        return;
      }
      console.log("Received event data:", event.data);
      setContent((p) => p + event.data + "\n");
    };
  };
  useEffect(() => {
    startStream();
  }, []);
  return (
    <>
      <div>test</div>
      <div className="whitespace-pre-wrap">{content}</div>
    </>
  );
}
export default TestPage;
