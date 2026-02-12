import { ComingSoon } from "@/components/shared/coming-soon";
import { AI_MODULES } from "@/lib/modules";

export default function EngeePage() {
  const module = AI_MODULES.find((m) => m.slug === "engee")!;
  return <ComingSoon module={module} />;
}
