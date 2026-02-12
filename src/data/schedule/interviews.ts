export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  interviewerId: string;
  interviewerName: string;
  jobId: string;
  jobTitle: string;
  scheduledAt: string;
  status: "upcoming" | "completed" | "cancelled" | "no_show";
}

export const INTERVIEWS: Interview[] = [];
