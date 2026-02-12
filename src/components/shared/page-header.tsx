import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function PageHeader({ title, description, actionLabel, actionHref }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{description}</p>
      </div>
      {actionLabel && actionHref && (
        <Button asChild className="bg-brand-pink hover:bg-brand-pink/90 text-white">
          <Link href={actionHref}>
            <Plus className="h-4 w-4 mr-1" />
            {actionLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}
