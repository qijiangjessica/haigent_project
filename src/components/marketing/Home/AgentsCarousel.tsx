"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type AgentSlide = {
  name: string;
  slug: string;
  role: string;
  description: string;
  videoSrc: string;
};

const AGENT_SLIDES: AgentSlide[] = [
  {
    name: "Schedule Haigent",
    slug: "schedule-haigent",
    role: "Intelligent Interview Scheduling",
    description: "Eliminate scheduling friction with AI-powered coordination. Automatically finds optimal times, sends invites, and handles rescheduling while reducing time-to-hire by 40%.",
    videoSrc: "/animations/1/Idle.mp4",
  },
  {
    name: "Sourcing Haigent",
    slug: "sourcing-haigent",
    role: "Intelligent Talent Discovery",
    description: "Increase qualified candidates by 65% with AI sourcing. Search multiple channels, identify high-potential talent, and build your pipeline faster with automated outreach.",
    videoSrc: "/animations/2/Idle.mp4",
  },
  {
    name: "Reference Check Haigent",
    slug: "reference-check-haigent",
    role: "Automated Reference Verification",
    description: "Complete reference checks 70% faster with automated insights. Structured questionnaires, intelligent response collection, and data-driven insight generation.",
    videoSrc: "/animations/3/Idle.mp4",
  },
  {
    name: "Onboarding Haigent",
    slug: "onboarding-haigent",
    role: "Turn New Hires into Top Performers",
    description: "Reduce onboarding time by 60% and increase retention by 35%. Automate document collection, task-driven orientation, and manager integration from day one.",
    videoSrc: "/animations/4/Idle.mp4",
  },
  {
    name: "Benefits Haigent",
    slug: "benefits-haigent",
    role: "Transformative Benefits for Modern HR",
    description: "Reduce administrative burden by 45% with AI automation. Streamlined workflows, smarter candidate matching, and real-time process visibility for HR productivity.",
    videoSrc: "/animations/5/Idle.mp4",
  },
  {
    name: "Payroll Haigent",
    slug: "payroll-haigent",
    role: "Intelligent Payroll Automation",
    description: "Reduce payroll efforts by 55% while minimizing errors. AI-driven data integration, automated calculations, compliance engine, and secure disbursements.",
    videoSrc: "/animations/6/Idle.mp4",
  },
  {
    name: "Engee Haigent",
    slug: "engee-haigent",
    role: "AI-Powered Employee Engagement",
    description: "Build stronger employee connections 60% faster. Smart onboarding, AI interest mapping, automated 1-on-1 scheduling, and continuous engagement intelligence.",
    videoSrc: "/animations/7/Idle.mp4",
  },
];

const AUTO_ADVANCE_MS = 7000;
const SWIPE_THRESHOLD = 50;

