import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { INTERVIEWS } from "@/data/schedule/interviews";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function InterviewsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Interviews"
        description="Track all scheduled and completed interviews"
      />

      {INTERVIEWS.length === 0 ? (
        <EmptyState
          title="No interviews yet"
          description="Interviews will appear here once candidates are scheduled. Enable auto-scheduling on a job to get started."
          actionLabel="View Jobs"
          actionHref="/schedule/jobs"
        />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Interviewer</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INTERVIEWS.map((interview) => (
                <TableRow key={interview.id}>
                  <TableCell className="font-medium">{interview.candidateName}</TableCell>
                  <TableCell>{interview.interviewerName}</TableCell>
                  <TableCell>{interview.jobTitle}</TableCell>
                  <TableCell className="text-muted-foreground">{interview.scheduledAt}</TableCell>
                  <TableCell>
                    <StatusBadge status={interview.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
