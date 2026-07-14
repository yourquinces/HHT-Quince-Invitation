import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const BASE =
  "inline-flex w-full items-center justify-center gap-2 rounded-full border border-royal-300 bg-white px-8 py-4 text-sm font-semibold uppercase tracking-wider text-royal-700 shadow-sm transition hover:border-royal-400 hover:bg-royal-50 sm:w-auto";

export default function SecondaryButton({ children, href, onClick, className = "" }: Props) {
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
    <button type="button" onClick={onClick} className={`${BASE} ${className}`}>
      {children}
    </button>
  );
}
