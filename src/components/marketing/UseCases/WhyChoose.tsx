"use client";
import React from "react";
import { GlareCard } from "@/components/ui/glare-card";
import { SvgIcon } from "@/components/ui/svg-icon";

const features = [
  { iconName: "workflow-process", title: "Instant Activation", description: "Ready-made workflows become active within minutes and deliver direct productivity gains." },
  { iconName: "goal-distribution", title: "Proven ROI", description: "Over 40+ deployments, Haigent.ai has delivered an average 567% ROI, improving the rate of work, decreasing administration, and enhancing accuracy." },
  { iconName: "collaborative-team", title: "Human-Centric Automation", description: "Haigent.ai does not substitute human decisions but helps to improve them. AI deals with execution and leaves strategic control to people." },
];

export function WhyChoose() {
  return (
    <section className="bg-background py-16 md:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">Why Choose Haigent.ai?</h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">Haigent.ai is the preferred company in organizations due to its demonstrated outcomes rather than automation.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <GlareCard key={index} className="p-6 bg-accent shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>
                  <SvgIcon name={feature.iconName} size={48} alt={feature.title} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>{feature.title}</h3>
                <p className="text-sm text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>{feature.description}</p>
              </div>
            </GlareCard>
          ))}
        </div>
      </div>
    </section>
  );
}
