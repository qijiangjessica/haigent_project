import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { INTERVIEWERS } from "@/data/schedule/interviewers";

export default function InterviewersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Interviewers"
        description="Manage interviewer availability and calendar connections"
        actionLabel="Add Interviewer"
        actionHref="/schedule/interviewers"
      />

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Calendar</TableHead>
              <TableHead>Timezone</TableHead>
              <TableHead className="text-right">Max/Day</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {INTERVIEWERS.map((interviewer) => (
              <TableRow key={interviewer.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{interviewer.name}</p>
                    <p className="text-xs text-muted-foreground">{interviewer.email}</p>
                  </div>
                </TableCell>
                <TableCell>{interviewer.title}</TableCell>
                <TableCell>{interviewer.department}</TableCell>
                <TableCell>
                  <StatusBadge status={interviewer.calConnected ? "connected" : "draft"} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {interviewer.timezone.replace("America/", "")}
                </TableCell>
                <TableCell className="text-right">{interviewer.maxInterviewsPerDay}</TableCell>
                <TableCell>
                  <StatusBadge status={interviewer.isActive ? "active" : "paused"} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
