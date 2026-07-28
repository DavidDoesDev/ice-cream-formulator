import type {
  ButtonHTMLAttributes,
  AnchorHTMLAttributes,
  ReactNode,
} from "react";
import styles from "./Button.module.scss";

export type ButtonHierarchy = "primary" | "secondary" | "tertiary" | "inverse";
export type ButtonTone = "normal" | "critical" | "neutral";
export type ButtonSize = "sm" | "md" | "lg";
export type IconPosition = "none" | "only" | "before" | "after";

// Options, not variants: one component absorbs IconButton (via icon +
// iconPosition) and the link-button (via href → renders an <a>). Every axis is a
// data-attribute styled off tokens in Button.module.scss, so it re-themes.
interface ButtonOwnProps {
  hierarchy?: ButtonHierarchy;
  tone?: ButtonTone;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: IconPosition;
  loading?: boolean;
  children?: ReactNode;
}

type ButtonAsButton = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps | "href"> & {
    href?: undefined;
  };
type ButtonAsLink = ButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonOwnProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  hierarchy = "primary",
  tone = "normal",
  size = "md",
  icon,
  iconPosition,
  loading = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const pos: IconPosition = icon ? iconPosition ?? "before" : "none";
  const iconOnly = pos === "only";
  const isLink = typeof (rest as { href?: string }).href === "string";
  const Tag = (isLink ? "a" : "button") as "a";

  return (
    <Tag
      className={[styles.btn, className].filter(Boolean).join(" ")}
      data-hierarchy={hierarchy}
      data-tone={tone}
      data-size={size}
      data-icon-position={pos !== "none" ? pos : undefined}
      data-loading={loading ? "" : undefined}
      aria-busy={loading || undefined}
      type={!isLink ? (rest as ButtonHTMLAttributes<HTMLButtonElement>).type ?? "button" : undefined}
      {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
    >
      {(pos === "before" || pos === "only") && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
      {!iconOnly && <span className={styles.label}>{children}</span>}
      {pos === "after" && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
    </Tag>
  );
}
