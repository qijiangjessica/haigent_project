"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface GlowingCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}

export function GlowingCard({ title, description, icon, className }: GlowingCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border bg-card p-6 shadow-md transition-all duration-300",
        "hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] hover:border-primary/40",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
