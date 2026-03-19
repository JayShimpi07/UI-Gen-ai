"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignInFormProps {
  onSuccess?: () => void;
}

export function SignInForm({ onSuccess }: SignInFormProps) {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signIn(email, password);

    if (result.success) {
      // The redirect is handled by the hook
      onSuccess?.();
    } else {
      setError(result.error || "Failed to sign in");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white/60 text-sm">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className="bg-white/[0.04] border-white/[0.08] text-white/90 placeholder:text-white/20 focus:border-indigo-500/40 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-white/60 text-sm">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          className="bg-white/[0.04] border-white/[0.08] text-white/90 placeholder:text-white/20 focus:border-indigo-500/40 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full gradient-primary text-white border-0 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all" 
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}