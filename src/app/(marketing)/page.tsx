import { BenefitsSection } from "@/components/marketing/Home/BenefitsSection";
import HowItWorks from "@/components/marketing/Home/HowItWorks";
import SecurityGovernance from "@/components/marketing/Home/SecurityGovernance";
import CallToAction from "@/components/marketing/Home/CallToAction";
import { AgentsCarousel } from "@/components/marketing/Home/AgentsCarousel";
import { HeroSection } from "@/components/marketing/Home/HeroSection";
import { IntroSection } from "@/components/marketing/Home/IntroSection";

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <HeroSection />
      <div className="space-y-12 sm:space-y-16 lg:space-y-20">
        <IntroSection />
        <AgentsCarousel />
        <BenefitsSection />
        <HowItWorks />
        <SecurityGovernance />
        <CallToAction />
      </div>
    </main>
  );
}
