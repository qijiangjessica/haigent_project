import { ComingSoon } from "@/components/shared/coming-soon";
import { AI_MODULES } from "@/lib/modules";

export default function ReferencePage() {
  const module = AI_MODULES.find((m) => m.slug === "reference")!;
  return <ComingSoon module={module} />;
}
