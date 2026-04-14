"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ElitePlanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  title: string;
  subtitle: string;
  description: string;
  highlights?: string[];
  highlightsColumns?: 1 | 2;
  onAction?: () => void;
}

export const ElitePlanCard = React.forwardRef<
  HTMLDivElement,
  ElitePlanCardProps
>(
  (
    {
      className,
      imageUrl,
      title,
      subtitle,
      description,
      highlights = [],
      highlightsColumns = 2,
      onAction,
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        transition={{ type: "spring", stiffness: 250, damping: 20 }}
        className={cn(
          "relative w-full max-w-sm overflow-hidden rounded-2xl  bg-card",
          "border border-gray-300 dark:border-border",
          "shadow-[0px_4px_16px_rgba(17,17,26,0.1),_0px_8px_24px_rgba(17,17,26,0.1),_0px_16px_56px_rgba(17,17,26,0.1)]",
          className
        )}
      >
        <motion.div
          className="relative h-64 w-full overflow-hidden "
          transition={{ duration: 0.45 }}
        >
          <Image
            width={1000}
            height={1000}
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-0 h-32 w-full bg-linear-to-t from-muted/50 via-muted/20 to-transparent" />
        </motion.div>

        <div className="relative z-10 p-6  text-foreground backdrop-blur-sm">
          <p className="text-sm uppercase tracking-wider text-secondary font-medium">
            {subtitle}
          </p>
          <h3 className="mt-1 text-2xl font-bold">{title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>

          {highlights.length > 0 && (
            <ul className={cn("mt-4 grid gap-2 text-xs text-muted-foreground", highlightsColumns === 1 ? "grid-cols-1" : "grid-cols-2")}>
              {highlights.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 rounded-md bg-background/50 px-2 py-1"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  {item}
                </li>
              ))}
            </ul>
          )}

          {onAction && (
            <div className="mt-6">
              <Button
                variant="default"
                onClick={onAction}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                Learn More
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);

ElitePlanCard.displayName = "ElitePlanCard";
