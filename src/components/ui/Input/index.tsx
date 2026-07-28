import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";
import styles from "./Input.module.scss";

export type InputTone = "normal" | "critical" | "neutral";
export type InputSize = "sm" | "md" | "lg";

interface InputOwnProps {
  tone?: InputTone;
  size?: InputSize; // our size axis, not the native input `size` attribute
  multiline?: boolean;
  invalid?: boolean;
  icon?: ReactNode; // leading icon (e.g. search)
}

type InputProps = InputOwnProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, keyof InputOwnProps | "size">;
type TextareaProps = InputOwnProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, keyof InputOwnProps | "size">;

// Absorbs <textarea> via `multiline`. Leading `icon` wraps the field for search.
export function Input({
  tone = "normal",
  size = "md",
  multiline = false,
  invalid = false,
  icon,
  className,
  ...rest
}: InputProps & TextareaProps) {
  const dataProps = {
    "data-tone": tone,
    "data-size": size,
    "data-invalid": invalid ? "" : undefined,
    "aria-invalid": invalid || undefined,
  };

  if (multiline) {
    return (
      <textarea
        className={[styles.field, styles.textarea, className].filter(Boolean).join(" ")}
        {...dataProps}
        {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
    );
  }

  const input = (
    <input
      className={[styles.field, icon ? styles.hasIcon : "", className].filter(Boolean).join(" ")}
      {...dataProps}
      {...(rest as InputHTMLAttributes<HTMLInputElement>)}
    />
  );

  if (!icon) return input;
  return (
    <span className={styles.wrap} data-size={size}>
      <span className={styles.leadingIcon} aria-hidden>
        {icon}
      </span>
      {input}
    </span>
  );
}
