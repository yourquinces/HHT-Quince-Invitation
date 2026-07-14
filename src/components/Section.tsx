import type { ReactNode } from "react";

interface Props {
  id?: string;
  className?: string;
  children: ReactNode;
}

/** Shared page-section wrapper: centered content column with comfortable spacing. */
export default function Section({ id, className = "", children }: Props) {
  return (
    <section id={id} className={`px-5 py-14 sm:px-8 sm:py-20 ${className}`}>
      <div className="mx-auto w-full max-w-content">{children}</div>
    </section>
  );
}
