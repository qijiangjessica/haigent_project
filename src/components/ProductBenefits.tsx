"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BentoGridShowcase } from "@/components/bento-grid_2";
import { SvgIcon } from "@/components/ui/svg-icon";

type ColorType = "destructive" | "primary" | "secondary" | "accent" | "muted";

interface BenefitItem {
  name: string;
  description: string;
  bullets: string[];
  iconName: string;
}

interface ProductBenefitsProps {
  badge?: string;
  title: string;
  subtitle: string;
  items: BenefitItem[];
  color: ColorType;
  secondaryColor: ColorType;
  animationPath: string;
  productName: string;
}

function getColorClasses(color: ColorType) {
  const colorMap = {
    destructive: { bg: "bg-destructive", text: "text-destructive", textForeground: "text-destructive-foreground", bgLight: "bg-destructive/10", border: "border-destructive" },
    primary: { bg: "bg-primary", text: "text-primary", textForeground: "text-primary-foreground", bgLight: "bg-primary/10", border: "border-primary" },
    secondary: { bg: "bg-secondary", text: "text-secondary", textForeground: "text-secondary-foreground", bgLight: "bg-secondary/10", border: "border-secondary" },
    accent: { bg: "bg-accent", text: "text-accent", textForeground: "text-accent-foreground", bgLight: "bg-accent/10", border: "border-accent" },
    muted: { bg: "bg-muted", text: "text-muted-foreground", textForeground: "text-foreground", bgLight: "bg-muted/10", border: "border-muted" },
  };
  return colorMap[color];
}

export function ProductBenefits({ badge, title, subtitle, items, color, secondaryColor, animationPath, productName }: ProductBenefitsProps) {
  const colors = getColorClasses(color);
  const secondaryColors = getColorClasses(secondaryColor);

  return (
    <section className="py-14 sm:py-18 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-3 text-center max-w-3xl mx-auto">
          <p className={`text-xs font-semibold tracking-[0.2em] uppercase text-${color} mb-3`}>{badge}</p>
          <h2 className="text-2xl sm:text-3xl font-bold uppercase">{title}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>

        <BentoGridShowcase
          integrations={
            <Card className={`h-full border-border/70 ${colors.bgLight} ${colors.border}`}>
              <CardHeader>
                <h3 className="text-lg font-semibold">{items[0]?.name}</h3>
                <p className="text-sm text-muted-foreground">{items[0]?.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.slice(1, 3).map((item) => (
                  <div key={item.name} className="flex gap-3">
                    <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full ${colors.bgLight}`}>
                      <SvgIcon name={item.iconName} size={20} alt={item.name} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          }
          mainFeature={
            <Card className={`h-full ${colors.border} bg-card/80 flex flex-col overflow-hidden`}>
              <CardHeader>
                <h3 className="text-lg font-semibold text-foreground">{items[3]?.name}</h3>
                <p className="text-sm text-muted-foreground">{items[3]?.description}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {items[3]?.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className={colors.text}>•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div className="hidden md:block mt-auto pt-4">
                  <div className="relative w-full rounded-lg overflow-hidden ml-8">
                    <video
                      src={animationPath}
                      className="w-full h-full object-cover transform rotate-[30deg] mt-6"
                      autoPlay
                      loop
                      muted
                      playsInline
                      aria-label={`${productName} animation`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          }
          featureTags={
            <Card className={`h-full border-dashed border-${secondaryColor} bg-muted/60`}>
              <CardContent className="flex flex-wrap gap-2 p-4">
                {items.flatMap((i) => i.bullets.slice(0, 1)).slice(0, 6).map((tag) => (
                  <span key={tag} className="rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground border border-border/70">
                    {tag}
                  </span>
                ))}
              </CardContent>
            </Card>
          }
          secondaryFeature={
            <Card className={`h-full text-white ${secondaryColors.bg} flex flex-col overflow-hidden`}>
              <CardHeader>
                <h3 className="text-lg font-semibold">{items[4]?.name}</h3>
                <p className="text-sm">{items[4]?.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {items[4]?.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span>•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          }
          statistic={
            <Card className={`h-full border-border ${colors.bg} ${colors.textForeground} shadow-md`}>
              <CardContent className="flex h-full flex-col justify-between p-6">
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-wide">Coverage</p>
                  <p className="text-4xl font-bold leading-tight">{items.length}+ benefits</p>
                  <p className="text-sm opacity-80">Built to snap into your existing stack.</p>
                </div>
              </CardContent>
            </Card>
          }
          journey={
            <Card className={`h-full bg-muted/60 border-dashed border-${secondaryColor}`}>
              <CardHeader>
                <h3 className="text-lg font-semibold">{items[5]?.name}</h3>
                <p className="text-sm text-muted-foreground">{items[5]?.description}</p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {items[5]?.bullets.map((bullet) => (
                  <span key={bullet} className="rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground border border-border/70">
                    {bullet}
                  </span>
                ))}
              </CardContent>
            </Card>
          }
          className="w-full"
        />
      </div>
    </section>
  );
}
