"use client";
import Image from "next/image";
import { X, Check } from "lucide-react";

const comparisonData = [
  { feature: "Sourcing", oldWay: "Hours of manual LinkedIn searching.", haigentWay: "24/7 autonomous talent discovery." },
  { feature: "Screening", oldWay: "Human bias and 1-week delays.", haigentWay: "Objective, instant skill matching." },
  { feature: "Scheduling", oldWay: "Email tag for 3 days.", haigentWay: "Instant, conflict-free booking." },
];

export function BenefitsSection() {
  return (
    <section>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12 flex flex-col items-center justify-center">
          <p className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">Why Choose Haigent</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">Transform Your Hiring Process</h2>
          <p className="text-muted-foreground text-sm sm:text-base text-center max-w-2xl mx-auto">
            See how Haigent&apos;s AI-powered approach outperforms traditional methods
          </p>
        </div>

        <div className="mb-10 sm:mb-14 md:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="relative overflow-hidden rounded-2xl border border-gray-500/30 bg-gray-500/30 p-5 sm:p-6 lg:p-6 shadow-lg">
              <div className="relative">
                <div className="flex items-center gap-3 mb-4 lg:mb-5">
                  <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gray-500/20 flex items-center justify-center">
                    <X className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500/60" />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-500/70">The Old Way</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-500/50 mb-4 lg:mb-5">Manual &amp; Time-Consuming</p>
                <div className="space-y-3">
                  {comparisonData.map((row, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 lg:p-4 rounded-xl bg-background border border-secondary/20 shadow-sm">
                      <div className="flex-shrink-0 w-6 h-6 lg:w-7 lg:h-7 rounded-lg bg-gray-500/30 flex items-center justify-center mt-0.5">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500/50">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm lg:text-base font-semibold text-foreground mb-0.5">{row.feature}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{row.oldWay}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-3 lg:p-4 rounded-xl bg-gray-500/10 border border-gray-500/20">
                  <p className="text-xs sm:text-sm font-medium text-gray-500/50">Result</p>
                  <p className="text-base sm:text-lg font-bold text-gray-500/60 mt-0.5">High overhead / Slow growth</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border-2 border-primary/50 bg-primary p-5 sm:p-6 lg:p-6 shadow-xl shadow-primary/20">
              <div className="relative">
                <div className="flex items-center gap-3 mb-4 lg:mb-5">
                  <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-primary border border-gray-500/30 flex items-center justify-center shadow-md shadow-accent/30">
                    <Check className="w-4 h-4 lg:w-5 lg:h-5 text-accent-foreground" strokeWidth={3} />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary-foreground">The Haigent Way</h3>
                </div>
                <p className="text-xs sm:text-sm text-primary-foreground/80 font-medium mb-4 lg:mb-5">AI-Powered &amp; Agentic</p>
                <div className="space-y-3">
                  {comparisonData.map((row, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 lg:p-4 rounded-xl bg-background/95 border border-primary/20 shadow-sm">
                      <div className="flex-shrink-0 w-6 h-6 lg:w-7 lg:h-7 rounded-lg bg-primary flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-foreground" strokeWidth={3} />
                      </div>
                      <div>
                        <p className="text-sm lg:text-base font-semibold text-foreground mb-0.5">{row.feature}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{row.haigentWay}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-3 lg:p-4 rounded-xl bg-background border border-primary/30 shadow-sm">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Result</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">567% First-Year Return</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 text-center sm:mb-10 flex flex-col items-center justify-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">Executive Benefits - Mid-Market Impact</h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg max-w-3xl mx-auto">
            Haigent.ai agent orchestration can provide quantifiable change to mid-market organizations of approximately 500 partners or so.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="relative overflow-hidden rounded-md bg-accent px-6 py-10 shadow-[0px_4px_16px_rgba(17,17,26,0.12),0px_8px_24px_rgba(17,17,26,0.10)] sm:px-10 lg:pr-56">
            <div className="grid grid-cols-1 gap-10 text-center text-white sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
              {[
                { label: "Net ROI", value: "567%", sub: "in 1st year" },
                { label: "Annual Savings", value: "$120,000", sub: "on admin costs" },
                { label: "Time-to-Hire", value: "Up to 50%", sub: "reduction" },
                { label: "Admin Overhead", value: "30-40%", sub: "reduction" },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <p className="text-3xl font-bold tracking-tight [text-shadow:0_2px_4px_rgba(0,0,0,0.35)] sm:text-4xl">{item.label}</p>
                  <p className="text-2xl font-bold [text-shadow:0_2px_4px_rgba(0,0,0,0.35)] sm:text-3xl">{item.value}</p>
                  <p className="text-2xl font-bold [text-shadow:0_2px_4px_rgba(0,0,0,0.35)] sm:text-3xl">{item.sub}</p>
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute bottom-0 right-0 hidden h-[260px] w-[260px] sm:block lg:h-[300px] lg:w-[300px]">
              <Image src="/models_poses/green.png" alt="" fill className="object-contain" priority={false} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
