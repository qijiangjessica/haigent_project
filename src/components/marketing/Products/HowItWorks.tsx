"use client";

import { motion } from "framer-motion";
import { SvgIcon } from "@/components/ui/svg-icon";

const workflowSteps = [
  { number: "01", title: "Adaptive Orchestration", description: "Intelligent coordination ensures all HR activities run smoothly. Agents interact in a controlled environment.", iconName: "workflow-process" },
  { number: "02", title: "Human-In-The-Loop", description: "You remain in charge of strategy. Approval gates and audit trails provide control without compromising speed.", iconName: "collaborative-team" },
  { number: "03", title: "Seamless Integration", description: "Integrates with ATS, HRIS, communication tools, and document repositories seamlessly.", iconName: "global-network" },
  { number: "04", title: "Self-Learning", description: "Agents watch interactions, quantify outcomes, and suggest optimizations automatically.", iconName: "analytics-dashboard" },
];

export default function HowItWorks() {
  return (
    <section className="py-8 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl bg-destructive p-6 sm:p-10 md:p-12 lg:p-16 rounded-2xl sm:rounded-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-10 md:mb-12"
        >
          <p className="text-[10px] sm:text-xs font-semibold tracking-[0.15em] sm:tracking-[0.2em] uppercase text-primary mb-2 sm:mb-3">How It Works</p>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-secondary-foreground mb-2 sm:mb-3">Your AI Agent Orchestration Engine</h2>
          <p className="text-sm sm:text-base text-secondary-foreground/70 max-w-lg mx-auto px-2">Intelligent orchestration meets continuous learning</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {workflowSteps.map((step, index) => (
            <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.1 }} className="group relative">
              <div className="h-full bg-secondary-foreground/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-secondary-foreground/10 hover:border-primary/50 hover:bg-secondary-foreground/10 transition-all duration-300">
                <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary/20 group-hover:text-primary/40 transition-colors">{step.number}</span>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary flex items-center justify-center mt-3 sm:mt-4 mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <SvgIcon name={step.iconName} size={20} />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-secondary-foreground mb-1.5 sm:mb-2 group-hover:text-primary transition-colors">{step.title}</h3>
                <p className="text-xs sm:text-sm text-secondary-foreground/70 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
