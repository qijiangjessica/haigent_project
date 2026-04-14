"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Lock, Settings, ChevronLeft, ChevronDown, ChevronRight } from "lucide-react";
import { AI_MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [referenceOpen, setReferenceOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowTopFade(el.scrollTop > 8);
    setShowBottomFade(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
  }, []);

  useEffect(() => {
    updateFades();
  }, [referenceOpen, updateFades]);

  useEffect(() => {
    if (pathname.startsWith("/reference")) {
      setReferenceOpen(true);
    } else {
      setReferenceOpen(false);
    }
  }, [pathname]);

  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(() => {
    const active = AI_MODULES.find(
      (m) => m.enabled && pathname.startsWith(`/${m.slug}`)
    );
    return active && active.subPages.length > 0
      ? new Set([active.slug])
      : new Set();
  });

  // Auto-expand the active module when the route changes
  useEffect(() => {
    const active = AI_MODULES.find(
      (m) => m.enabled && pathname.startsWith(`/${m.slug}`)
    );
    if (active && active.subPages.length > 0) {
      setExpandedSlugs((prev) => new Set([...prev, active.slug]));
    }
  }, [pathname]);

  const toggle = (slug: string) => {
    setExpandedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

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
          "fixed top-0 left-0 z-40 h-screen bg-brand-charcoal flex flex-col transition-all duration-300 lg:translate-x-0",
          collapsed ? "w-16" : "w-72",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* ── Floating toggle tab — always visible on desktop ── */}
        <button
          onClick={onToggleCollapse}
          className={cn(
            "hidden lg:flex absolute top-[72px] -right-3 z-50",
            "w-6 h-6 rounded-full bg-brand-charcoal border border-white/20",
            "items-center justify-center text-white/60 hover:text-white",
            "shadow-md transition-colors"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>

        {/* Logo */}
        <div className="h-[72px] flex items-center px-3 border-b border-white/5 flex-shrink-0">
          <Link href="/schedule" className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-brand-yellow flex items-center justify-center">
                <span className="text-brand-charcoal font-bold text-xl">H</span>
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-lime rounded-full animate-pulse" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <span className="text-white font-bold text-lg whitespace-nowrap">Haigent</span>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-yellow/80 whitespace-nowrap">
                  AI Platform
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* Primary Nav — AI Agents */}
        <div className="px-3 pt-5 flex-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
            AI Agents
          </p>
          <nav className="space-y-1">
            {AI_MODULES.map((mod) => {
              const Icon = mod.icon;
              const isActive =
                mod.enabled && pathname.startsWith(`/${mod.slug}`);
              const isExpanded = expandedSlugs.has(mod.slug);
              const hasSubPages = mod.subPages.length > 0;

                return (
                  <div
                    key={mod.slug}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/30"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium flex-1">
                      {mod.name}
                    </span>
                    <Lock className="h-3 w-3" />
                  </div>
                );
              }

              if (mod.slug === "reference") {
                return (
                  <div key={mod.slug}>
                    <Link
                      href={`/${mod.slug}`}
                      onClick={() => setReferenceOpen((prev) => !prev)}
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
                      <ChevronDown
                        className={cn(
                          "ml-auto h-3 w-3 transition-transform duration-200",
                          isActive ? "text-brand-charcoal" : "text-white/40",
                          referenceOpen && "rotate-180"
                        )}
                      />
                    </Link>
                    {referenceOpen && (
                      <div className="mt-1 space-y-0.5">
                        {mod.subPages.map((page) => {
                          const isActivePage = pathname === page.path;
                          return (
                            <Link
                              key={page.path}
                              href={page.path}
                              className={cn(
                                "flex items-center gap-3 pl-9 pr-3 py-2 rounded-lg transition-colors text-sm",
                                isActivePage
                                  ? "bg-white/10 text-white"
                                  : "text-white/50 hover:text-white hover:bg-white/5"
                              )}
                            >
                              <Image
                                src={`/icons/${page.icon}.svg`}
                                alt={page.name}
                                width={14}
                                height={14}
                                className="opacity-60"
                              />
                              <span>{page.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={mod.slug}>
                  {/* Module row — button (accordion) or link (no sub-pages) */}
                  {hasSubPages ? (
                    <button
                      onClick={() => toggle(mod.slug)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
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
                      <span className="text-sm font-medium flex-1 text-left">
                        {mod.name}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                      )}
                    </button>
                  ) : (
                    <Link
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
                  )}

                  {/* Accordion sub-pages */}
                  {hasSubPages && isExpanded && (
                    <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-0.5">
                      {mod.subPages.map((page) => {
                        const isActivePage = pathname === page.path;
                        return (
                          <Link
                            key={page.path}
                            href={page.path}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-sm relative",
                              isActivePage
                                ? "bg-white/10 text-white"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                            )}
                          >
                            <Image
                              src={`/icons/${page.icon}.svg`}
                              alt={page.name}
                              width={15}
                              height={15}
                              className="opacity-70 shrink-0"
                            />
                            <span>{page.name}</span>
                            {isActivePage && (
                              <div
                                className={cn(
                                  "absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-l",
                                  `bg-${mod.accentColor}`
                                )}
                              />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/5">
          <Link
            href="/schedule/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors text-sm",
              collapsed ? "justify-center px-2 py-2" : "px-3 py-2"
            )}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
