"use client";
import React from "react";
import SkewCards from "../gradient-card-showcase";

const howItWorksCards = [
  {
    title: "AI Optimization Layer",
    subtitle: "1. LangGraph",
    desc: "Provides adaptive orchestration with persistent memory. Continuously optimizes workflows based on historical performance and business needs. Ensures your talent management automation is intelligent and data-driven.",
    color: "#E35B6D",
  },
  {
    title: "Workflow Layer",
    subtitle: "2. n8n",
    desc: "Visual workflow designer with approval gates for controlled automation. Integrates with over 500 enterprise applications for seamless HR operations. Streamlines processes to reduce time-to-hire and minimize manual intervention.",
    color: "#19A9B6",
  },
  {
    title: "Agent Execution Layer",
    subtitle: "3. Haigent Runtime",
    desc: "Executes specialized HR and recruiting tasks with precision. Achieves 95% data-flow accuracy, ensuring minimal errors and maximum efficiency. Supports a fully automated digital HR team, freeing your HR leaders for strategic initiatives.",
    color: "#9ABF45",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-background relative">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 relative z-10">
        <div className="text-center flex justify-center flex-col items-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-3 sm:mb-4">
            How It Works - Three-Layer Architecture
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            An enterprise-level reliability, scalability, and automation Haigent.ai agent orchestration is based on a robust three-layer architecture that can be leveraged in terms of scalability and automation.
          </p>
        </div>
        <div className="relative">
          <div className="hidden md:block absolute -left-180 top-1/2 -translate-y-1/2 pointer-events-none z-0 w-190 h-190">
            <video src="/animations/1/Fly.mp4" className="w-full h-full object-contain scale-x-[-1] -rotate-42" autoPlay loop muted playsInline aria-hidden="true" />
          </div>
          <div className="hidden md:block absolute -right-180 top-1/2 -translate-y-1/2 pointer-events-none z-0 w-190 h-190">
            <video src="/animations/4/Fly.mp4" className="w-full h-full object-contain rotate-30" autoPlay loop muted playsInline aria-hidden="true" />
          </div>
          <SkewCards cards={howItWorksCards} />
        </div>
        <div className="mt-12 sm:mt-16 md:mt-20 text-center">
          <p className="text-base sm:text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            This three-layered architecture of Haigent.ai is a potent solution that may be offered to organizations that require enterprise AI agent coordination based on the combination of efficiency, accuracy, and scalability between them.
          </p>
        </div>
      </div>
    </section>
  );
}