export function AgentsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const startXRef = useRef<number | null>(null);
  const endXRef = useRef<number | null>(null);
  const autoAdvanceRef = useRef<number | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const goNext = useCallback(() => setActiveIndex((prev) => (prev + 1) % AGENT_SLIDES.length), []);
  const goPrev = useCallback(() => setActiveIndex((prev) => (prev - 1 + AGENT_SLIDES.length) % AGENT_SLIDES.length), []);
  const goToSlide = useCallback((index: number) => setActiveIndex((index + AGENT_SLIDES.length) % AGENT_SLIDES.length), []);

  useEffect(() => {
    autoAdvanceRef.current = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % AGENT_SLIDES.length);
    }, AUTO_ADVANCE_MS);
    return () => { if (autoAdvanceRef.current) window.clearInterval(autoAdvanceRef.current); };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => { startXRef.current = e.touches[0]?.clientX ?? null; endXRef.current = null; }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => { endXRef.current = e.touches[0]?.clientX ?? null; }, []);
  const handleTouchEnd = useCallback(() => {
    if (startXRef.current === null || endXRef.current === null) return;
    const distance = startXRef.current - endXRef.current;
    if (distance > SWIPE_THRESHOLD) goNext();
    else if (distance < -SWIPE_THRESHOLD) goPrev();
    startXRef.current = null; endXRef.current = null;
  }, [goNext, goPrev]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => { setIsDragging(true); startXRef.current = e.clientX; endXRef.current = null; e.preventDefault(); }, []);
  const handleMouseMove = useCallback((e: React.MouseEvent) => { if (!isDragging) return; endXRef.current = e.clientX; }, [isDragging]);
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (startXRef.current === null || endXRef.current === null) { startXRef.current = null; endXRef.current = null; return; }
    const distance = startXRef.current - endXRef.current;
    if (distance > SWIPE_THRESHOLD) goNext();
    else if (distance < -SWIPE_THRESHOLD) goPrev();
    startXRef.current = null; endXRef.current = null;
  }, [isDragging, goNext, goPrev]);
  const handleMouseLeave = useCallback(() => { if (isDragging) { setIsDragging(false); startXRef.current = null; endXRef.current = null; } }, [isDragging]);

  const getCardStyle = useCallback((index: number) => {
    const diff = index - activeIndex;
    const totalSlides = AGENT_SLIDES.length;
    let normalizedDiff = diff;
    if (diff > totalSlides / 2) normalizedDiff = diff - totalSlides;
    else if (diff < -totalSlides / 2) normalizedDiff = diff + totalSlides;

    if (isMobile) {
      if (normalizedDiff === 0) return { transform: "translateX(-50%) scale(1)", zIndex: 30, opacity: 1, left: "50%" };
      if (normalizedDiff === 1) return { transform: "translateX(20%) scale(0.8)", zIndex: 20, opacity: 0.4, left: "50%" };
      if (normalizedDiff === -1) return { transform: "translateX(-120%) scale(0.8)", zIndex: 20, opacity: 0.4, left: "50%" };
      return { transform: "translateX(-50%) scale(0.5)", zIndex: 0, opacity: 0, left: "50%" };
    }

    if (normalizedDiff === 0) return { transform: "translateX(-50%) translateY(0) scale(1)", zIndex: 30, opacity: 1, left: "50%" };
    if (normalizedDiff === 1) return { transform: "translateX(10%) translateY(0) scale(0.75)", zIndex: 20, opacity: 0.7, left: "50%" };
    if (normalizedDiff === -1) return { transform: "translateX(-110%) translateY(0) scale(0.75)", zIndex: 20, opacity: 0.7, left: "50%" };
    return { transform: "translateX(-50%) translateY(0) scale(0.5)", zIndex: 0, opacity: 0, left: "50%" };
  }, [activeIndex, isMobile]);

  return (
    <section className="overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 lg:px-8 overflow-x-hidden">
        <div className="text-center mb-6 sm:mb-8 md:mb-10 flex flex-col items-center justify-center">
          <p className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-2">AI Agents in Action</p>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-3 px-4">Meet your new digital teammates</h2>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-2xl mx-auto px-4 leading-relaxed">
            The intelligence agent coordination at Haigent.ai delivers a set of intelligent agents coordinating all HR processes, including recruitment, training, retention, and training.
          </p>
        </div>

        <div className="relative h-[320px] sm:h-[430px] md:h-[480px] lg:h-[480px] xl:h-[520px] mb-4 sm:mb-6">
          <button onClick={goPrev} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-background transition-colors" aria-label="Previous agent">
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button onClick={goNext} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-background transition-colors" aria-label="Next agent">
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div
            className="relative w-full h-full touch-pan-y overflow-visible select-none cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {AGENT_SLIDES.map((agent, index) => {
              const cardStyle = getCardStyle(index);
              const isActive = index === activeIndex;
              return (
                <div
                  key={agent.name}
                  className="absolute top-2 sm:top-4 md:top-6 lg:top-8 transition-all duration-500 ease-out will-change-transform"
                  style={{ ...cardStyle, pointerEvents: isActive ? "auto" : "none" }}
                  onClick={() => !isActive && goToSlide(index)}
                  aria-hidden={!isActive}
                >
                  <Link
                    href={`/products/${agent.slug}`}
                    className="w-[240px] h-[280px] sm:w-[320px] sm:h-[380px] md:w-[360px] md:h-[420px] lg:w-[360px] lg:h-[420px] xl:w-[400px] xl:h-[460px] rounded-2xl border border-gray-300 bg-background backdrop-blur-md shadow-[0_18px_45px_rgba(15,23,42,0.35)] overflow-hidden flex flex-col hover:border-primary hover:shadow-[0_18px_45px_rgba(15,23,42,0.5)] transition-all duration-300"
                  >
                    <div className="w-full relative h-[120px] sm:h-[180px] md:h-[220px] lg:h-[220px] xl:h-[250px] bg-muted/20">
                      {Math.abs(index - activeIndex) <= 1 || Math.abs(index - activeIndex) >= AGENT_SLIDES.length - 1 ? (
                        <video className="w-full h-full object-contain" src={agent.videoSrc} autoPlay loop muted playsInline aria-label={`${agent.name} animation`} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">Loading...</div>
                      )}
                    </div>
                    <div className="w-full p-4 sm:p-6 md:p-8 flex-1 flex flex-col justify-center bg-background min-h-0 overflow-hidden">
                      <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary mb-1.5 sm:mb-2 line-clamp-1">{agent.role}</p>
                      <h3 className="text-lg sm:text-2xl md:text-3xl font-semibold text-foreground mb-1.5 sm:mb-3 line-clamp-2">{agent.name}</h3>
                      <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-3">{agent.description}</p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center gap-1.5 sm:gap-2">
          {AGENT_SLIDES.map((agent, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={agent.name}
                type="button"
                onClick={() => goToSlide(index)}
                className={`relative h-2 sm:h-2.5 rounded-full overflow-hidden transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isActive ? "w-6 sm:w-8 bg-primary" : "w-2 sm:w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
                aria-label={`Show ${agent.name}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
