"use client";
import React from "react";

export function IntroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-6">
        <div className="relative mx-auto max-w-5xl bg-destructive py-6 sm:py-8 md:py-10 lg:py-12 px-6 sm:px-8 md:px-12 lg:px-16 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 sm:w-48 sm:h-48 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
          <div className="absolute bottom-0 right-0 w-40 h-40 sm:w-56 sm:h-56 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3 blur-2xl" />
          <div className="relative z-10 text-center space-y-4 sm:space-y-5">
            <span className="inline-block rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-1 text-[10px] sm:text-xs font-medium text-white border border-white/25 shadow-sm">
              Why Haigent?
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-white leading-tight px-2 sm:px-0">
              The First Fully-Integrated Digital HR Workforce
            </h2>
            <div className="space-y-4 sm:space-y-5 md:space-y-6 text-sm sm:text-base md:text-lg text-white/90 leading-relaxed max-w-3xl mx-auto">
              <p>
                Welcome to Haigent, the future of HR automation. The business environment today is very busy, and organizations require smarter, faster and efficient means of managing talent. Haigent provides the first enterprise AI agent orchestration platform in the world that transforms the way companies attract, hire and retain top talent.
              </p>
              <p>
                Haigent ensures that all your HR processes are automated, leading to your staff dedicating their time to growth, strategy, and culture. Our platform provides such a digital HR team to deliver tangible outcomes, via workflow automation tools to talent management automation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
