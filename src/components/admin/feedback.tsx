"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedbackState, FeedbackTone } from "@/lib/admin-form";

export function useAdminStatus(autoHideMs = 5000) {
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    setFeedback(null);
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const show = useCallback(
    (tone: FeedbackTone, text: string) => {
      setFeedback({ tone, text });
      if (timer.current) clearTimeout(timer.current);
      if (autoHideMs > 0) {
        timer.current = setTimeout(() => setFeedback(null), autoHideMs);
      }
    },
    [autoHideMs]
  );

  const success = useCallback((text: string) => show("success", text), [show]);
  const error = useCallback((text: string) => show("error", text), [show]);
  const info = useCallback((text: string) => show("info", text), [show]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { feedback, setFeedback, show, success, error, info, clear };
}

export function AdminFeedback({
  feedback,
  onDismiss,
}: {
  feedback: FeedbackState;
  onDismiss?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedback && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [feedback]);

  if (!feedback) return null;

  const Icon =
    feedback.tone === "success" ? CheckCircle2 : feedback.tone === "error" ? XCircle : Info;

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn(
        "sticky top-16 z-20 flex items-start gap-3 rounded-md border px-3.5 py-3 text-sm shadow-sm",
        feedback.tone === "success" && "border-emerald-300 bg-emerald-50 text-emerald-900",
        feedback.tone === "error" && "border-red-300 bg-red-50 text-red-900",
        feedback.tone === "info" && "border-border bg-white text-foreground"
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          feedback.tone === "success" && "text-emerald-600",
          feedback.tone === "error" && "text-red-600",
          feedback.tone === "info" && "text-muted-foreground"
        )}
        strokeWidth={2}
      />
      <p className="flex-1 font-medium leading-snug">{feedback.text}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-0.5 opacity-60 transition hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600">{message}</p>;
}
