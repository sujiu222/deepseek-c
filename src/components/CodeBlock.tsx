"use client";

import { useState, useEffect, useRef, memo } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./ui/button";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

interface CodeBlockProps {
  children: string;
  className?: string;
  language?: string;
}

const CodeBlockComponent = ({
  children,
  className,
  language: propLanguage,
}: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isStreamingRef = useRef(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 提取语言类型：优先使用传入的 language，否则从 className 提取
  const language =
    propLanguage || className?.replace("language-", "") || "plaintext";

  useEffect(() => {
    if (!codeRef.current || language === "plaintext") return;

    // 清除之前的定时器
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }

    // 标记正在流式输入
    isStreamingRef.current = true;

    // 设置防抖：内容停止更新 500ms 后才进行高亮
    highlightTimerRef.current = setTimeout(() => {
      if (codeRef.current) {
        // 使用 highlightAuto 来避免语言检测问题
        const result = hljs.highlight(children, { 
          language: language,
          ignoreIllegals: true 
        });
        codeRef.current.innerHTML = result.value;
        isStreamingRef.current = false;
      }
    }, 500);

    // 清理函数
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, [children, language]);

  return (
    <div className="relative group my-4">
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs bg-white/90 backdrop-blur-sm hover:bg-white"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              已复制
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" />
              复制
            </>
          )}
        </Button>
      </div>
      <div className="bg-[#0d1117] rounded-md overflow-hidden border border-[#30363d]">
        <div className="px-4 py-2 text-xs text-[#7d8590] bg-[#161b22] border-b border-[#30363d] font-mono">
          {language}
        </div>
        <pre className="p-4 overflow-x-auto text-sm !bg-[#0d1117] !m-0">
          <code
            ref={codeRef}
            className={`hljs language-${language}`}
            style={{ display: 'block' }}
          >
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
};

// 使用 memo 优化，只在 children 或 language 改变时重新渲染
export const CodeBlock = memo(CodeBlockComponent);
