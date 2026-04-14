"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function ProductsHero() {
  return (
    <>
      <PageHeader
        title={[
          { text: "Transform Every HR Function with ", className: "text-foreground" },
          { text: "Haigent AI Agent Orchestration", className: "text-destructive" },
        ]}
        description="The most sophisticated AI integrator agent system that will streamline HR practices."
        showAccentLine={true}
        accentLineColor="bg-primary"
      />
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            The modern fast world dictates success in terms of talent acquisition, speed, and operational efficiency. Haigent provides a workflow automation solution for your enterprise-level HR environment, across hiring and onboarding, performance analytics, and compliance workflows.
          </p>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Haigent empowers your teams, whether you are a startup creating your first HR stack or a complex enterprise that wants to undertake a profound transformation in its processes. We are automated, think, learn, and get better with time.
          </p>
        </div>
      </section>
    </>
  );
}
