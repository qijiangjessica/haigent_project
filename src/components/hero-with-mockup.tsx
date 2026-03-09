"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Mockup } from "@/components/ui/mockup";
import Image from "next/image";

interface HeroWithMockupProps {
  label?: string;
  title: string;
  subtitle: string;
  primaryCta?: { text: string; href: string };
  secondaryCta?: { text: string; href: string; icon?: React.ReactNode };
  mockupImage?: { src: string; alt: string; width: number; height: number };
  heroImage?: string;
  className?: string;
  labelColor?: "destructive" | "primary" | "secondary" | "accent" | "muted";
  primaryButtonColor?: "destructive" | "primary" | "secondary" | "accent" | "muted";
  secondaryButtonColor?: "destructive" | "primary" | "secondary" | "accent" | "muted";
  glowColor?: string;
}

function getColorClasses(color: "destructive" | "primary" | "secondary" | "accent" | "muted") {
  const colorMap = {
    destructive: { bg: "bg-destructive", text: "text-destructive", textForeground: "text-destructive-foreground", hover: "hover:bg-destructive/90", cssVar: "var(--color-destructive)", cssVarForeground: "var(--color-destructive-foreground)" },
    primary: { bg: "bg-primary", text: "text-primary", textForeground: "text-primary-foreground", hover: "hover:bg-primary/90", cssVar: "var(--color-primary)", cssVarForeground: "var(--color-primary-foreground)" },
    secondary: { bg: "bg-secondary", text: "text-secondary", textForeground: "text-secondary-foreground", hover: "hover:bg-secondary/90", cssVar: "var(--color-secondary)", cssVarForeground: "var(--color-secondary-foreground)" },
    accent: { bg: "bg-accent", text: "text-accent", textForeground: "text-accent-foreground", hover: "hover:bg-accent/90", cssVar: "var(--color-accent)", cssVarForeground: "var(--color-accent-foreground)" },
    muted: { bg: "bg-muted", text: "text-muted-foreground", textForeground: "text-foreground", hover: "hover:bg-muted/90", cssVar: "var(--color-muted)", cssVarForeground: "var(--color-foreground)" },
  };
  return colorMap[color];
}

export function HeroWithMockup({
  label,
  title,
  subtitle,
  primaryCta = { text: "Get Started", href: "/get-started" },
  secondaryCta,
  mockupImage,
  heroImage,
  className,
  labelColor = "accent",
  primaryButtonColor = "accent",
  secondaryButtonColor = "destructive",
}: HeroWithMockupProps) {
  const labelColors = getColorClasses(labelColor);
  const primaryColors = getColorClasses(primaryButtonColor);
  const secondaryColors = getColorClasses(secondaryButtonColor);

  return (
    <section className={cn("relative bg-background text-foreground pt-10 px-4 overflow-hidden", className)}>
      <div className="relative mx-auto max-w-[1280px]">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="flex flex-col gap-4 lg:gap-6 text-center lg:text-left">
            {label && (
              <span className={cn("animate-appear text-base sm:text-lg font-semibold", labelColors.text)}>
                {label}
              </span>
            )}
            <h1 className={cn("animate-appear opacity-0 [animation-delay:100ms]", "text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl", "leading-[1.15] sm:leading-[1.15]", "text-foreground")}>
              {title}
            </h1>
            <p className={cn("max-w-[550px] mx-auto lg:mx-0 animate-appear opacity-0 [animation-delay:200ms]", "text-base sm:text-lg md:text-xl", "text-muted-foreground", "font-medium")}>
              {subtitle}
            </p>
            <div className="relative z-10 flex flex-wrap justify-center lg:justify-start gap-4 animate-appear opacity-0 [animation-delay:300ms]">
              <Button
                asChild
                size="lg"
                className={cn("shadow-lg transition-all duration-300")}
                style={{ backgroundColor: primaryColors.cssVar, color: primaryColors.cssVarForeground }}
              >
                <a href={primaryCta.href}>{primaryCta.text}</a>
              </Button>
              {secondaryCta && (
                <Button
                  asChild
                  size="lg"
                  className={cn("transition-all duration-300 shadow-lg")}
                  style={{ backgroundColor: secondaryColors.cssVar, color: secondaryColors.cssVarForeground }}
                >
                  <a href={secondaryCta.href}>
                    {secondaryCta.icon}
                    {secondaryCta.text}
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="relative w-full flex items-center justify-center h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] p-2 md:p-4 lg:p-6">
            {heroImage ? (
              <div className="relative w-full h-full animate-appear opacity-0 [animation-delay:500ms]">
                <Image src={heroImage} alt={title} fill className="object-contain" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px" priority />
              </div>
            ) : mockupImage ? (
              <Mockup className={cn("animate-appear opacity-0 [animation-delay:500ms]", "shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]")}>
                <Image {...mockupImage} className="w-full h-full object-cover" decoding="async" priority={true} alt={mockupImage.alt} />
              </Mockup>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
