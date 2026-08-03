import React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

/**
 * Spur gsap-slide-up: from { y: 200, autoAlpha: 0 } → { y: 0, autoAlpha: 1 },
 * duration 1, ease power2.out, ScrollTrigger start "top 80%".
 * Titles use WipeReveal separately; this is for body / cards / grids.
 */
export const blockReveal: Variants = {
  hidden: { opacity: 0, y: 200 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      delay: typeof delay === 'number' ? delay : 0,
      ease: [0.215, 0.61, 0.355, 1], // ≈ GSAP power2.out
    },
  }),
};

export const blockRevealStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.04 },
  },
};

type BlockRevealProps = {
  className?: string;
  /** Extra delay before this block starts (seconds). */
  delay?: number;
  /** Parent for staggered children using blockReveal / BlockRevealItem. */
  stagger?: boolean;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'className'>;

export default function BlockReveal({
  className,
  delay = 0,
  stagger = false,
  children,
  ...rest
}: BlockRevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={stagger ? blockRevealStagger : blockReveal}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      /* Spur ScrollTrigger start: "top 80%" ≈ rootMargin bottom -20% */
      viewport={{ once: true, amount: 0.01, margin: '0px 0px -20% 0px' }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type ItemProps = {
  className?: string;
  children: React.ReactNode;
};

/** Child of a stagger BlockReveal — inherits whileInView from parent. */
export function BlockRevealItem({ className, children }: ItemProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={blockReveal}>
      {children}
    </motion.div>
  );
}
