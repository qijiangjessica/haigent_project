"use client";

import { motion } from "framer-motion";
import { SvgIcon } from "@/components/ui/svg-icon";

const features = [
  { title: "Intelligent Workflow Automation", description: "Visual workflow engine that allows HR teams to create, execute, and scale complex workflows without writing code.", highlight: "Digital HR Team with lower overheads", iconName: "workflow-process" },
  { title: "Modular AI Agents", description: "Network of special agents dealing with different HR activities, collaborating in a central orchestration layer.", highlight: "Self-educated & autonomous", iconName: "collaborative-team" },
  { title: "Predictive Analytics", description: "Dashboards that track trends, predict bottlenecks, and monitor important HR indicators in real-time.", highlight: "Data-driven decisions", iconName: "analytics-dashboard" },
];

export default function ProductFeatures() {
  return (
    <section className="py-10 md:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-10 lg:mb-10"
        >
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">Product Features</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">Comprehensive Features That Redefine HR</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Much more than merely task automation</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="md:col-span-2 relative overflow-hidden rounded-2xl bg-primary p-6 sm:p-8 shadow-lg">
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center mb-4">
                <SvgIcon name={features[0].iconName} size={24} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-2">{features[0].title}</h3>
              <p className="text-primary-foreground/80 mb-4 max-w-md">{features[0].description}</p>
              <span className="inline-block px-3 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground text-sm font-medium">{features[0].highlight}</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }} className="relative overflow-hidden rounded-2xl bg-accent p-6 sm:p-8 shadow-lg">
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <SvgIcon name={features[1].iconName} size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>{features[1].title}</h3>
              <p className="text-white/90 text-sm mb-4" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>{features[1].description}</p>
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium">{features[1].highlight}</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }} className="md:col-span-3 relative overflow-hidden rounded-2xl bg-secondary p-6 sm:p-8 shadow-lg">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary-foreground/20 flex items-center justify-center shrink-0">
                  <SvgIcon name={features[2].iconName} size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-secondary-foreground mb-1">{features[2].title}</h3>
                  <p className="text-secondary-foreground/80 text-sm max-w-lg">{features[2].description}</p>
                </div>
              </div>
              <span className="inline-block px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold whitespace-nowrap">{features[2].highlight}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
