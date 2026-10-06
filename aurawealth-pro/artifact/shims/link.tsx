/** Sustituto de `next/link`: ancla que navega con el enrutador en memoria. */
import { forwardRef, type AnchorHTMLAttributes } from "react";
import { navigate } from "../router";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean; scroll?: boolean; replace?: boolean };

const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, onClick, prefetch: _p, scroll: _s, replace, ...rest }, ref) {
  void _p;
  void _s;
  return (
    <a
      ref={ref}
      href={`#${href.split("?")[0].replace(/^\//, "")}`}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href, { replace });
      }}
      {...rest}
    />
  );
});

export default Link;
