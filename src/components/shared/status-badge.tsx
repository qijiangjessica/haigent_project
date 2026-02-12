import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
  draft: "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
  closed: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100",
  paused: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100",
  applied: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  scored: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100",
  invited: "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-100",
  scheduled: "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
  rejected: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
  connected: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
  upcoming: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  completed: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100",
  no_show: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status.toLowerCase()] || statusStyles.draft;
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");

  return (
    <Badge variant="outline" className={style}>
      {label}
    </Badge>
  );
}
