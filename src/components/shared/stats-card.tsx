import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  bgColor: string;
  href?: string;
  icon?: React.ReactNode;
}

export function StatsCard({ label, value, bgColor, href, icon }: StatsCardProps) {
  const content = (
    <div className={`${bgColor} rounded-xl p-5 shadow-[0px_4px_16px_rgba(17,17,26,0.1),0px_8px_24px_rgba(17,17,26,0.1)] group transition-all hover:shadow-[0px_8px_24px_rgba(17,17,26,0.15),0px_16px_56px_rgba(17,17,26,0.1)]`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-white/90 flex items-center justify-center mb-2 transition-transform group-hover:scale-110">
              {icon}
            </div>
          )}
          <p className="text-xs text-white/80 font-medium">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-brand-charcoal/40 opacity-0 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-1" />
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
