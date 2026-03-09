"use client";

import { motion } from "framer-motion";
import { Clock, TrendingUp, CheckCircle, Scale, BarChart3 } from "lucide-react";

const benefits = [
  { title: "Reduce Time-to-Hire", description: "Eliminate bottlenecks by automating sourcing, screening, scheduling, and communication. Faster offer rollouts, higher acceptance rates.", icon: Clock, stat: "40%", statLabel: "Faster hiring" },
  { title: "Boost HR Productivity", description: "HR teams focus on strategy while automated processes run 24/7 handling talent development and experience.", icon: TrendingUp, stat: "60%", statLabel: "Time saved" },
  { title: "Error-Free Execution", description: "Consistency checks, notifications, and policy enforcement ensure workflows run identically every time.", icon: CheckCircle, stat: "99%", statLabel: "Accuracy" },
  { title: "Scalable Operations", description: "From ten employees to ten thousand. Handle greater complexity without imposing manual workload.", icon: Scale, stat: "10x", statLabel: "Scale ready" },
  { title: "Data-Driven Decisions", description: "Analytics dashboards with aggregated insights guide HR leaders through workforce strategy.", icon: BarChart3, stat: "567%", statLabel: "ROI average" },
];

export default function ProductBenefits() {
  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-10 md:mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">Benefits</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">Unmatched Benefits Across the HR Lifecycle</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Transform HR into an operational hub, making cost centers a thing of the past</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {benefits.slice(0, 3).map((benefit, index) => {
            const Icon = benefit.icon;
            const colors = ["bg-primary", "bg-accent", "bg-secondary"];
            return (
              <motion.div key={benefit.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.1 }} className="md:col-span-2 group">
                <div className={`h-full ${colors[index]} rounded-2xl p-5 sm:p-6 relative overflow-hidden`}>
                  <span className="absolute -right-2 -bottom-4 text-7xl sm:text-8xl font-bold text-white/10 select-none">{benefit.stat}</span>
                  <div className="relative z-10">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-2" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>{benefit.title}</h3>
                    <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-3">{benefit.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl font-bold text-white">{benefit.stat}</span>
                      <span className="text-xs text-white/70">{benefit.statLabel}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {benefits.slice(3, 5).map((benefit, index) => {
            const Icon = benefit.icon;
            const colors = ["bg-destructive", "bg-secondary"];
            return (
              <motion.div key={benefit.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: (index + 3) * 0.1 }} className="md:col-span-3 group">
                <div className={`h-full ${colors[index]} rounded-2xl p-5 sm:p-6 relative overflow-hidden`}>
                  <span className="absolute -right-2 -bottom-4 text-7xl sm:text-8xl font-bold text-white/10 select-none">{benefit.stat}</span>
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-bold text-white mb-2" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>{benefit.title}</h3>
                      <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-3">{benefit.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-bold text-white">{benefit.stat}</span>
                        <span className="text-xs text-white/70">{benefit.statLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
