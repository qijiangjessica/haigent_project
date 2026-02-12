import { ComingSoon } from "@/components/shared/coming-soon";
import { AI_MODULES } from "@/lib/modules";

export default function PayrollPage() {
  const module = AI_MODULES.find((m) => m.slug === "payroll")!;
  return <ComingSoon module={module} />;
}
