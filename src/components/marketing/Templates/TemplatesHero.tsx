"use client";
import React from "react";
import { PageHeader } from "@/components/ui/page-header";

export function TemplatesHero() {
  return (
    <PageHeader
      title={[
        { text: "HR Agent ", className: "text-foreground" },
        { text: "Templates", className: "text-destructive" },
      ]}
      description="Deploy Smarter HR Automation in Minutes"
      showAccentLine={true}
      accentLineColor="bg-primary"
    />
  );
}
