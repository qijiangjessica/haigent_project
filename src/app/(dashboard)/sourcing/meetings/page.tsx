import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function MeetingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings"
        description="View booked meetings from sourcing outreach"
      />

      <EmptyState
        title="No meetings booked yet"
        description="Meetings will appear here once candidates respond to outreach and schedule a call."
        actionLabel="View Outreach"
        actionHref="/sourcing/outreach"
      />
    </div>
  );
}
