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
import { CANDIDATES } from "@/data/schedule/candidates";

function ScoreBadge({ score }: { score: number }) {
  let color = "text-red-600 bg-red-50";
  if (score >= 75) color = "text-green-600 bg-green-50";
  else if (score >= 60) color = "text-yellow-600 bg-yellow-50";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score}
    </span>
  );
}

export default function CandidatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        description="View and manage all candidates across job postings"
      />

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>AI Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CANDIDATES.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell className="font-medium">{candidate.name}</TableCell>
                <TableCell className="text-muted-foreground">{candidate.email}</TableCell>
                <TableCell>{candidate.jobTitle}</TableCell>
                <TableCell>
                  <ScoreBadge score={candidate.aiScore} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={candidate.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{candidate.appliedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
