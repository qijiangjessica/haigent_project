"use client";

import { Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface QuickAction {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface HeroBannerProps {
  title: string;
  subtitle: string;
  bgColor: string;
  badgeColor: string;
  badgeText?: string;
  quickActions?: QuickAction[];
}

export function HeroBanner({
  title,
  subtitle,
  bgColor,
  badgeColor,
  badgeText = "AI-Powered",
  quickActions,
}: HeroBannerProps) {
  return (
    <div className={`${bgColor} rounded-xl p-6 sm:p-8`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
            <span className={`${badgeColor} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
              {badgeText}
            </span>
          </div>
          <p className="text-white/80 text-sm sm:text-base">{subtitle}</p>
        </div>
        {quickActions && quickActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className={`${badgeColor === "bg-brand-pink" ? "bg-brand-teal" : "bg-brand-pink"} text-brand-charcoal font-semibold hover:opacity-90`}>
                <Plus className="h-4 w-4 mr-1" />
                Quick Actions
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {quickActions.map((action) => (
                <DropdownMenuItem key={action.href} asChild>
                  <Link href={action.href} className="flex items-center gap-2">
                    {action.icon}
                    {action.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
