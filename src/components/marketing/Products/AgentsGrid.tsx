"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface Agent {
  name: string;
  slug: string;
  role: string;
  description: string;
  videoSrc: string;
}

const agents: Agent[] = [
  { name: "Schedule Haigent", slug: "schedule-haigent", role: "Intelligent Interview Scheduling", description: "Eliminate scheduling friction with AI-powered coordination. Automatically finds optimal times, sends invites, and handles rescheduling while reducing time-to-hire by 40%.", videoSrc: "/animations/1/Idle.mp4" },
  { name: "Sourcing Haigent", slug: "sourcing-haigent", role: "Intelligent Talent Discovery", description: "Increase qualified candidates by 65% with AI sourcing. Search multiple channels, identify high-potential talent, and build your pipeline faster with automated outreach.", videoSrc: "/animations/2/Idle.mp4" },
  { name: "Reference Check Haigent", slug: "reference-check-haigent", role: "Automated Reference Verification", description: "Complete reference checks 70% faster with automated insights. Structured questionnaires, intelligent response collection, and data-driven insight generation.", videoSrc: "/animations/3/Idle.mp4" },
  { name: "Onboarding Haigent", slug: "onboarding-haigent", role: "Turn New Hires into Top Performers", description: "Reduce onboarding time by 60% and increase retention by 35%. Automate document collection, task-driven orientation, and manager integration from day one.", videoSrc: "/animations/4/Idle.mp4" },
  { name: "Benefits Haigent", slug: "benefits-haigent", role: "Transformative Benefits for Modern HR", description: "Reduce administrative burden by 45% with AI automation. Streamlined workflows, smarter candidate matching, and real-time process visibility for HR productivity.", videoSrc: "/animations/5/Idle.mp4" },
  { name: "Payroll Haigent", slug: "payroll-haigent", role: "Intelligent Payroll Automation", description: "Reduce payroll efforts by 55% while minimizing errors. AI-driven data integration, automated calculations, compliance engine, and secure disbursements.", videoSrc: "/animations/6/Idle.mp4" },
  { name: "Engee Haigent", slug: "engee-haigent", role: "AI-Powered Employee Engagement", description: "Build stronger employee connections 60% faster. Smart onboarding, AI interest mapping, automated 1-on-1 scheduling, and continuous engagement intelligence.", videoSrc: "/animations/7/Idle.mp4" },
];

export default function AgentsGrid() {
  return (
    <section className="py-10 sm:py-12 md:py-16 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-12 md:mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Modular AI Agents for Every HR Function
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            All agents separately deal with different HR activities and collaborate in a central orchestration layer.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="h-full"
            >
              <Link
                href={`/products/${agent.slug}`}
                className="flex flex-col h-full rounded-2xl border border-gray-300 bg-background shadow-lg overflow-hidden hover:border-primary hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-full h-[200px] bg-muted/20 relative overflow-hidden flex-shrink-0">
                  <video
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    src={agent.videoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    aria-label={`${agent.name} animation`}
                  />
                </div>
                <div className="flex flex-col flex-grow p-5 bg-background">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary mb-1 line-clamp-1">{agent.role}</p>
                  <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-grow">{agent.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
