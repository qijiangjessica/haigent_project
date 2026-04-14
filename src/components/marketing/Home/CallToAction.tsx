"use client";

import * as React from "react";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CallToAction() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 12 } },
  };

  return (
    <section className="pb-12 sm:pb-16 md:pb-24 lg:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative w-full overflow-hidden rounded-xl border-none bg-gray-400/40 text-card-foreground shadow-lg">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 items-center gap-8 px-8 py-4 md:px-12 md:py-6 lg:px-16 lg:py-8">
            <motion.div
              className="flex flex-col items-start text-left text-foreground space-y-6 lg:space-y-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="space-y-4">
                <motion.h2 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl" variants={itemVariants}>
                  See It in Action
                </motion.h2>
                <motion.p className="max-w-xl text-lg text-muted-foreground" variants={itemVariants}>
                  Ready to transform your HR operations? Book a personalized demo or calculate your ROI.
                </motion.p>
              </div>
              <motion.div className="flex flex-col w-full sm:w-auto gap-4" variants={itemVariants}>
                <Button asChild size="lg" className="h-12 w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 shadow-md">
                  <Link href="/demo">
                    Book a Live Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 w-full sm:w-auto border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground">
                  <Link href="/schedule">
                    Try the Schedule App
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
            <motion.div
              className="relative h-64 lg:h-96 w-full flex items-center justify-center lg:justify-end"
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="relative h-full w-full max-w-[500px]">
                <Image src="/all_robo.png" alt="Haigents in Action" fill className="object-contain object-center lg:object-right" priority />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
