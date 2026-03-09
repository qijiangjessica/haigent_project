import Image from "next/image";
import { cn } from "@/lib/utils";

type SvgIconProps = {
  /** Base filename in `/public/svg_I` without `.svg`, e.g. `"analytics-dashboard"` */
  name: string;
  /** Accessible label (defaults to a humanised version of `name`) */
  alt?: string;
  /** Convenience size for square icons; defaults to 32px */
  size?: number;
  className?: string;
};

export function SvgIcon({ name, alt, size = 32, className }: SvgIconProps) {
  return (
    <Image
      src={`/svg_I/${name}.svg`}
      alt={alt ?? name.replace(/[-_]/g, " ")}
      width={size}
      height={size}
      className={cn("inline-block", className)}
    />
  );
}
