"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface GlareCardProps {
  children?: React.ReactNode;
  className?: string;
}

export function GlareCard({ children, className }: GlareCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border/20 overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:scale-[1.02]",
        className
      )}
    >
      {children}
    </div>
  );
}
