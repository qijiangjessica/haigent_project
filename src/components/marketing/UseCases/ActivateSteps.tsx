"use client";
import React from "react";
import { motion } from "framer-motion";

const steps = [
  { number: 1, title: "Connect", description: "Within less than two minutes, you can easily connect your HRIS or ATS to OAuth, without intricate integrations or writing any custom code." },
  { number: 2, title: "Select", description: "Select one of the ready-made workflow templates or create your workflow design with n8n. This flexibility allows HR departments to adapt workflow to actual needs." },
  { number: 3, title: "Launch", description: "Implement safety gates, permission controls and real-time performance monitoring—measure ROI and impact on day one." },
];

export function ActivateSteps() {
  return (
    <section className="bg-background py-16 md:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.3 }} className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">Activate in Three Simple Steps</h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">Haigent.ai is built for speed. It takes companies only minutes to roll out intelligent automation, not months.</p>
        </motion.div>
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-4 relative">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <div className="text-center relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 border-2 bg-secondary text-secondary-foreground border-secondary shadow-lg relative z-10 mx-auto">
                    <span className="text-2xl font-bold">{step.number}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-1/2 h-1 bg-secondary z-0" style={{ width: "calc(100% - 4rem)", transform: "translateX(2rem)" }} />
                  )}
                  <div>
                    <h3 className="text-xl font-bold mb-2 uppercase tracking-wide text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
