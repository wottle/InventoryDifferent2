"use client";

import React from "react";

interface LoadingPanelProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function LoadingPanel({ title, subtitle, className }: LoadingPanelProps) {
  return (
    <div className={className ?? ""}>
      <div className="mx-auto max-w-md">
        <div className="card-retro border border-[var(--border)] bg-[var(--card)] rounded p-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="logo-spinner" aria-hidden="true" />
            <div className="text-sm font-medium text-[var(--foreground)]">{title}</div>
            {subtitle ? (
              <div className="text-xs text-[var(--muted-foreground)]">{subtitle}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
