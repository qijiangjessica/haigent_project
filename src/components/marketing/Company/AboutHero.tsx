"use client";

import { PageHeader } from "@/components/ui/page-header";

export function AboutHero() {
  return (
    <>
      <PageHeader
        title={[
          { text: "About ", className: "text-foreground" },
          { text: "Haigent.ai", className: "text-destructive" },
        ]}
        description="Democratizing Enterprise-Grade AI for Mid-Market Companies"
        showAccentLine={true}
        accentLineColor="bg-primary"
      />
      <section className="py-8 sm:py-12 md:py-16 ">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 ">
          <div className="relative mx-auto max-w-4xl ">
            <div className="relative overflow-hidden rounded-2xl bg-primary p-8 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] sm:p-10 md:p-12 ">
              <div className="relative space-y-6 text-center">
                <p className="text-lg leading-relaxed text-gray-900 font-medium">
                  At Haigent.ai, the strength of AI need not belong only to the
                  most significant business. We intend to deliver{" "}
                  <span
                    className="font-extrabold"
                    style={{ color: "#991b1b" }}
                  >
                    enterprise-level AI agent coordination
                  </span>{" "}
                  to mid-market enterprises, enabling them to employ intelligent
                  automation to redesign HR and talent management. With AI
                  agents that will allow employees to implement more complex
                  workflows, we help businesses reduce administrative headcount,
                  hire quickly, and manage HR processes throughout the
                  lifecycle.
                </p>

                <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

                <p className="text-lg leading-relaxed text-gray-900 font-medium">
                  <span
                    className="font-extrabold"
                    style={{ color: "#1e3a5f" }}
                  >
                    Haigent.AI Agent Orchestration
                  </span>{" "}
                  is designed to maintain harmonious coexistence with your
                  systems, giving your{" "}
                  <span
                    className="font-extrabold"
                    style={{ color: "#166534" }}
                  >
                    Digital HR Team
                  </span>{" "}
                  access to automation tools within HR workflows that promote
                  productivity without sacrificing transparency, accuracy, or
                  compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
