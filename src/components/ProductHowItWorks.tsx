"use client";

import React from "react";

type ColorType = "destructive" | "primary" | "secondary" | "accent" | "muted";

interface ProductHowItWorksProps {
  badge?: string;
  title: string;
  subtitle: string;
  items: string[];
  color: ColorType;
  secondaryColor: ColorType;
}

function getColorStyles(secondaryColor: ColorType) {
  const styles = {
    destructive: { cardBg: "bg-destructive", cardText: "text-destructive-foreground", borderColor: "border-destructive/30" },
    primary: { cardBg: "bg-primary", cardText: "text-primary-foreground", borderColor: "border-primary/30" },
    secondary: { cardBg: "bg-secondary", cardText: "text-secondary-foreground", borderColor: "border-secondary/30" },
    accent: { cardBg: "bg-accent", cardText: "text-accent-foreground", borderColor: "border-accent/30" },
    muted: { cardBg: "bg-muted-foreground", cardText: "text-background", borderColor: "border-muted/30" },
  };
  return styles[secondaryColor];
}

function getAccentTextColor(color: ColorType) {
  const colors = {
    destructive: "text-destructive",
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
    muted: "text-muted-foreground",
  };
  return colors[color];
}

export function ProductHowItWorks({ badge, title, subtitle, items, color }: ProductHowItWorksProps) {
  const styles = getColorStyles(color);
  const accentText = getAccentTextColor(color);

  return (
    <section className="py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 max-w-3xl mx-auto">
          <p className={`text-xs font-semibold tracking-[0.2em] uppercase ${accentText} mb-3`}>{badge}</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">{title}</h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
          {items.map((item, index) => (
            <div key={index} className={`${styles.cardBg} rounded-2xl p-6 sm:p-7 shadow-lg hover:shadow-xl transition-shadow`}>
              <p className={`text-base sm:text-lg ${styles.cardText} font-medium leading-relaxed`}>{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
