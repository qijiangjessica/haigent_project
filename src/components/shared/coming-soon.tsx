import { Lock } from "lucide-react";
import type { AIModule } from "@/types";

interface ComingSoonProps {
  module: AIModule;
}

export function ComingSoon({ module }: ComingSoonProps) {
  const Icon = module.icon;
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className={`w-20 h-20 rounded-2xl bg-${module.accentColor}/10 flex items-center justify-center mb-6`}>
        <Icon className={`h-10 w-10 text-${module.accentColor}`} />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-2">{module.name} Haigent</h1>
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Lock className="h-4 w-4" />
        <span className="text-sm font-medium">Coming Soon</span>
      </div>
      <p className="text-muted-foreground max-w-md">{module.description}</p>
      <p className="text-sm text-muted-foreground/60 mt-6">
        This AI Agent module is under development. Check back soon or contribute to its development.
      </p>
    </div>
  );
}
