import { ComingSoon } from "@/components/shared/coming-soon";
import { AI_MODULES } from "@/lib/modules";

export default function OnboardingPage() {
  const module = AI_MODULES.find((m) => m.slug === "onboarding")!;
  return <ComingSoon module={module} />;
}
