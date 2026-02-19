"use client";

import { AlertCircle } from "lucide-react";

interface ErrorPageProps {
  title?: string;
  description?: string;
}

export function ErrorScreen({
  title = "Something went wrong",
  description = "We encountered an error while processing your request. Please try again later.",
}: ErrorPageProps) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-6 text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="flex max-w-md flex-col items-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 ring-1 ring-border">
          <AlertCircle
            className="h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed sm:text-base">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
