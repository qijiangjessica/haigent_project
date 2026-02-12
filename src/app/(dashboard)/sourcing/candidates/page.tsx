import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function SourcingCandidatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sourced Candidates"
        description="AI-sourced candidates across all active roles"
      />

      <EmptyState
        title="No candidates sourced yet"
        description="Once sourcing begins for active roles, AI-qualified candidates will appear here."
        actionLabel="View Roles"
        actionHref="/sourcing/roles"
      />
    </div>
  );
}
