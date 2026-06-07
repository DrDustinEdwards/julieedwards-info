import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode };

export default function ArrowLink({ children, className, ...rest }: Props) {
  const cls = ["arrow-link", className].filter(Boolean).join(" ");
  return (
    <a className={cls} {...rest}>
      {children}
      <svg
        className="arrow-chev"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </a>
  );
}
