import type { AnchorHTMLAttributes, ReactNode } from "react";
import { navigate, toHash } from "@/lib/router";

/** In-app link (hash routing). */
export function Link({ href, children, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }) {
  return (
    <a
      {...rest}
      href={toHash(href)}
      onClick={(e) => {
        onClick?.(e);
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}
