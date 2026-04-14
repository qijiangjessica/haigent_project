"use client";
import React from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";

const footerLinks = [
  {
    title: "Products",
    links: [
      { href: "/products/schedule-haigent", label: "Schedule Haigent" },
      { href: "/products/sourcing-haigent", label: "Sourcing Haigent" },
      { href: "/products/reference-check-haigent", label: "Reference Check Haigent" },
      { href: "/products/onboarding-haigent", label: "Onboarding Haigent" },
      { href: "/products/benefits-haigent", label: "Benefits Haigent" },
      { href: "/products/payroll-haigent", label: "Payroll Haigent" },
      { href: "/products/engee-haigent", label: "Engee Haigent" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/company", label: "About Us" },
      { href: "/use-cases", label: "Use Cases" },
      { href: "/templates", label: "Templates" },
      { href: "/demo", label: "Book a Demo" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/terms", label: "Privacy Policy" },
    ],
  },
];

const socialLinks = [
  {
    href: "https://www.linkedin.com/company/procogia/",
    label: "LinkedIn",
    svg: (
      <svg role="img" viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    href: "https://www.youtube.com/@procogia",
    label: "YouTube",
    svg: (
      <svg role="img" viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="bg-destructive border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="pt-12 pb-8">
          <Link href="/" className=" rounded-md p-2">
            <Image
              src="/Logo_simple_black.png"
              alt="Haigent"
              width={100}
              height={100}
            />
          </Link>
          <p className="text-sm text-white/70 max-w-md">
            Enterprise-grade AI agent orchestration for HR and recruiting.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 py-8">
          {footerLinks.map((item, i) => (
            <div key={i}>
              <h3 className="mb-4 text-xs font-semibold text-white uppercase tracking-wider">
                {item.title}
              </h3>
              <ul className="space-y-2 text-white/70 text-sm">
                {item.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="h-px bg-border" />

        <div className="py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 items-center">
            {socialLinks.map(({ svg, href, label }, i) => (
              <Link
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={
                  buttonVariants({
                    variant: "outline",
                    size: "icon",
                  }) +
                  " border-border bg-background hover:bg-primary hover:border-primary/50 text-foreground/70 hover:text-white transition-colors"
                }
                key={i}
              >
                {svg}
              </Link>
            ))}
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="text-center text-xs text-white/70 py-4">
          <p>© 2025 Haigent.ai, a division of ProCogia. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
