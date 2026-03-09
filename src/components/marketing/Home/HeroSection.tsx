"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="overflow-x-hidden">
      <section className="relative overflow-x-hidden">
        <div className="relative pb-8 sm:pb-22 pt-10 md:pb-24 z-10">
          <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 sm:gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:gap-10">
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:w-1/2 lg:text-left">
              <span className="inline-block rounded-full bg-destructive/80 px-4 py-1 text-sm font-medium text-white border border-primary/20">
                Meet Haigent
              </span>
              <h1 className="mt-4 sm:mt-5 md:mt-6 max-w-2xl text-balance text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-medium leading-tight">
                The Digital HR Team That Cuts Hiring Time in Half
              </h1>
              <p className="mt-3 sm:mt-4 md:mt-5 max-w-2xl text-pretty text-sm sm:text-base leading-relaxed text-muted-foreground">
                Stop losing top talent to slow processes. Haigent deploys a coordinated ecosystem of AI agents to handle sourcing, screening, and onboarding, delivering a 567% ROI in year one.
              </p>
              <div className="mt-6 sm:mt-8 md:mt-12 flex flex-col items-center justify-center gap-3 sm:gap-2 sm:flex-row lg:justify-start w-full sm:w-auto px-2 sm:px-0">
                <Button asChild size="lg" className="px-5 text-base w-full sm:w-auto">
                  <Link href="#demo">
                    <span className="text-nowrap">Book Live Demo</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="px-5 text-base bg-destructive! text-white! w-full sm:w-auto"
                >
                  <Link href="/products">
                    <span className="text-nowrap" style={{ textShadow: "0 1px 2px rgba(255,255,255,0.5)" }}>
                      Explore Agents
                    </span>
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative order-first flex items-center justify-center mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md lg:order-last lg:w-1/2 lg:max-w-none lg:flex lg:justify-end">
              <div className="relative w-full lg:max-w-lg">
                <video
                  className="pointer-events-none h-auto w-full object-contain"
                  src="/animations/1/Idle.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  aria-label="AI Agent Character Animation"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
