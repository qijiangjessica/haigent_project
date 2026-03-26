import { PageHeader } from "@/components/shared/page-header";
import { REFERENCE_JOBS } from "@/data/reference/jobs";
import { MATCH_RECORDS } from "@/data/reference/matches";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-brand-green/10 text-brand-green",
  ON_HOLD: "bg-brand-gold/10 text-brand-gold",
  CLOSED: "bg-muted text-muted-foreground",
};

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Open Jobs"
        description="Positions available for employee referrals"
        actionLabel="Submit Referral"
        actionHref="/reference/submit"
      />

      <div className="grid gap-4">
        {REFERENCE_JOBS.map((job) => {
          const matches = MATCH_RECORDS.filter((m) => m.posting_id === job.id);
          const strongMatches = matches.filter((m) => m.classification === "Strong Match").length;
          const partialMatches = matches.filter((m) => m.classification === "Partial Match").length;

          return (
            <div
              key={job.id}
              className="bg-white rounded-xl border border-border shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{job.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        STATUS_COLORS[job.status] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {job.status === "ON_HOLD" ? "On Hold" : job.status.charAt(0) + job.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {job.companyName} · {job.department} · {job.location}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {job.experienceMin}–{job.experienceMax} years exp · {job.salaryRange}
                  </p>
                </div>

                {matches.length > 0 && (
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {strongMatches > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green font-medium">
                        {strongMatches} Strong Match{strongMatches > 1 ? "es" : ""}
                      </span>
                    )}
                    {partialMatches > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold font-medium">
                        {partialMatches} Partial Match{partialMatches > 1 ? "es" : ""}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-2">
                {job.description}
              </p>

              {/* Required skills */}
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-2.5 py-1 rounded-md bg-brand-teal/10 text-brand-teal font-medium capitalize"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Posted {job.createdAt}
                </p>
                <a
                  href="/reference/submit"
                  className="text-xs text-brand-teal font-medium hover:underline"
                >
                  Refer a candidate →
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
