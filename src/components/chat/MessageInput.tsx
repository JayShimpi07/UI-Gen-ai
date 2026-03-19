"use client";

import { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

interface MessageInputProps {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function MessageInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: MessageInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-white/[0.04]">
      <div className="relative max-w-4xl mx-auto">
        <div className="glass rounded-xl focus-glow transition-all duration-300">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe the React component you want to create..."
            disabled={isLoading}
            className="w-full min-h-[80px] max-h-[200px] pl-4 pr-14 py-3.5 rounded-xl bg-transparent text-white/90 resize-none focus:outline-none transition-all placeholder:text-white/25 text-[14px] font-normal leading-relaxed"
            rows={3}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className={cn(
              "absolute right-3 bottom-3 p-2 rounded-lg transition-all duration-200",
              isLoading || !input.trim()
                ? "bg-white/[0.05] cursor-not-allowed"
                : "gradient-primary shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95"
            )}
          >
            <ArrowUp className={`h-4 w-4 ${isLoading || !input.trim() ? 'text-white/20' : 'text-white'}`} />
          </button>
        </div>
      </div>
    </form>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}