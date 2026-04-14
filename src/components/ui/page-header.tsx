"use client";

import { cn } from "@/lib/utils";

interface TextSegment {
  text: string;
  className?: string;
}

interface PageHeaderProps {
  title: TextSegment[] | string;
  description?: string;
  showAccentLine?: boolean;
  accentLineColor?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  showAccentLine = false,
  accentLineColor = "bg-primary",
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("py-12 sm:py-16 md:py-20 text-center", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {showAccentLine && (
          <div className={cn("mx-auto mb-6 h-1 w-16 rounded-full", accentLineColor)} />
        )}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          {Array.isArray(title) ? (
            title.map((segment, i) => (
              <span key={i} className={segment.className}>
                {segment.text}
              </span>
            ))
          ) : (
            title
          )}
        </h1>
        {description && (
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
