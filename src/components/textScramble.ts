import { useEffect, useRef } from 'react';

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Matches spur.us HoverTextScramble defaults (GSAP ScrambleTextPlugin). */
export const SCRAMBLE = {
  duration: 1.75,
  revealDelay: 0.15,
  speed: 1.25,
} as const;

type UseTextScrambleOptions = {
  /** Scramble on mouseenter of root (and optional `.group` parent). */
  hover?: boolean;
  /** When true, scramble listens on closest `.group` as well. */
  triggerOnParentHover?: boolean;
  /** Scramble once when the root enters the viewport. */
  onView?: boolean;
  /** IntersectionObserver rootMargin for onView. */
  viewMargin?: string;
};

export function useTextScramble(
  rootRef: React.RefObject<HTMLElement | null>,
  labelRef: React.RefObject<HTMLElement | null>,
  original: string,
  {
    hover = true,
    triggerOnParentHover = false,
    onView = false,
    viewMargin = '-40px',
  }: UseTextScrambleOptions = {},
) {
  const busyRef = useRef(false);
  const rafRef = useRef(0);
  const originalRef = useRef(original);
  originalRef.current = original;

  useEffect(() => {
    const root = rootRef.current;
    const label = labelRef.current;
    if (!root || !label) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      label.textContent = originalRef.current;
      busyRef.current = false;
    };

    const run = () => {
      if (reduceMotion || busyRef.current) return;
      busyRef.current = true;

      const text = originalRef.current;
      const chars = Array.from(text);
      const start = performance.now();
      const durationMs = SCRAMBLE.duration * 1000;
      const revealDelayMs = SCRAMBLE.revealDelay * 1000;
      const tickMs = 1000 / (30 * SCRAMBLE.speed);
      let lastTick = 0;

      const frame = (now: number) => {
        const elapsed = now - start;
        if (elapsed >= durationMs) {
          label.textContent = text;
          busyRef.current = false;
          rafRef.current = 0;
          return;
        }

        if (now - lastTick >= tickMs || lastTick === 0) {
          lastTick = now;
          const revealT = Math.max(0, (elapsed - revealDelayMs) / (durationMs - revealDelayMs));
          const locked = Math.floor(revealT * chars.length);

          let out = '';
          for (let i = 0; i < chars.length; i += 1) {
            const ch = chars[i];
            if (ch === ' ' || ch === '\u00A0') {
              out += ch;
            } else if (i < locked) {
              out += ch;
            } else {
              out += UPPER[(Math.random() * UPPER.length) | 0];
            }
          }
          label.textContent = out;
        }

        rafRef.current = requestAnimationFrame(frame);
      };

      rafRef.current = requestAnimationFrame(frame);
    };

    const targets: EventTarget[] = [];
    if (hover) {
      targets.push(root);
      if (triggerOnParentHover) {
        const parent = root.closest('.group');
        if (parent) targets.push(parent);
      }
      targets.forEach((el) => {
        el.addEventListener('mouseenter', run);
      });
    }

    let observer: IntersectionObserver | null = null;
    if (onView) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            run();
            observer?.disconnect();
            observer = null;
          }
        },
        { root: null, rootMargin: viewMargin, threshold: 0.01 },
      );
      observer.observe(root);
    }

    return () => {
      stop();
      targets.forEach((el) => {
        el.removeEventListener('mouseenter', run);
      });
      observer?.disconnect();
    };
  }, [rootRef, labelRef, hover, triggerOnParentHover, onView, viewMargin]);
}
