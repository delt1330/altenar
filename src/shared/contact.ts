import type {createElement as CreateElement, useId as UseId, FormEvent, CSSProperties} from 'react';
import './contact.css';

type ContactProps = {
  className?: string;
  onNext?: (form: HTMLFormElement) => void;
};

const groups = [
  {
    node: 111627, question: 'What are you launching?',
    options: ['Turnkey Sportsbook', 'Retail / Landbase', 'White Label', 'Sportsbook API', 'Managed Services'],
    initial: 'Turnkey Sportsbook',
  },
  {
    node: 111635, question: 'Where will you operate?',
    options: ['Latin America', 'Europe', 'North America', 'Africa & Asia', 'Global'],
  },
  {
    node: 111643, question: 'Licence status',
    options: ['Already licensed', 'Application in progress', 'Need guidance'],
  },
];

// The exported Turnkey page supplies its own React runtime, as it does for FAQ.
export function createContactSection({createElement: h, useId}: {
  createElement: typeof CreateElement, useId: typeof UseId
}) {
  const part = (className: string, name?: string, node?: number) => ({
    className,
    'data-name': name,
    'data-node-id': node ? `4001:${node}` : undefined,
  });
  const image = (asset: string) => h('img', {
    alt: '', className: 'd20 d21 d22 d23 d24', src: `/assets/${asset}.svg`,
  });

  function nextButton(disabled: boolean) {
    return h('button', {
      type: 'submit', disabled, 'aria-disabled': disabled,
      className: 'd0 d1 d3 d6 d13 premium-primary split-button',
      'data-premium-split': 'true',
    },
    h('div', part('d0 d1 d35 d36 d3 d37 d38 d39 d6 d13', 'button-split__label'),
      h('div', part('d20 d40 d41 d42 d43', 'button__plate')),
      h('div', part('d20 d26 d29 d46 d47', 'button__cap'),
        h('div', {className: 'd20 d48'},
          h('img', {alt: '', className: 'd21 d23 d24', src: '/assets/imgButtonCap2.svg'}))),
      h('p', {className: 'd7 d8 d9 d10 d11 d12 d6 d13 d15 d50 d16 d17 d18', 'data-node-id': '3968:139928'}, 'Next step')),
    h('div', part('d0 d1 d36 d3 d4 d51 d6 d13 d52', 'button-split__arrow'),
      image('imgButtonSplitArrow1'),
      h('div', part('d6 d13 d53', 'button__icon'), image('imgButtonIcon'))));
  }

  return function ContactSection({className, onNext}: ContactProps) {
    const id = useId();
    return h('div', {
      className: `${className ?? 'd44 d0 d1 d66 d67 d68 d69 d70 d6 d13 d71'} premium-contact`,
      'data-node-id': '4011:41478',
      'data-shared-contact': '',
    }, h('div', part('d72 d68 d6 d13 d73', 'contact__panel', 111617),
      h('div', part('d9 d20 d0 d1 d66 d83 d67 d84 d68 d85 d86', 'contact__lead', 111620),
        h('p', part('d7 d8 d87 d61 d88 d6 d13 d89 d90 d91 d17 d73', undefined, 111621), 'Contact sales'),
        h('div', part('d92 d93 d11 d94 d6 d13 d95 d50 d96 d73 premium-heading', undefined, 111622),
          h('p', null, 'Ready to grow?'),
          h('p', null, h('span', {
            className: 'premium-gradient', 'data-gradient-filled': 'false', style: {'--gradient-angle': '89.3524deg'} as CSSProperties,
          }, "Let's talk"))),
        h('p', part('d100 d101 d11 d62 d6 d13 d102 d103 d91 d16 d73', undefined, 111623),
          'Partner with the sportsbook platform trusted by operators across 50+ regulated markets. Tailored technology, proven performance.')),
      h('form', {
        ...part('d20 d0 d1 d66 d104 d67 d105 d106 d107', 'contact__form', 111624),
        'aria-label': 'Contact sales',
        onSubmit: (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          onNext?.(event.currentTarget);
        },
      },
      h('p', part('d7 d8 d9 d100 d108 d11 d12 d6 d13 d109 d110 d65 d73', undefined, 111625), 'Step 1 of 3'),
      h('div', part('d0 d1 d66 d111 d67 d6 d13 d73', 'contact__groups', 111626),
        groups.map(({node, question, options, initial}) => {
          const groupId = `${id}-${node}`;
          return h('div', {...part('d0 d1 d66 d112 d67 d6 d13 d73', 'contact__group', node), key: node},
            h('p', {...part('d7 d8 d9 d87 d61 d88 d6 d13 d89 d110 d91 d17 d73', undefined, node + 1), id: groupId}, question),
            h('div', {
              ...part('d113 d1 d114 d54 d67 d6 d13 d73', 'contact-group__options', node + 2),
              role: 'radiogroup', 'aria-labelledby': groupId,
            }, options.map(value => {
              const selected = value === initial;
              return h('label', {
                key: value, className: `${selected ? 'd43' : 'd58'} d0 d1 d54 d115 d3 d56 d6 d57 d13 choice-chip`,
              },
              h('input', {type: 'radio', name: groupId, value, defaultChecked: selected}),
              h('p', {
                className: `d9 d59 d60 d61 d62 d6 d13 ${selected ? 'd64 d50' : 'd63 d64'} d65 d18`,
                'data-node-id': selected ? '3974:35513' : '3974:35509',
              }, value));
            })));
        })),
      h('div', part('d0 d1 d112 d3 d6 d13 d73', 'contact__actions', 111649),
        h('p', part('d9 d116 d100 d101 d11 d62 d117 d6 d102 d110 d91 d16', undefined, 111650),
          'No sales call unless you ask for one.'),
        nextButton(!onNext)))));
  };
}
