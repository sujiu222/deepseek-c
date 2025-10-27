"use client";

import { useState } from "react";
import { fetchData } from "@/lib/deepseek";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownMessage } from "@/components/MarkdownMessage";

function App() {
  const [contentString, setContentString] = useState("");
  const [thinkingString, setThinkingString] = useState("");
  const [inputString, setInputString] = useState("");
  const [textList, setTextList] = useState<
    { type: "user" | "ai"; content: string }[]
  >([]);
  const [pending, setPending] = useState(false);
  const [showThinking, setShowThinking] = useState(true);
  const textareaIsInBottom =
    thinkingString || contentString || textList.length !== 0 ? true : false;

  // 发送逻辑：从当前输入框内容发送,并按流式更新
  const sendMessage = async () => {
    const message = inputString;
    if (!message.trim()) return; // 空消息不发送
    const fullContent = contentString;
    if (fullContent) {
      setTextList((prev) => [...prev, { type: "ai", content: fullContent }]); // 使用函数式更新和完整内容
    }
    setInputString("");
    setContentString("");
    setThinkingString("");
    setTextList((prev) => [...prev, { type: "user", content: message }]);

    for await (const chunk of fetchData(message)) {
      if (chunk.type === "reasoning") {
        setThinkingString((prev) => prev + chunk.content);
      } else if (chunk.type === "content") {
        // setPending(false); // 一旦收到内容就关闭加载状态
        setContentString((prev) => prev + chunk.content);
      }
    }
  };

  // Textarea 键盘行为：Enter 发送；Shift+Enter 换行
  const handleTextareaKeyDown = async (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setPending(true);
      await sendMessage();
    }
  };
  const item = new Array(100).fill(0).map((_, i) => `Item ${i + 1}`);

  return (
    <div className="relative flex h-screen w-full flex-col min-h-screen ">
      <div className="flex-1 flex gap-4 flex-col items-center text-left">
        {textList.map((textObj, idx) => {
          if (textObj.type === "user") {
            return (
              <div key={idx} className="w-2/3 ">
                <div className="w-fit bg-blue-50 ml-auto p-3 rounded-lg">
                  {textObj.content}
                </div>
              </div>
            );
          } else if (textObj.type === "ai") {
            return (
              <div key={idx} className="w-2/3 ">
                <div className="w-full  p-4 rounded-lg">
                  <MarkdownMessage content={textObj.content} />
                </div>
              </div>
            );
          }
        })}
        {pending && (
          <div className="w-2/3 mt-4 flex flex-col justify-center gap-2 text-sm text-gray-500">
            <div
              className="whitespace-nowrap hover:text-black active:text-gray-700"
              onClick={() => setShowThinking(!showThinking)}
            >
              思考
              <div className="ml-4 inline-flex gap-1">
                <Skeleton className="w-2 h-2 rounded-full " />
                <Skeleton className="w-2 h-2 rounded-full  [animation-delay:0.2s]" />
                <Skeleton className="w-2 h-2 rounded-full  [animation-delay:0.4s]" />
              </div>
            </div>
            {showThinking && (
              <div className="w-full whitespace-pre-wrap leading-4 break-words">
                {thinkingString}
              </div>
            )}
          </div>
        )}
        {contentString && (
          <div className="w-2/3  p-4 rounded-lg">
            <MarkdownMessage content={contentString} />
          </div>
        )}
      </div>
      <div
        className={
          (textareaIsInBottom
            ? "sticky bottom-0 pb-4 bg-white  "
            : "absolute left-0 right-0 bottom-0 top-0 ") +
          "flex items-center justify-center"
        }
      >
        <Textarea
          value={inputString}
          onChange={(e) => setInputString(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          className="w-2/3 h-30 resize-none"
          placeholder="输入你的问题……"
        />
      </div>
    </div>
  );
}

export default App;
