import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { classNames } from "@/lib/format";

type Tone = "default" | "brand" | "accent" | "success" | "danger";

const toneStyles: Record<Tone, string> = {
  default:
    "text-slate-200 bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.09] hover:border-white/[0.14]",
  brand:
    "text-brand-100 bg-brand-500/15 border-brand-400/30 hover:bg-brand-500/25 hover:border-brand-400/50",
  accent:
    "text-accent-400 bg-accent-500/15 border-accent-500/30 hover:bg-accent-500/25 hover:border-accent-500/50",
  success:
    "text-emerald-200 bg-emerald-500/15 border-emerald-400/30 hover:bg-emerald-500/25 hover:border-emerald-400/50",
  danger:
    "text-rose-200 bg-rose-500/15 border-rose-400/30 hover:bg-rose-500/25 hover:border-rose-400/50",
};

interface CommonProps {
  icon: ReactNode;
  label?: string;
  tooltip?: string;
  tone?: Tone;
  size?: "sm" | "md";
}

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };

type AnchorProps = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a" };

type Props = ButtonProps | AnchorProps;

export const IconButton = forwardRef<HTMLElement, Props>(function IconButton(
  props,
  ref,
) {
  const {
    icon,
    label,
    tooltip,
    tone = "default",
    size = "md",
    className,
    as,
    ...rest
  } = props as CommonProps & {
    className?: string;
    as?: "button" | "a";
  } & Record<string, unknown>;

  const classes = classNames(
    "inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60",
    size === "sm" ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs",
    toneStyles[tone],
    label ? "" : "aspect-square justify-center",
    className,
  );

  if (as === "a") {
    const aProps = rest as unknown as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        title={tooltip ?? label}
        className={classes}
        {...aProps}
      >
        <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span>
        {label ? <span>{label}</span> : null}
      </a>
    );
  }

  const bProps = rest as unknown as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type={bProps.type ?? "button"}
      title={tooltip ?? label}
      className={classes}
      {...bProps}
    >
      <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      {label ? <span>{label}</span> : null}
    </button>
  );
});
