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
import { Badge } from "@/components/ui/badge";
import { SOURCING_ROLES } from "@/data/sourcing/roles";

export default function SourcingRolesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Manage sourcing roles and track pipeline metrics"
        actionLabel="New Role"
        actionHref="/sourcing/roles"
      />

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead className="text-right">Sourced</TableHead>
              <TableHead className="text-right">Qualified</TableHead>
              <TableHead className="text-right">Contacted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SOURCING_ROLES.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{role.title}</p>
                    <p className="text-xs text-muted-foreground">{role.department}</p>
                  </div>
                </TableCell>
                <TableCell>{role.companyName}</TableCell>
                <TableCell>{role.location}</TableCell>
                <TableCell>
                  <StatusBadge status={role.status} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {role.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {role.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        +{role.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">{role.sourcedCount}</TableCell>
                <TableCell className="text-right">{role.qualifiedCount}</TableCell>
                <TableCell className="text-right">{role.contactedCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
