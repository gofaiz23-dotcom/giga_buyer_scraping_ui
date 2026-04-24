import { classNames, statusTone } from "@/lib/format";
import type { JobStatus } from "@/lib/types";

interface StatusBadgeProps {
  status?: JobStatus | null;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, className, size = "md" }: StatusBadgeProps) {
  const tone = statusTone(status);
  return (
    <span
      className={classNames(
        "chip",
        tone.chip,
        size === "sm" && "!px-2 !py-0.5 !text-[10px]",
        className,
      )}
    >
      <span className={classNames("h-1.5 w-1.5 rounded-full", tone.dot)} />
      {tone.label}
    </span>
  );
}
