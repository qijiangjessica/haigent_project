"use client";

import { usePathname } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AI_MODULES } from "@/lib/modules";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();

  const activeModule = AI_MODULES.find(
    (m) => m.enabled && pathname.startsWith(`/${m.slug}`)
  );

  const pageTitle = activeModule
    ? `${activeModule.name} Haigent Dashboard`
    : "Haigent Dashboard";

  return (
    <header className="sticky top-0 z-30 h-16 bg-background border-b flex items-center px-4 sm:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden mr-2"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title */}
      <h1 className="text-xl font-semibold flex-1">{pageTitle}</h1>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="w-64 pl-9 bg-muted/50 border-0 focus-visible:ring-brand-teal/20 focus-visible:border-brand-teal"
          />
        </div>

        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-pink rounded-full" />
        </Button>
      </div>
    </header>
  );
}
