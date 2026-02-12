import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function OutreachPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Outreach"
        description="Track AI-powered outreach campaigns and response rates"
      />

      <EmptyState
        title="No outreach campaigns yet"
        description="Outreach messages will be sent automatically once candidates are qualified for active roles."
        actionLabel="View Roles"
        actionHref="/sourcing/roles"
      />
    </div>
  );
}
