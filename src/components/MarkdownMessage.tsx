"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";
import "github-markdown-css/github-markdown.css";
import { ClassAttributes, HTMLAttributes } from "react";

interface MarkdownMessageProps {
  content: string;
}

type CodeComponentProps = ClassAttributes<HTMLElement> &
  HTMLAttributes<HTMLElement> & {
    inline?: boolean;
  };

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="markdown-body bg-transparent">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }: CodeComponentProps) {
            const match = /language-(\w+)/.exec(className || "");
            const inline = !match;
            const codeString = String(children).replace(/\n$/, "");

            return !inline && match ? (
              <CodeBlock className={className} language={match[1]}>
                {codeString}
              </CodeBlock>
            ) : (
              <code
                className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
