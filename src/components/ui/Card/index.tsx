import type { HTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import styles from "./Card.module.scss";

export type CardElevation = "flat" | "outlined";
export type CardPadding = "none" | "sm" | "md" | "lg";
export type CardTone = "normal" | "critical" | "neutral" | "ok";

interface CardOwnProps {
  elevation?: CardElevation;
  padding?: CardPadding;
  tone?: CardTone;
  selected?: boolean;
  children?: ReactNode;
}

type CardAsDiv = CardOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof CardOwnProps | "href"> & { href?: undefined };
type CardAsLink = CardOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CardOwnProps> & { href: string };

export type CardProps = CardAsDiv | CardAsLink;

// Generic surface. Renders an <a> when href is set (a "card that is a link" isn't
// a separate component). `selected` draws the accent border for pickers.
export function Card({
  elevation = "outlined",
  padding = "md",
  tone = "normal",
  selected = false,
  className,
  children,
  ...rest
}: CardProps) {
  const isLink = typeof (rest as { href?: string }).href === "string";
  const Tag = (isLink ? "a" : "div") as "a";
  return (
    <Tag
      className={[styles.card, className].filter(Boolean).join(" ")}
      data-elevation={elevation}
      data-padding={padding}
      data-tone={tone}
      data-selected={selected ? "" : undefined}
      data-interactive={isLink ? "" : undefined}
      {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
    >
      {children}
    </Tag>
  );
}
