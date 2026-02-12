import { ComingSoon } from "@/components/shared/coming-soon";
import { AI_MODULES } from "@/lib/modules";

export default function BenefitsPage() {
  const module = AI_MODULES.find((m) => m.slug === "benefits")!;
  return <ComingSoon module={module} />;
}
