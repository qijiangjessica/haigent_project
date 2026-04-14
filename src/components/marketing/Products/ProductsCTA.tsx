"use client";

import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ProductsCTA() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
  };
  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 12 } },
  };

  return (
    <section className="py-12 sm:py-16 md:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow">
          <div className="absolute inset-0">
            <Image src="/all_robo.png" alt="Background" fill className="object-contain" priority />
          </div>
          <div className="absolute inset-0 bg-black/30" />
          <motion.div
            className="relative z-10 grid h-full grid-cols-1 items-center gap-8 p-8 md:grid-cols-2 md:p-12 lg:p-16"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="flex flex-col items-start text-left text-white">
              <motion.h2 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl" variants={itemVariants}>
                Ready to Elevate Your HR Operations?
              </motion.h2>
              <motion.p className="mt-4 max-w-xl text-lg text-neutral-200" variants={itemVariants}>
                Join progressive companies that view HR as a strategic force.
              </motion.p>
            </div>
            <motion.div className="flex w-full max-w-md flex-col items-center justify-center gap-3 sm:flex-row" variants={itemVariants}>
              <Button asChild size="lg" className="h-12 w-full sm:w-auto bg-accent text-black hover:bg-accent/90">
                <Link href="/schedule">Try Schedule App <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 w-full sm:w-auto border-white/20 bg-secondary text-white hover:bg-secondary/90 hover:text-white">
                <Link href="/demo">Book Live Demo <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
