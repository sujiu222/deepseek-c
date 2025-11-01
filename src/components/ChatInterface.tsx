"use client";

import { useEffect, useRef, useState } from "react";
import { fetchData } from "@/lib/deepseek";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import { Button } from "@/components/ui/button";
import { Send, Brain } from "lucide-react";

type Props = { conversationId: string };

function ChatInterface({ conversationId }: Props) {
  const [contentString, setContentString] = useState("");
  const [thinkingString, setThinkingString] = useState("");
  const [inputString, setInputString] = useState("");
  const [textList, setTextList] = useState<
    { type: "user" | "ai"; content: string }[]
  >([]);
  const [pending, setPending] = useState(false);
  const [showThinking, setShowThinking] = useState(true);
  const [enableDeepThinking, setEnableDeepThinking] = useState(true);
  const actualConversationIdRef = useRef<string | null>(null);
  const textareaIsInBottom =
    thinkingString || contentString || textList.length !== 0 ? true : false;

  useEffect(() => {
    const loadHistory = async () => {
      if (!conversationId || conversationId === "new") {
        setTextList([]);
        actualConversationIdRef.current = null;
        return;
      }
      try {
        const res = await fetch(`/api/conversation/${conversationId}`, {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.messages) {
            const history = data.messages.map((msg: any) => ({
              type: msg.role === "user" ? "user" : "ai",
              content: msg.content,
            }));
            setTextList(history);
            actualConversationIdRef.current = conversationId;
          }
        }
      } catch (err) {
        console.error("加载历史对话失败", err);
      }
    };
    loadHistory();
  }, [conversationId]);

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
    const currentId =
      actualConversationIdRef.current ||
      (conversationId === "new" ? null : conversationId);

    // 如果关闭深度思考，自动隐藏思考过程
    if (!enableDeepThinking) {
      setShowThinking(false);
    }

    for await (const chunk of fetchData(
      message,
      currentId,
      enableDeepThinking
    )) {
      if (chunk.type === "reasoning") {
        if (enableDeepThinking) {
          setThinkingString((prev) => prev + chunk.content);
        }
      } else if (chunk.type === "content") {
        setContentString((prev) => prev + chunk.content);
      } else if (chunk.type === "conversationId" && chunk.conversationId) {
        if (
          !actualConversationIdRef.current &&
          (!conversationId || conversationId === "new")
        ) {
          actualConversationIdRef.current = chunk.conversationId;
          window.history.replaceState(
            null,
            "",
            `/chat/${chunk.conversationId}`
          );
        }
      }
    }

    // 发送完成后通知侧边栏刷新历史记录
    window.dispatchEvent(new Event("conversationUpdated"));
  };

  // Textarea 键盘行为：Enter 发送；Shift+Enter 换行
  const handleTextareaKeyDown = async (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setPending(true);
      await sendMessage();
      setPending(false);
    }
  };

  const handleSendClick = async () => {
    if (!inputString.trim() || pending) return;
    setPending(true);
    await sendMessage();
    setPending(false);
  };

  return (
    <div className="relative flex h-screen w-full flex-col min-h-screen ">
      <div className="flex-1 flex gap-4 mb-4 flex-col items-center text-left">
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
        <div className="w-2/3 relative">
          <Textarea
            value={inputString}
            onChange={(e) => setInputString(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            className="resize-none pr-24 pb-12 min-h-[120px] max-h-[120px] overflow-y-auto"
            placeholder="输入你的问题……"
            disabled={pending}
          />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <button
              onClick={() => setEnableDeepThinking(!enableDeepThinking)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                enableDeepThinking
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>深度思考</span>
              {enableDeepThinking && (
                <span className="text-xs bg-blue-200 px-1.5 py-0.5 rounded">
                  开启
                </span>
              )}
            </button>
            <Button
              onClick={handleSendClick}
              disabled={!inputString.trim() || pending}
              size="sm"
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              发送
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
