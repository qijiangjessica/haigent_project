"use client";

import React from "react";

type ColorType = "destructive" | "primary" | "secondary" | "accent" | "muted";

interface ProductIntroductionProps {
  title: string;
  description: string;
  color: ColorType;
}

function getBackgroundStyle(color: ColorType) {
  const styles = {
    destructive: { bg: "bg-destructive", accent: "bg-white/10", accentHover: "bg-white/15", line: "bg-white/20" },
    primary: { bg: "bg-primary", accent: "bg-black/10", accentHover: "bg-black/15", line: "bg-black/20" },
    secondary: { bg: "bg-secondary", accent: "bg-white/10", accentHover: "bg-white/15", line: "bg-white/20" },
    accent: { bg: "bg-accent", accent: "bg-black/10", accentHover: "bg-black/15", line: "bg-black/20" },
    muted: { bg: "bg-muted", accent: "bg-foreground/10", accentHover: "bg-foreground/15", line: "bg-foreground/20" },
  };
  return styles[color];
}

function getTextColor(color: ColorType) {
  if (color === "primary" || color === "accent") return "text-primary-foreground";
  if (color === "muted") return "text-foreground";
  return "text-white";
}

function getSubtextColor(color: ColorType) {
  if (color === "primary" || color === "accent") return "text-primary-foreground/80";
  if (color === "muted") return "text-muted-foreground";
  return "text-white/80";
}

export function ProductIntroduction({ title, description, color }: ProductIntroductionProps) {
  const styles = getBackgroundStyle(color);
  const textColor = getTextColor(color);
  const subtextColor = getSubtextColor(color);

  return (
    <section className="relative overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className={`relative mx-auto max-w-5xl ${styles.bg} py-12 sm:py-16 md:py-20 lg:py-20 px-6 sm:px-10 md:px-14 lg:px-20 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden`}>
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold ${textColor} mb-4 sm:mb-6 leading-tight`}>
              {title}
            </h2>
            <p className={`text-sm sm:text-base md:text-lg ${subtextColor} leading-relaxed`}>
              {description}
            </p>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            <div className={`w-1.5 h-1.5 ${styles.accent} rounded-full`} />
            <div className={`w-1.5 h-1.5 ${styles.accentHover} rounded-full`} />
            <div className={`w-1.5 h-1.5 ${styles.accent} rounded-full`} />
          </div>
        </div>
      </div>
    </section>
  );
}
