"use client";
import React from "react";
import { ElitePlanCard } from "@/components/ui/elite-plan-card";

const securityCards = [
  {
    imageUrl: "/Test_image.png",
    title: "Zero-Trust Architecture",
    subtitle: "Security",
    description: "Enterprise-grade security with zero-trust principles ensuring every access request is verified and authenticated to keep your digital HR personnel safe.",
    highlights: ["Multi-factor authentication", "Role-based access control", "End-to-end encryption", "Real-time monitoring"],
  },
  {
    imageUrl: "/Test_image_2.png",
    title: "Compliance Ready",
    subtitle: "Compliance",
    description: "Haigent.ai upholds international regulations providing organizations with the assurance that they will be compliant with global standards.",
    highlights: ["GDPR / CCPA", "SOC 2 Type II", "ISO 27001", "HIPAA"],
  },
  {
    imageUrl: "/Test_image_3.png",
    title: "Full Auditability",
    subtitle: "Governance",
    description: "Super transparency through detailed planning and implementation logs, live monitoring, and immediate notification for safe and efficient orchestration.",
    highlights: ["Planning & execution logs", "Live monitoring", "Immediate notification", "Complete audit trails"],
  },
];

export default function SecurityGovernance() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center flex justify-center flex-col items-center mb-6 sm:mb-8 md:mb-10 lg:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-semibold tracking-tight mb-2 sm:mb-3">
            Security &amp; Governance
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            In Haigent.ai agent orchestration, it is all about security and compliance. Our platform runs on a Zero-Trust architecture, and all access requests are validated and authenticated.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 justify-items-center">
          {securityCards.map((card, index) => (
            <ElitePlanCard
              key={index}
              imageUrl={card.imageUrl}
              title={card.title}
              subtitle={card.subtitle}
              description={card.description}
              highlights={card.highlights}
              highlightsColumns={1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
