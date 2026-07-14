import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  href?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const BASE =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-royal-600 px-8 py-4 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-royal-600/25 transition hover:bg-royal-700 active:bg-royal-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

export default function PrimaryButton({
  children,
  href,
  type = "button",
  onClick,
  disabled,
  className = "",
}: Props) {
  if (href) {
    const external = href.startsWith("http");
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={`${BASE} ${className}`}
      >
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${BASE} ${className}`}>
      {children}
    </button>
  );
}
