"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SvgIcon } from "@/components/ui/svg-icon";

export function OurVision() {
  return (
    <section className="bg-background py-16 md:py-16 lg:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Card className="border border-secondary bg-secondary shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3),0_2px_4px_-1px_rgba(0,0,0,0.2)]">
          <CardContent className="p-8 md:p-12 text-center">
            <div className="flex items-center justify-start gap-3 mb-6">
              <SvgIcon
                name="global-network"
                size={56}
                alt="Our Vision"
                className="inline-block"
              />
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white uppercase tracking-wide">
                Our Vision
              </h2>
            </div>
            <div className="space-y-4 text-lg sm:text-xl md:text-2xl text-white leading-relaxed max-w-3xl mx-auto text-left">
              <p>
                We will be able to see a world in which specialized digital
                workers can work smoothly and efficiently with human beings. AI
                agents in this world perform routine and operational duties,
                allowing employees to work at a strategic, creative, and
                relationship-based level.
              </p>
              <p>
                Enterprise AI agent orchestration is an approach that enables
                organizations to become more efficient and error-free while
                improving time-to-hire by combining HR and recruiting processes.
                Haigent.ai allows people to have a hybrid workforce in which
                human intuition and AI accuracy exist simultaneously and form
                more innovative HR teams and more flexible organizations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
