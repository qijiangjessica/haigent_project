"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function JoinTeamCTA() {
  return (
    <section className="py-12 sm:py-16 md:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow">
          <div className="absolute inset-0">
            <Image
              src="/all_robo.png"
              alt="Background"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 grid h-full grid-cols-1 items-center gap-8 p-8 md:grid-cols-2 md:p-12 lg:p-16">
            <div className="flex flex-col items-start text-left text-white">
              <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
                Join the Team
              </h2>
              <p className="mt-4 max-w-xl text-lg text-neutral-200">
                We&apos;re remote-first and values-driven. Help us democratize
                AI for mid-market companies and reshape the future of HR.
              </p>
            </div>
            <div className="flex w-full max-w-md flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 w-full sm:w-auto bg-accent text-black hover:bg-accent/90"
              >
                <Link href="#careers">
                  View Open Roles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 w-full sm:w-auto border-white/20 bg-secondary text-white hover:bg-secondary/90 hover:text-white"
              >
                <Link href="#about">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
