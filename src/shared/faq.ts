import type {createElement as CreateElement, useId as UseId, useState as UseState} from 'react';
import './faq.css';

type FaqProps = {
  className?: string;
  answer?: string;
  question?: string;
  state?: 'Collapsed' | 'Expanded';
};

// Each page supplies its own React runtime; the portable export bundles React.
export function createFaqItem({createElement: h, useId, useState}: {
  createElement: typeof CreateElement, useId: typeof UseId, useState: typeof UseState
}) {
  return function FaqItem({
    className,
    answer = 'Depending on your specific branding customization and license status, deployments typically launch in 8 to 12 weeks.',
    question = 'How long does a turnkey deployment typically take?',
    state = 'Collapsed',
  }: FaqProps) {
    const [expanded, setExpanded] = useState(state === 'Expanded');
    const id = useId();
    return h('div', {
      className: `${className || 'd118 d119 d120 d0 d1 d66 d67 d121 d6 d122'} glow-faq-item`,
      'data-expanded': expanded,
    }, h('button', {
      type: 'button',
      className: 'd0 d1 d112 d3 d68 d6 d13 d73',
      'data-name': 'faq-item__header',
      'data-faq-plain': 'true',
      id: `${id}-question`,
      'aria-expanded': expanded,
      'aria-controls': `${id}-answer`,
      onClick: () => setExpanded(value => !value),
    }, h('p', {
      className: 'd9 d116 d59 d60 d61 d62 d117 d6 d63 d124 d91 d125',
      'data-node-id': '3968:139851',
    }, question), h('span', {
      className: 'glow-faq-toggle',
      'data-name': 'faq-item__toggle',
      'aria-hidden': true,
    })), h('div', {
      className: 'glow-faq-answer',
      id: `${id}-answer`,
      'aria-hidden': !expanded,
      'aria-labelledby': `${id}-question`,
      inert: !expanded,
    }, h('div', {className: 'glow-faq-answer-inner'}, h('p', {
      className: 'd9 d100 d101 d11 d62 d126 d6 d13 d102 d110 d91 d16 d73',
      'data-node-id': '3968:139862',
    }, answer))));
  };
}
