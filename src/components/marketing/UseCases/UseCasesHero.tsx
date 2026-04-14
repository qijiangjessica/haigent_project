"use client";
import React from "react";
import { PageHeader } from "@/components/ui/page-header";

export function UseCasesHero() {
  return (
    <>
      <PageHeader
        title={[
          { text: "Use Cases Powered by ", className: "text-foreground" },
          { text: "Haigent.ai AI Agent Orchestration", className: "text-destructive" },
        ]}
        description="The current HR departments are forced to operate much faster, smarter, and to demonstrate results, all of which do not involve additional expenses."
        showAccentLine={true}
        accentLineColor="bg-primary"
      />
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            The AI Agent Orchestration from Haigent.ai is designed to automate complex HR tasks for a company while retaining control, compliance, and human oversight.
          </p>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Haigent.ai, instead of automating only single tasks, provides enterprise-level AI agent coordination, connecting workflows, decisions, and data into a single intelligent system.
          </p>
        </div>
      </section>
    </>
  );
}
