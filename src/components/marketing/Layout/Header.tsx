"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MenuToggleIcon } from "@/components/menu-toggle-icon";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { LucideIcon } from "lucide-react";
import { products } from "@/data/products";
import Link from "next/link";

type LinkItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  iconName?: string;
  description?: string;
};

import Image from "next/image";
import { createPortal } from "react-dom";
import { SvgIcon } from "@/components/ui/svg-icon";

export function Header() {
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(10);

  React.useEffect(() => {
    if (open) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn("sticky top-0 z-50 w-full border-b border-transparent", {
        "bg-background/95 supports-backdrop-filter:bg-background/50 border-border backdrop-blur-lg":
          scrolled,
      })}
    >
      <nav className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-5">
          <Link href="/" className="rounded-md p-2">
            <Image
              src="/Logo_simple_black.png"
              alt="Haigent"
              width={100}
              height={100}
            />
          </Link>
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent hover:bg-destructive! text-sm lg:text-base">
                  Products
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background p-1 pr-1.5">
                  <div className="p-3 w-[85vw] sm:w-[500px] md:w-[600px] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">AI Agent Suite</h3>
                        <p className="text-sm text-muted-foreground">
                          Purpose-built agents across the HR lifecycle
                        </p>
                      </div>
                      <Link
                        href="/products"
                        className="text-xs font-semibold text-destructive hover:underline"
                      >
                        View all
                      </Link>
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {products.map((item) => {
                        const iconMap: Record<string, string> = {
                          "schedule-haigent": "checklist",
                          "sourcing-haigent": "talent-search",
                          "reference-check-haigent": "verify-compliance",
                          "onboarding-haigent": "sync-profile",
                          "benefits-haigent": "organization",
                          "payroll-haigent": "salary-management",
                          "engee-haigent": "user-communication",
                        };
                        return (
                          <li key={item.slug}>
                            <ProductMenuCard
                              title={item.name}
                              href={`/products/${item.slug}`}
                              description={item.hero.subtitle}
                              iconName={iconMap[item.slug] || "hr-office"}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuLink className="px-3 lg:px-4" asChild>
                <Link href="/use-cases" className="hover:bg-destructive rounded-md p-2 text-sm lg:text-base">
                  Use Cases
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink className="px-3 lg:px-4" asChild>
                <Link href="/templates" className="hover:bg-destructive rounded-md p-2 text-sm lg:text-base">
                  Templates
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink className="px-3 lg:px-4" asChild>
                <Link href="/company" className="hover:bg-destructive rounded-md p-2 text-sm lg:text-base">
                  Company
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink className="px-3 lg:px-4" asChild>
                <Link href="/terms" className="hover:bg-destructive rounded-md p-2 text-sm lg:text-base">
                  Terms
                </Link>
              </NavigationMenuLink>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="outline" className="cursor-pointer text-sm lg:text-base bg-primary! text-foreground!">
            <Link href="/demo">Book Live Demo</Link>
          </Button>
          <Button
            asChild
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer text-sm lg:text-base"
            style={{ textShadow: "0 1px 2px rgba(255,255,255,0.5)" }}
          >
            <Link href="/schedule">Try Schedule App</Link>
          </Button>
        </div>
        <div className="flex gap-2 items-center md:hidden">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Toggle menu"
          >
            <MenuToggleIcon open={open} className="size-5" duration={300} />
          </Button>
        </div>
      </nav>
      <MobileMenu open={open} className="flex flex-col justify-between gap-2 overflow-y-auto">
        <NavigationMenu className="max-w-full">
          <div className="flex w-full flex-col gap-y-2">
            <Link href="/" className="hover:bg-destructive rounded-md p-2">Home</Link>
            <span className="text-sm font-semibold">Products</span>
            {products.map((product) => {
              const iconMap: Record<string, string> = {
                "schedule-haigent": "checklist",
                "sourcing-haigent": "talent-search",
                "reference-check-haigent": "verify-compliance",
                "onboarding-haigent": "sync-profile",
                "benefits-haigent": "organization",
                "payroll-haigent": "salary-management",
                "engee-haigent": "user-communication",
              };
              return (
                <ListItem
                  key={product.slug}
                  title={product.name}
                  description={product.hero.subtitle}
                  href={`/products/${product.slug}`}
                  iconName={iconMap[product.slug] || "hr-office"}
                />
              );
            })}
            <NavigationMenuLink href="/use-cases" className="hover:bg-destructive rounded-md p-2">Use Cases</NavigationMenuLink>
            <NavigationMenuLink href="/templates" className="hover:bg-destructive rounded-md p-2">Templates</NavigationMenuLink>
            <NavigationMenuLink href="/company" className="hover:bg-destructive rounded-md p-2">Company</NavigationMenuLink>
            <NavigationMenuLink href="/terms" className="hover:bg-destructive rounded-md p-2">Terms</NavigationMenuLink>
          </div>
        </NavigationMenu>
        <div className="flex flex-col gap-2">
          <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            <Link href="/demo">Book Live Demo</Link>
          </Button>
          <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/schedule">Try Schedule App</Link>
          </Button>
        </div>
      </MobileMenu>
    </header>
  );
}

type MobileMenuProps = React.ComponentProps<"div"> & { open: boolean };

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
  if (!open || typeof window === "undefined") return null;
  return createPortal(
    <div
      id="mobile-menu"
      className={cn(
        "bg-background/95 supports-backdrop-filter:bg-background/50 backdrop-blur-lg",
        "fixed top-14 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-y md:hidden"
      )}
    >
      <div
        data-slot={open ? "open" : "closed"}
        className={cn("data-[slot=open]:animate-in data-[slot=open]:zoom-in-97 ease-out", "size-full p-4", className)}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

function ListItem({ title, description, icon: Icon, iconName, className, href, ...props }: React.ComponentProps<typeof NavigationMenuLink> & LinkItem) {
  return (
    <NavigationMenuLink
      className={cn("w-full flex flex-row gap-x-2 hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground rounded-sm p-2", className)}
      {...props}
      asChild
    >
      <a href={href}>
        <div className="bg-background/40 flex aspect-square size-12 items-center justify-center rounded-md border shadow-sm shrink-0">
          {iconName ? <SvgIcon name={iconName} size={24} /> : Icon && <Icon className="text-foreground size-5" />}
        </div>
        <div className="flex flex-col items-start justify-center">
          <span className="font-medium">{title}</span>
          <span className="text-muted-foreground text-xs line-clamp-2">{description}</span>
        </div>
      </a>
    </NavigationMenuLink>
  );
}

function ProductMenuCard({ title, description, href, iconName }: { title: string; description: string; href: string; iconName?: string }) {
  return (
    <Link href={href} className="block group rounded-lg border border-border/60 bg-muted/50 p-3 transition hover:-translate-y-0.5 hover:border-destructive hover:bg-destructive/50 hover:shadow-md h-full">
      <div className="flex items-start gap-3">
        {iconName && (
          <div className="bg-background/40 flex aspect-square size-10 items-center justify-center rounded-md border shadow-sm shrink-0 group-hover:bg-background/60 transition-colors">
            <SvgIcon name={iconName} size={20} />
          </div>
        )}
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground group-hover:text-white transition-colors">{title}</div>
          <div className="mt-1 text-xs text-muted-foreground group-hover:text-white/90 line-clamp-1 transition-colors">{description}</div>
          <div className="mt-2 text-[10px] font-semibold text-destructive group-hover:text-white/80 transition-colors">View details →</div>
        </div>
      </div>
    </Link>
  );
}

function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false);
  const onScroll = React.useCallback(() => { setScrolled(window.scrollY > threshold); }, [threshold]);
  React.useEffect(() => { window.addEventListener("scroll", onScroll); return () => window.removeEventListener("scroll", onScroll); }, [onScroll]);
  React.useEffect(() => { onScroll(); }, [onScroll]);
  return scrolled;
}
