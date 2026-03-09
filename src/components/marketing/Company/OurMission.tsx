"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SvgIcon } from "@/components/ui/svg-icon";

export function OurMission() {
  return (
    <section className="bg-muted/30 py-16 md:py-16 lg:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Card className="border border-destructive bg-destructive shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3),0_2px_4px_-1px_rgba(0,0,0,0.2)]">
          <CardContent className="p-8 md:p-12">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <SvgIcon
                  name="Goal"
                  size={48}
                  alt="Our Mission"
                  className="inline-block"
                />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white uppercase tracking-wide">
                Our Mission
              </h2>
            </div>
            <div className="space-y-4 text-lg sm:text-xl text-white leading-relaxed">
              <p>
                We have a very straightforward yet effective mission, as we are
                working to{" "}
                <span className="text-white/90 font-semibold">
                  democratize enterprise-grade AI to provide it to mid-market
                  businesses of 100-1,000 employees
                </span>
                . We empower the organization to{" "}
                <span className="text-white/90 font-semibold">
                  &quot;hire AI agents as employees to assist them in hiring
                  more employees.&quot;
                </span>{" "}
                This model will guarantee that all organizations will have an
                opportunity to use intelligent automation to attain operational
                excellence.
              </p>
              <p>
                By automating HR processes (especially critical ones), workflow
                automation, and ensuring a quantifiable outcome by using AI
                agents, businesses can remain human-centric. Our vision is to
                ensure that enterprise-level AI is available to any mid-market
                firm that wants a modern HR tool at an affordable price.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
