"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Lock, Settings, ChevronLeft } from "lucide-react";
import { AI_MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const activeModule = AI_MODULES.find(
    (m) => m.enabled && pathname.startsWith(`/${m.slug}`)
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-72 bg-brand-charcoal flex flex-col transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center px-5 border-b border-white/5">
          <Link href="/schedule" className="flex items-center gap-3 flex-1">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-brand-gold flex items-center justify-center">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-green rounded-full animate-pulse" />
            </div>
            <div>
              <span className="text-white font-bold text-lg">Haigent</span>
              <p
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider",
                  activeModule?.accentColor === "brand-gold"
                    ? "text-brand-gold"
                    : "text-brand-pink"
                )}
              >
                AI Platform
              </p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white hidden lg:block"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Primary Nav — AI Agents */}
        <div className="px-3 pt-5">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
            AI Agents
          </p>
          <nav className="space-y-1">
            {AI_MODULES.map((mod) => {
              const Icon = mod.icon;
              const isActive =
                mod.enabled && pathname.startsWith(`/${mod.slug}`);

              if (!mod.enabled) {
                return (
                  <Link
                    key={mod.slug}
                    href={`/${mod.slug}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/30 cursor-pointer"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium flex-1">
                      {mod.name}
                    </span>
                    <Lock className="h-3 w-3" />
                  </Link>
                );
              }

              return (
                <Link
                  key={mod.slug}
                  href={`/${mod.slug}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? `bg-${mod.accentColor} text-brand-charcoal font-semibold`
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isActive && "scale-110"
                    )}
                  />
                  <span className="text-sm font-medium">{mod.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-charcoal" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Divider */}
        <div className="mx-3 my-4 border-t border-white/5" />

        {/* Secondary Nav — Module Sub-pages */}
        {activeModule && activeModule.subPages.length > 0 && (
          <div className="px-3">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
              {activeModule.name}
            </p>
            <nav className="space-y-1">
              {activeModule.subPages.map((page) => {
                const isActivePage = pathname === page.path;
                return (
                  <Link
                    key={page.path}
                    href={page.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm relative",
                      isActivePage
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Image
                      src={`/icons/${page.icon}.svg`}
                      alt={page.name}
                      width={18}
                      height={18}
                      className="opacity-70"
                    />
                    <span>{page.name}</span>
                    {isActivePage && (
                      <div
                        className={cn(
                          "absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-l",
                          `bg-${activeModule.accentColor}`
                        )}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/5">
          <Link
            href="/schedule/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors text-sm"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
