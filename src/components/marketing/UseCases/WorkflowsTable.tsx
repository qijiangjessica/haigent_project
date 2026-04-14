"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { SvgIcon } from "@/components/ui/svg-icon";

type Workflow = {
  iconName: string;
  name: string;
  autonomous: string;
  humanInLoop: string;
  kpi: string;
};

type Category = {
  id: string;
  name: string;
  iconName: string;
  description: string;
  workflows: Workflow[];
};

const categories: Category[] = [
  {
    id: "hr-operations",
    name: "HR Operations",
    iconName: "hr-office",
    description: "Intelligent Automation with Human Oversight - The fundamental strategy of Haigent.ai, balancing freedom and responsibility, rests with HR automation.",
    workflows: [
      { iconName: "workflow-process", name: "Workflow Intelligence", autonomous: "Self-managed HR workflows, linking AI agents for tasks like updating employee records, accepting requests, notifying, and compliance checks", humanInLoop: "Rules predetermined, real-time adaptation", kpi: "Constant enhancement" },
      { iconName: "collaborative-team", name: "Human-in-the-Loop Control", autonomous: "Approval gates, exception paths, escape routes", humanInLoop: "HR leaders intervene where necessary", kpi: "Full control retained" },
      { iconName: "goal-distribution", name: "KPI-Driven Performance", autonomous: "Accuracy records, workflow tracking, impact measurement", humanInLoop: "Strategic decision-making", kpi: "Transparent results" },
    ],
  },
  {
    id: "industry-solutions",
    name: "Industry Solutions",
    iconName: "analytics-dashboard",
    description: "Purpose-built solutions that fit industry requirements - deploy quickly and remain flexible",
    workflows: [
      { iconName: "collaborative-team", name: "Professional Services", autonomous: "Client onboarding, project staffing, workforce planning", humanInLoop: "Approvals for staffing and availability", kpi: "Resources promptly & precisely" },
      { iconName: "analytics-dashboard", name: "Technology", autonomous: "Technical recruitment, QA coordination", humanInLoop: "Engineering velocity alignment", kpi: "Faster hiring speed" },
      { iconName: "help-service", name: "Healthcare", autonomous: "Shift management, credential verification, compliance workflows", humanInLoop: "Regulatory oversight", kpi: "Reduced manual labor" },
      { iconName: "salary-management", name: "Finance", autonomous: "KYC onboarding, invoice automation, approval workflows", humanInLoop: "Compliance and auditability", kpi: "Every step auditable" },
    ],
  },
];

export function WorkflowsTable() {
  const [activeCategory, setActiveCategory] = useState<string>("hr-operations");
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });
  const activeCategoryData = categories.find((cat) => cat.id === activeCategory) || categories[0];

  useEffect(() => {
    const activeButton = buttonRefs.current[activeCategory];
    const container = containerRef.current;
    if (activeButton && container) {
      activeButton.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      const updateSliderPosition = () => {
        if (activeButton && container) {
          setSliderStyle({ left: activeButton.offsetLeft, width: activeButton.offsetWidth });
        }
      };
      updateSliderPosition();
      const timeoutId = setTimeout(updateSliderPosition, 300);
      const handleScroll = () => updateSliderPosition();
      container.addEventListener("scroll", handleScroll);
      return () => { clearTimeout(timeoutId); container.removeEventListener("scroll", handleScroll); };
    }
  }, [activeCategory]);

  return (
    <section className="bg-background py-16 md:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center mb-10 sm:mb-12 md:mb-14">
          <div ref={containerRef} className="relative inline-flex items-center gap-1 rounded-full p-1 sm:p-1.5 backdrop-blur-md border border-gray-300 overflow-x-auto overflow-y-hidden max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shadow-md">
            <motion.div className="absolute h-[calc(100%-0.5rem)] sm:h-[calc(100%-0.75rem)] rounded-full bg-destructive z-0" initial={false} animate={{ left: sliderStyle.left, width: sliderStyle.width }} transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }} />
            {categories.map((category) => {
              const isActive = activeCategory === category.id;
              return (
                <button key={category.id} ref={(el) => { buttonRefs.current[category.id] = el; }} onClick={() => setActiveCategory(category.id)} className={`relative z-10 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-full transition-colors shrink-0 ${isActive ? "text-destructive-foreground" : "text-foreground hover:text-destructive"}`}>
                  <SvgIcon name={category.iconName} size={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="text-xs sm:text-sm md:text-base font-medium whitespace-nowrap">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="text-center mb-12 md:mb-16">
          <motion.h2 key={`title-${activeCategory}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 uppercase tracking-wide">{activeCategoryData.name}</motion.h2>
          <motion.p key={`desc-${activeCategory}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.05 }} className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">{activeCategoryData.description}</motion.p>
        </div>
        <motion.div key={`table-${activeCategory}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="relative border border-gray-300 rounded-xl overflow-hidden bg-card shadow-md">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 text-xs font-semibold text-foreground uppercase tracking-wider border-b border-gray-300 bg-gray-300">
            <div className="col-span-3">Workflow</div>
            <div className="col-span-3">Autonomous</div>
            <div className="col-span-3">Human-in-Loop</div>
            <div className="col-span-3">KPI</div>
          </div>
          <div className="divide-y divide-gray-300">
            {activeCategoryData.workflows.map((workflow) => (
              <div key={`${activeCategory}-${workflow.name}`} className="p-4 md:p-6 hover:bg-muted/50 transition-colors duration-200">
                <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${activeCategory === "hr-operations" ? "bg-secondary/20" : "bg-primary/20"}`}>
                      <SvgIcon name={workflow.iconName} size={20} className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-foreground">{workflow.name}</span>
                  </div>
                  <div className="col-span-3"><span className="text-sm text-muted-foreground">{workflow.autonomous}</span></div>
                  <div className="col-span-3"><span className="text-sm text-muted-foreground">{workflow.humanInLoop}</span></div>
                  <div className="col-span-3">
                    <Badge className={activeCategory === "hr-operations" ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}>{workflow.kpi}</Badge>
                  </div>
                </div>
                <div className="md:hidden space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${activeCategory === "hr-operations" ? "bg-secondary/20" : "bg-primary/20"}`}>
                      <SvgIcon name={workflow.iconName} size={20} className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-foreground block">{workflow.name}</span>
                      <Badge className={`mt-1 ${activeCategory === "hr-operations" ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>{workflow.kpi}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2 pl-13">
                    <div><span className="text-xs font-semibold text-muted-foreground uppercase">Autonomous</span><p className="text-sm text-muted-foreground">{workflow.autonomous}</p></div>
                    <div><span className="text-xs font-semibold text-muted-foreground uppercase">Human-in-Loop</span><p className="text-sm text-muted-foreground">{workflow.humanInLoop}</p></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
