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
import { JOBS } from "@/data/schedule/jobs";

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description="Manage job postings and AI scoring settings"
        actionLabel="New Job"
        actionHref="/schedule/jobs"
      />

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Scored</TableHead>
              <TableHead className="text-right">Scheduled</TableHead>
              <TableHead>Auto Score</TableHead>
              <TableHead>Auto Schedule</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {JOBS.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.title}</TableCell>
                <TableCell>{job.department}</TableCell>
                <TableCell>{job.location}</TableCell>
                <TableCell>
                  <StatusBadge status={job.status} />
                </TableCell>
                <TableCell className="text-right">{job.scoredCount}</TableCell>
                <TableCell className="text-right">{job.scheduledCount}</TableCell>
                <TableCell>
                  <span className={`text-xs font-medium ${job.autoScore ? "text-green-600" : "text-muted-foreground"}`}>
                    {job.autoScore ? "On" : "Off"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-medium ${job.autoSchedule ? "text-green-600" : "text-muted-foreground"}`}>
                    {job.autoSchedule ? "On" : "Off"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
