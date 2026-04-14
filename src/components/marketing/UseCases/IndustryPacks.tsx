"use client";
import React from "react";
import { motion } from "framer-motion";
import { GlowingCard } from "@/components/ui/glowing-card";
import { SvgIcon } from "@/components/ui/svg-icon";
import { cn } from "@/lib/utils";

const industryPacks = [
  { name: "Professional Services", description: "Automation of client onboarding, project staffing and workforce planning. AI agents handle approvals for staffing and availability checks, ensuring projects obtain resources promptly and precisely.", iconName: "collaborative-team" },
  { name: "Technology", description: "Automate technological recruitment and launch QA coordination. Haigent.ai compares the hiring speed with engineering velocity.", iconName: "analytics-dashboard" },
  { name: "Healthcare", description: "Manage shift, verify credentials, and compliance workflow precision. Automation satisfies regulatory requirements and reduces manual labor.", iconName: "help-service" },
  { name: "Finance", description: "Facilitate safe KYC onboarding, invoice automation, and approval. Haigent.ai ensures compliance and auditability at every step.", iconName: "salary-management" },
];

export function IndustryPacks() {
  return (
    <section className="bg-background py-16 md:py-16 lg:py-20 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 uppercase tracking-wide">Industry Packs</h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">Purpose-Built Solutions for Every Sector. Ready-to-use workflows that fit industry requirements, deploy quickly and remain flexible.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {industryPacks.map((pack, index) => (
            <motion.div key={pack.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }} className="h-full">
              <GlowingCard title={pack.name} description={pack.description} icon={<SvgIcon name={pack.iconName} size={40} alt={pack.name} />} className={cn("relative overflow-hidden h-full")} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
