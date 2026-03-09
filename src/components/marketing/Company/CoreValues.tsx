"use client";

import { GlowingCard } from "@/components/ui/glowing-card";
import { SvgIcon } from "@/components/ui/svg-icon";
import { cn } from "@/lib/utils";

type CoreValue = {
  iconName: string;
  title: string;
  subtitle: string;
  description: string;
};

const coreValues: CoreValue[] = [
  {
    iconName: "collaborative-team",
    title: "Human-Centric Innovation",
    subtitle: "AI augments, never replaces.",
    description:
      "AI at Haigent.ai is designed only to augment human decision-making, not to substitute for it. All automations in workflows are designed to help employees focus on higher-value tasks, boosting efficiency and job satisfaction.",
  },
  {
    iconName: "verify-compliance",
    title: "Transparency & Trust",
    subtitle: "Full auditability, explainability.",
    description:
      "All workflows for AI agent orchestration are fully auditable and explainable. Our automation processes ensure confidence and efficiency, as organisations can trust that they are compliant, accurate, and transparent.",
  },
  {
    iconName: "organization",
    title: "Continuous Learning",
    subtitle: "Platform and people improve every day.",
    description:
      "Our platform and our people get better each day. Haigent.ai agents follow the workflows in the organization, and learn from the data, as our teams constantly enhance solutions, making sure that HR automation is continually developing according to business requirements.",
  },
  {
    iconName: "analytics-dashboard",
    title: "Measurable Impact",
    subtitle: "Every deployment tracked to hard ROI.",
    description:
      "Each deployment is monitored to provide hard ROI. Through the application of talent management automation and operational workflows, clients are able to measure the value of AI, whether it is a less burdensome administration or a quickening of hiring processes and enhancing the experience of employees.",
  },
];

export function CoreValues() {
  return (
    <section className="bg-background py-16 md:py-16 lg:py-20 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 uppercase tracking-wide">
            Core Values
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything we do is directed by our values, which determine how we
            treat technology, our relationships with clients, and the culture in
            the workplace.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {coreValues.map((value) => (
            <div key={value.title} className="h-full">
              <GlowingCard
                title={value.title}
                description={value.description}
                icon={
                  <SvgIcon
                    name={value.iconName}
                    size={64}
                    alt={value.title}
                  />
                }
                className={cn("relative overflow-hidden h-full")}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
