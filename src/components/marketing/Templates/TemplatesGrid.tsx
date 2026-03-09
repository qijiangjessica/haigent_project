"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Star, Clock, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SvgIcon } from "@/components/ui/svg-icon";

type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  iconName: string;
  features: string[];
  setupTime: string;
  isPopular?: boolean;
  isNew?: boolean;
};

const templates: Template[] = [
  {
    id: "interview-scheduler",
    name: "Interview Scheduler",
    description: "Automated interview scheduling with calendar sync",
    category: "scheduling",
    iconName: "workflow-process",
    features: ["Multi-timezone support", "Calendar integration", "Automated reminders", "Reschedule handling"],
    setupTime: "2-3 days",
    isPopular: true,
  },
  {
    id: "candidate-sourcing",
    name: "Candidate Sourcing",
    description: "AI-powered candidate discovery and outreach",
    category: "sourcing",
    iconName: "talent-search",
    features: ["LinkedIn integration", "Automated outreach", "Candidate scoring", "Pipeline management"],
    setupTime: "3-5 days",
    isPopular: true,
  },
  {
    id: "reference-verification",
    name: "Reference Verification",
    description: "Automated background and reference checks",
    category: "reference",
    iconName: "verify-compliance",
    features: ["Automated requests", "Verification tracking", "Report generation", "Compliance checks"],
    setupTime: "2-4 days",
  },
  {
    id: "employee-onboarding",
    name: "Employee Onboarding",
    description: "Streamlined new hire onboarding process",
    category: "onboarding",
    iconName: "user-profile-icon",
    features: ["Document collection", "Task automation", "Welcome workflows", "HRIS integration"],
    setupTime: "3-5 days",
    isNew: true,
  },
  {
    id: "benefits-enrollment",
    name: "Benefits Enrollment",
    description: "Automated benefits administration",
    category: "benefits",
    iconName: "user-checklist",
    features: ["Open enrollment", "Eligibility checks", "Document management", "Carrier integration"],
    setupTime: "4-6 days",
  },
  {
    id: "payroll-processing",
    name: "Payroll Processing",
    description: "Intelligent payroll automation",
    category: "payroll",
    iconName: "salary-management",
    features: ["Time tracking", "Deduction calculation", "Tax compliance", "Payment processing"],
    setupTime: "5-7 days",
  },
  {
    id: "recruiter-assistant",
    name: "Recruiter Assistant",
    description: "AI assistant for recruiters",
    category: "sourcing",
    iconName: "employee-search",
    features: ["Candidate matching", "Interview prep", "Email automation", "Analytics dashboard"],
    setupTime: "3-4 days",
  },
  {
    id: "calendar-sync",
    name: "Calendar Sync Pro",
    description: "Advanced calendar management",
    category: "scheduling",
    iconName: "workflow-distribution",
    features: ["Multi-calendar sync", "Conflict resolution", "Buffer time", "Timezone handling"],
    setupTime: "2-3 days",
  },
  {
    id: "onboarding-checklist",
    name: "Onboarding Checklist",
    description: "Comprehensive onboarding workflows",
    category: "onboarding",
    iconName: "checklist",
    features: ["Custom checklists", "Progress tracking", "Reminder system", "Completion reports"],
    setupTime: "3-4 days",
  },
];

type TemplatesGridProps = {
  activeCategory: string;
};

export function TemplatesGrid({ activeCategory }: TemplatesGridProps) {
  const filteredTemplates =
    activeCategory === "all"
      ? templates
      : templates.filter((template) => template.category === activeCategory);

  return (
    <section className="bg-muted/20 py-16 md:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No templates found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="group relative">
                <div
                  className={cn(
                    "bg-card dark:bg-card border border-border rounded-xl transition-all duration-300 flex flex-col h-full relative overflow-hidden",
                    "hover:shadow-[0px_4px_16px_rgba(17,17,26,0.1),_0px_8px_24px_rgba(17,17,26,0.1),_0px_16px_56px_rgba(17,17,26,0.1)]",
                    "shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]"
                  )}
                >
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
                    {template.isPopular && (
                      <Badge variant="default" className="text-xs">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Popular
                      </Badge>
                    )}
                    {template.isNew && (
                      <Badge variant="secondary" className="text-xs">New</Badge>
                    )}
                  </div>

                  <div className="relative overflow-hidden p-6 flex-1">
                    <div className="relative z-10">
                      <SvgIcon name={template.iconName} size={44} alt={template.name} className="mb-4" />
                      <h3 className="mt-6 text-sm md:text-base font-semibold">{template.name}</h3>
                      <p className="text-muted-foreground relative z-20 mt-2 text-xs font-light">{template.description}</p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 space-y-3 flex-1 flex flex-col">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="text-xs font-medium text-muted-foreground">Setup: </span>
                      <span className="text-sm text-foreground">{template.setupTime}</span>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-muted-foreground mb-2 block">Features:</span>
                      <ul className="space-y-1">
                        {template.features.map((feature, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-border mt-auto">
                      <Button asChild variant="outline" className="w-full group/button bg-accent hover:bg-accent">
                        <Link href="/templates">
                          View Template
                          <ArrowRight className="w-4 h-4 ml-2 group-hover/button:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
