"use client";

import { useState } from "react";
import { TemplatesHero } from "@/components/marketing/Templates/TemplatesHero";
import { TemplatesIntro } from "@/components/marketing/Templates/TemplatesIntro";
import { TemplateCategories } from "@/components/marketing/Templates/TemplateCategories";
import { TemplatesGrid } from "@/components/marketing/Templates/TemplatesGrid";
import { TemplatesCTA } from "@/components/marketing/Templates/TemplatesCTA";

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  return (
    <>
      <TemplatesHero />
      <TemplatesIntro />
      <TemplateCategories activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      <TemplatesGrid activeCategory={activeCategory} />
      <TemplatesCTA />
    </>
  );
}
