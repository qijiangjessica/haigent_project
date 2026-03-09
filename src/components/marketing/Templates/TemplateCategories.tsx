"use client";
import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SvgIcon } from "@/components/ui/svg-icon";

type Category = {
  id: string;
  name: string;
  iconName: string;
  count: number;
};

const categories: Category[] = [
  { id: "all", name: "All Templates", iconName: "HR", count: 24 },
  { id: "scheduling", name: "Scheduling", iconName: "workflow-process", count: 4 },
  { id: "sourcing", name: "Sourcing", iconName: "talent-search", count: 5 },
  { id: "onboarding", name: "Onboarding", iconName: "user-profile-icon", count: 4 },
  { id: "benefits", name: "Benefits", iconName: "user-checklist", count: 3 },
  { id: "payroll", name: "Payroll", iconName: "salary-management", count: 4 },
  { id: "reference", name: "Reference Check", iconName: "verify-compliance", count: 4 },
];

type TemplateCategoriesProps = {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
};

export function TemplateCategories({
  activeCategory,
  onCategoryChange,
}: TemplateCategoriesProps) {
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeButton = buttonRefs.current[activeCategory];
    if (activeButton && containerRef.current) {
      activeButton.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

      const updateSliderPosition = () => {
        if (activeButton && containerRef.current) {
          setSliderStyle({ left: activeButton.offsetLeft, width: activeButton.offsetWidth });
        }
      };

      updateSliderPosition();
      const timeoutId = setTimeout(updateSliderPosition, 300);
      const handleScroll = () => updateSliderPosition();
      containerRef.current.addEventListener("scroll", handleScroll);

      return () => {
        clearTimeout(timeoutId);
        if (containerRef.current) {
          containerRef.current.removeEventListener("scroll", handleScroll);
        }
      };
    }
  }, [activeCategory]);

  return (
    <section className="bg-muted/20 py-4 md:py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div
            ref={containerRef}
            className="relative inline-flex items-center gap-2 md:gap-3 rounded-full dark:bg-card/60 p-2 backdrop-blur-md border border-border dark:border-border/60 overflow-x-auto overflow-y-hidden max-w-full md:max-w-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] transition-shadow duration-300"
          >
            <div
              className="absolute h-[calc(100%-0.5rem)] rounded-full bg-destructive z-0"
              style={{ left: sliderStyle.left, width: sliderStyle.width, top: "0.25rem" }}
            />

            {categories.map((category) => {
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  ref={(el) => { buttonRefs.current[category.id] = el; }}
                  onClick={() => onCategoryChange(category.id)}
                  className={cn(
                    "relative z-10 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-colors shrink-0",
                    "hover:text-destructive",
                    isActive ? "text-destructive-foreground" : "text-foreground"
                  )}
                >
                  <SvgIcon name={category.iconName} size={16} alt={category.name} className="w-4 h-4 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{category.name}</span>
                  <span className="text-xs opacity-70 shrink-0">({category.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
