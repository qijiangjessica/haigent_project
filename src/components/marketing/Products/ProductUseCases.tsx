"use client";

import { motion } from "framer-motion";
import { SvgIcon } from "@/components/ui/svg-icon";

const useCases = [
  { team: "Talent Acquisition Teams", description: "Automate recruitment processes, end-to-end, including sourcing, screening, scheduling interviews and conducting reference checks.", iconName: "talent-search", color: "bg-primary", iconBg: "bg-primary-foreground/20" },
  { team: "People & Culture Teams", description: "Have automated onboarding, offboarding, engagement surveys, and feedback loops, which are not manually tracked.", iconName: "collaborative-team", color: "bg-accent", iconBg: "bg-white/20" },
  { team: "HR Shared Services", description: "Automate ticketing, compliance, policy alerts, and the remuneration processes with low manpower.", iconName: "help-service", color: "bg-secondary", iconBg: "bg-secondary-foreground/20" },
  { team: "Enterprise Compliance & Risk Teams", description: "Consistently govern through the consistent audit trails and provide data privacy as well as policy validation within all workflows.", iconName: "verify-compliance", color: "bg-destructive", iconBg: "bg-white/20" },
  { team: "Leadership & Analytics Teams", description: "Create quantifiable KPIs, trend analyses, and ROI indicators that tie the results of HR to the business objectives.", iconName: "analytics-dashboard", color: "bg-accent", iconBg: "bg-white/20" },
];

export default function ProductUseCases() {
  return (
    <section className="py-12 md:py-20 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-10 md:mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">Use Cases</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">How Different Teams Win With Haigent.ai</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">The versatile design of Haigent.ai benefits various HR fields and industries</p>
        </motion.div>
        <div className="space-y-3 sm:space-y-4">
          {useCases.map((useCase, index) => (
            <motion.div key={useCase.team} initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.1 }} className="group">
              <div className={`${useCase.color} rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:scale-[1.01] transition-transform duration-300`}>
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${useCase.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <SvgIcon name={useCase.iconName} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>{useCase.team}</h3>
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed">{useCase.description}</p>
                </div>
                <div className="hidden md:flex w-10 h-10 rounded-full bg-white/10 items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white/60">{String(index + 1).padStart(2, "0")}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 }} className="text-center mt-8 text-sm text-muted-foreground">
          Haigent.ai supports a modernized, flexible, and robust HR function across all applications.
        </motion.p>
      </div>
    </section>
  );
}
