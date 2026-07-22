import React, { useRef } from 'react';
import { useTextScramble } from './textScramble';

export type CtaColor = 'ink' | 'soft' | 'live' | 'dim' | 'mist' | 'inherit';

type CtaLinkBase = {
  children: string;
  className?: string;
  color?: CtaColor;
  /** When true, scramble listens on closest `.group` (for card wrappers). */
  triggerOnParentHover?: boolean;
  'aria-label'?: string;
};

type CtaAsLink = CtaLinkBase &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className' | 'color'> & {
    as?: 'a';
    href: string;
  };

type CtaAsButton = CtaLinkBase &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className' | 'color'> & {
    as: 'button';
    href?: never;
  };

type CtaAsSpan = CtaLinkBase &
  Omit<React.HTMLAttributes<HTMLSpanElement>, 'children' | 'className' | 'color'> & {
    as: 'span';
    href?: never;
  };

export type CtaLinkProps = CtaAsLink | CtaAsButton | CtaAsSpan;

function CtaArrow() {
  return (
    <svg
      className="cta-link__arrow"
      xmlns="http://www.w3.org/2000/svg"
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      aria-hidden="true"
    >
      <path d="M1 5H10M10 5L6 0.5M10 5L6 9.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function CtaInner({ labelRef, children }: { labelRef: React.RefObject<HTMLSpanElement | null>; children: string }) {
  return (
    <span className="cta-link__row">
      <span className="cta-link__bracket" aria-hidden="true">
        [
      </span>
      <span className="cta-link__label" ref={labelRef}>
        {children}
      </span>
      <CtaArrow />
      <span className="cta-link__bracket" aria-hidden="true">
        ]
      </span>
    </span>
  );
}

export function CtaLink(props: CtaLinkProps) {
  const {
    children,
    className,
    color = 'inherit',
    triggerOnParentHover = false,
    as,
    'aria-label': ariaLabel,
    ...rest
  } = props;

  const rootRef = useRef<HTMLElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  useTextScramble(rootRef, labelRef, children, { hover: true, triggerOnParentHover });

  const classes = [
    'cta-link',
    'group',
    color !== 'inherit' ? `cta-link--${color}` : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const label = ariaLabel ?? children;
  const inner = <CtaInner labelRef={labelRef}>{children}</CtaInner>;

  if (as === 'span') {
    const spanRest = rest as React.HTMLAttributes<HTMLSpanElement>;
    return (
      <span
        {...spanRest}
        ref={rootRef as React.RefObject<HTMLSpanElement>}
        className={classes}
        aria-hidden={spanRest['aria-hidden'] ?? true}
      >
        {inner}
      </span>
    );
  }

  if (as === 'button') {
    const buttonRest = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        {...buttonRest}
        ref={rootRef as React.RefObject<HTMLButtonElement>}
        type={buttonRest.type ?? 'button'}
        className={classes}
        aria-label={label}
      >
        {inner}
      </button>
    );
  }

  const anchorRest = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;
  return (
    <a
      {...anchorRest}
      ref={rootRef as React.RefObject<HTMLAnchorElement>}
      href={(props as CtaAsLink).href}
      className={classes}
      aria-label={label}
    >
      {inner}
    </a>
  );
}
