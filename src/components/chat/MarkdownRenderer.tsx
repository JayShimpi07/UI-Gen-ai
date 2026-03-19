"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-invert leading-tight max-w-none prose-p:text-white/80 prose-headings:text-white/90 prose-strong:text-white/90 prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-li:text-white/75 prose-code:text-indigo-300", className)}>
      <ReactMarkdown
        components={{
          code: ({ children, className, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match;

            if (isInline) {
              return (
                <code
                  className="not-prose text-[13px] px-1.5 py-0.5 rounded-md bg-white/[0.08] text-indigo-300 font-mono border border-white/[0.06]"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={cn("", className)} {...props}>
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
