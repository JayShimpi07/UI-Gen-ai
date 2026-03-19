"use client";

import { Message } from "ai";
import { cn } from "@/lib/utils";
import { User, Bot, Loader2, Sparkles } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center py-16">
        {/* Animated gradient icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-xl opacity-40 animate-pulse-glow" />
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-2xl shadow-indigo-500/30">
            <Sparkles className="h-7 w-7 text-white animate-float" />
          </div>
        </div>
        <p className="text-white/90 font-semibold text-lg mb-2">Start building with AI</p>
        <p className="text-white/40 text-sm max-w-[280px] leading-relaxed">
          Describe the React component you want and I&apos;ll generate it instantly
        </p>
        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-sm">
          {["A login form", "A pricing card", "A dashboard chart"].map((s) => (
            <span key={s} className="px-3 py-1.5 rounded-full text-xs text-white/50 glass-light cursor-default hover:text-white/70 transition-colors">
              {s}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-6">
      <div className="space-y-5 max-w-4xl mx-auto w-full">
        {messages.map((message, msgIndex) => (
          <div
            key={message.id || message.content}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end animate-slide-in-right" : "justify-start animate-slide-in-left"
            )}
            style={{ animationDelay: `${Math.min(msgIndex * 0.05, 0.3)}s` }}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                  <Bot className="h-4 w-4 text-indigo-400" />
                </div>
              </div>
            )}
            
            <div className={cn(
              "flex flex-col gap-1.5 max-w-[85%]",
              message.role === "user" ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "rounded-2xl px-4 py-3",
                message.role === "user" 
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20" 
                  : "glass text-white/90 shadow-lg shadow-black/20"
              )}>
                <div className="text-sm leading-relaxed">
                  {message.parts ? (
                    <>
                      {message.parts.map((part, partIndex) => {
                        switch (part.type) {
                          case "text":
                            return message.role === "user" ? (
                              <span key={partIndex} className="whitespace-pre-wrap">{part.text}</span>
                            ) : (
                              <MarkdownRenderer
                                key={partIndex}
                                content={part.text}
                                className="prose-sm"
                              />
                            );
                          case "reasoning":
                            return (
                              <div key={partIndex} className="mt-3 p-3 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                                <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider block mb-1.5">Reasoning</span>
                                <span className="text-sm text-white/60 leading-relaxed">{part.reasoning}</span>
                              </div>
                            );
                          case "tool-invocation":
                            const tool = part.toolInvocation;
                            return (
                              <div key={partIndex} className="inline-flex items-center gap-2 mt-2 mr-2 mb-2 px-3 py-1.5 glass-light rounded-lg text-xs font-mono">
                                {tool.state === "result" && tool.result ? (
                                  <>
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></div>
                                    <span className="text-white/60">{tool.toolName}</span>
                                  </>
                                ) : (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                                    <span className="text-white/60">{tool.toolName}</span>
                                  </>
                                )}
                              </div>
                            );
                          case "source":
                            return (
                              <div key={partIndex} className="mt-2 text-xs text-white/30">
                                Source: {JSON.stringify(part.source)}
                              </div>
                            );
                          case "step-start":
                            return partIndex > 0 ? <hr key={partIndex} className="my-3 border-white/[0.06]" /> : null;
                          default:
                            return null;
                        }
                      })}
                      {isLoading &&
                        message.role === "assistant" &&
                        messages.indexOf(message) === messages.length - 1 && (
                          <div className="flex items-center gap-2 mt-3 text-white/40">
                            <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
                            <span className="text-sm">Generating...</span>
                          </div>
                        )}
                    </>
                  ) : message.content ? (
                    message.role === "user" ? (
                      <span className="whitespace-pre-wrap">{message.content}</span>
                    ) : (
                      <MarkdownRenderer content={message.content} className="prose-sm" />
                    )
                  ) : isLoading &&
                    message.role === "assistant" &&
                    messages.indexOf(message) === messages.length - 1 ? (
                    <div className="flex items-center gap-2 text-white/40">
                      <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
                      <span className="text-sm">Generating...</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            
            {message.role === "user" && (
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}