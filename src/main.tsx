import React from 'react';
import { createRoot } from 'react-dom/client';
import { motion, type Variants } from 'framer-motion';
import WorldMap, { type MapMarker } from './WorldMap';
import './styles.css';

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

type IconName =
  | 'migrate'
  | 'globe'
  | 'shield'
  | 'channels'
  | 'module'
  | 'key'
  | 'store'
  | 'label';
type Stat = { value: string; label: string; up?: boolean };
type CaseStudy = { tag: string; company: string; market: string; result: string; text: string };
type PlatformLayer = { id: string; label: string; title: string; description: string };
type Product = { icon: IconName; title: string; text: string };
type Market = {
  code: string;
  title: string;
  description: string;
  details: string[];
  countries: string[];
  markers: { name: string; coordinates: [number, number] }[];
  center: [number, number];
  zoom: number;
};
type Capability = { title: string; text: string };
type EcosystemGroup = { role: string; items: string[] };
type ComplianceItem = { code: string; title: string; text: string; scope: string };
type Award = { year: string; title: string; event: string; category: string };

const stats: Stat[] = [
  { value: '15', label: 'лет на рынке' },
  { value: '30+', label: 'регулируемых рынков' },
  { value: '700+', label: 'специалистов в команде' },
  { value: '100+', label: 'операторов на платформе' },
  { value: '24/7', label: 'торговля и поддержка' },
  { value: 'ISO 27001', label: 'и сертификация GLI-33' },
];

type Client = { name: string; domain: string };

const clients: Client[] = [
  { name: 'NOVOMATIC', domain: 'novomatic.com' },
  { name: 'Greentube', domain: 'greentube.com' },
  { name: 'Videoslots', domain: 'videoslots.com' },
  { name: 'Golden Palace', domain: 'goldenpalace.be' },
  { name: 'Mr Vegas', domain: 'mrvegas.com' },
  { name: 'Palms Bet', domain: 'palmsbet.com' },
  { name: 'Immense Group', domain: 'immensegroup.io' },
  { name: 'DBET', domain: 'dbet.com' },
];

type Thesis = { icon: IconName; title: string; text: string };

const theses: Thesis[] = [
  {
    icon: 'migrate',
    title: 'Запуск и миграция без простоя',
    text: 'Переносим действующий продукт и запускаем новый, не останавливая приём ставок.',
  },
  {
    icon: 'globe',
    title: 'Локализация под каждый рынок',
    text: 'Виды спорта, языки, платежи и правила юрисдикции учтены заранее.',
  },
  {
    icon: 'shield',
    title: 'Риски и маржа под контролем',
    text: 'Команда трейдеров и автоматика защищают доходность букмекера 24/7.',
  },
  {
    icon: 'channels',
    title: 'Один продукт во всех каналах',
    text: 'Online, мобайл и розница работают на единой платформе.',
  },
];

const cases: CaseStudy[] = [
  {
    tag: '//миграция',
    company: 'Palms Bet',
    market: 'Болгария · Перу',
    result: '+137%',
    text: 'Переход на Altenar и выход на новые регулируемые рынки. Оборот ставок вырос на 46% в Болгарии и на 137% в Перу.',
  },
  {
    tag: '//омниканальность',
    company: 'Golden Palace',
    market: 'Бельгия',
    result: '+50%',
    text: 'Объединили online, розницу и терминалы в одном решении. Прибыльность ставок на спорт выросла на 50%.',
  },
  {
    tag: '//новый продукт',
    company: 'Immense Group',
    market: 'Мульти-бренд',
    result: '4 бренда',
    text: 'Запустили ставки на спорт для casino-first брендов Mr Vegas, Videoslots, MegaRiches и DBET.',
  },
  {
    tag: '//партнёрство',
    company: 'Greentube · NOVOMATIC',
    market: 'Европа',
    result: 'enterprise',
    text: 'Стратегическое партнёрство с digital-подразделением группы NOVOMATIC на регулируемых рынках Европы.',
  },
];

const platformLayers: PlatformLayer[] = [
  {
    id: 'interface',
    label: 'интерфейс',
    title: 'Сайт и приложение',
    description: 'Адаптивный фронтенд на виджетах, мобильный продукт, CMS и купон ставки — под брендом оператора.',
  },
  {
    id: 'core',
    label: 'ядро',
    title: 'Букмекерское ядро',
    description: 'Линия, рынки, ставки, лимиты, маржа и бонусный движок. Полный контроль над продуктом из одной панели.',
  },
  {
    id: 'odds',
    label: 'данные',
    title: 'Коэффициенты и контент',
    description: 'Коэффициенты в реальном времени, тысячи событий, быстрые ставки и Конструктор ставок.',
  },
  {
    id: 'risk',
    label: 'трейдинг',
    title: 'Управление рисками',
    description: 'Команда трейдеров и автоматика держат маржу и лимиты под контролем 24/7.',
  },
  {
    id: 'compliance',
    label: 'compliance',
    title: 'Лицензии и безопасность',
    description: 'Соответствие требованиям юрисдикций, защита данных, отчётность и независимые лаборатории.',
  },
  {
    id: 'channels',
    label: 'каналы',
    title: 'Online, mobile, розница',
    description: 'Один продукт во всех каналах: сайт, приложение, кассы и терминалы самообслуживания.',
  },
];

const products: Product[] = [
  {
    icon: 'module',
    title: 'Модуль букмекера',
    text: 'Спортсбук встраивается в ваш сайт и систему игроков: коэффициенты в реальном времени, рынки, лимиты и бонусы под полным контролем.',
  },
  {
    icon: 'key',
    title: 'Букмекерская контора под ключ',
    text: 'Готовая платформа со всеми системами, CMS и поддержкой 24/7. Быстрый запуск без потери качества.',
  },
  {
    icon: 'store',
    title: 'Розничное решение',
    text: 'Терминалы и кассы с удалённым управлением, синхронизированные с online в единой омниканальной системе.',
  },
  {
    icon: 'label',
    title: 'White Label',
    text: 'Запуск под вашим брендом за недели — платежи, лицензии и требования рынка уже учтены.',
  },
];

const markets: Market[] = [
  {
    code: 'LATAM',
    title: 'Латинская Америка',
    description: 'Быстро растущие регулируемые рынки, футбол как главный драйвер и спрос на локальную поддержку.',
    details: ['Бразилия', 'Перу', 'Колумбия', 'Уругвай'],
    countries: ['Brazil', 'Peru', 'Colombia', 'Uruguay', 'Argentina', 'Chile', 'Mexico'],
    markers: [
      { name: 'Бразилия', coordinates: [-47.9, -15.8] },
      { name: 'Перу', coordinates: [-77.0, -12.0] },
      { name: 'Колумбия', coordinates: [-74.1, 4.6] },
      { name: 'Уругвай', coordinates: [-56.2, -34.9] },
    ],
    center: [-65, -15],
    zoom: 2.1,
  },
  {
    code: 'NA',
    title: 'Северная Америка',
    description: 'Новые лицензии в Канаде и непростой переход операторов в регулируемое поле.',
    details: ['Онтарио', 'Альберта', 'США'],
    countries: ['Canada', 'United States of America'],
    markers: [
      { name: 'Онтарио', coordinates: [-79.4, 43.7] },
      { name: 'Альберта', coordinates: [-114.1, 51.0] },
      { name: 'США', coordinates: [-95.0, 39.0] },
    ],
    center: [-96, 48],
    zoom: 2.1,
  },
  {
    code: 'EU',
    title: 'Европа',
    description: 'Зрелые рынки с высокими требованиями к лицензиям, безопасности и отчётности.',
    details: ['Мальта', 'Великобритания', 'Дания', 'Бельгия'],
    countries: ['United Kingdom', 'Denmark', 'Belgium', 'Spain', 'Italy', 'Germany', 'Sweden', 'Netherlands'],
    markers: [
      { name: 'Мальта', coordinates: [14.5, 35.9] },
      { name: 'Великобритания', coordinates: [-0.1, 51.5] },
      { name: 'Дания', coordinates: [12.6, 55.7] },
      { name: 'Бельгия', coordinates: [4.4, 50.8] },
    ],
    center: [10, 51],
    zoom: 3.4,
  },
  {
    code: 'AFR',
    title: 'Африка',
    description: 'Мобильные сценарии, розничные форматы и локальная адаптация продукта.',
    details: ['ЮАР', 'Нигерия', 'Кения'],
    countries: ['South Africa', 'Nigeria', 'Kenya'],
    markers: [
      { name: 'ЮАР', coordinates: [28.0, -26.2] },
      { name: 'Нигерия', coordinates: [3.4, 6.5] },
      { name: 'Кения', coordinates: [36.8, -1.3] },
    ],
    center: [20, 2],
    zoom: 2.0,
  },
];

const complianceItems: ComplianceItem[] = [
  {
    code: 'MGA',
    title: 'Мальтийская лицензия',
    text: 'Подходит операторам, которые запускают sportsbook в строгой европейской регуляторной среде.',
    scope: 'операционная лицензия',
  },
  {
    code: 'UKGC',
    title: 'Великобритания',
    text: 'Работа с одним из самых требовательных рынков по защите игроков, отчётности и контролю продукта.',
    scope: 'регулируемый рынок',
  },
  {
    code: 'AGCO / AGLC',
    title: 'Канада',
    text: 'Онтарио и Альберта подтверждают готовность платформы к североамериканским требованиям.',
    scope: 'региональные лицензии',
  },
  {
    code: 'ISO 27001',
    title: 'Информационная безопасность',
    text: 'Процессы, данные и доступы управляются по международному стандарту безопасности.',
    scope: 'сертификация процессов',
  },
  {
    code: 'GLI-33',
    title: 'Стандарт sportsbook',
    text: 'Независимая проверка букмекерской платформы: ставки, расчёты, отчётность и устойчивость системы.',
    scope: 'техническая сертификация',
  },
  {
    code: 'GLI + BMM',
    title: 'Независимые лаборатории',
    text: 'Внешние тесты помогают проходить проверки регуляторов быстрее и с меньшим риском для запуска.',
    scope: 'аудит продукта',
  },
];

const awards: Award[] = [
  {
    year: '2026',
    title: 'Лучший поставщик спортивных игр года',
    event: 'SBC Awards Latinoamerica',
    category: 'sportsbook supplier',
  },
  {
    year: '2026',
    title: 'Лучшие онлайн-поставщики спортивных игр',
    event: 'SiGMA Brazil',
    category: 'online sportsbook',
  },
  {
    year: '2025',
    title: 'Лучший продукт для ставок в реальном времени',
    event: 'SiGMA South Asia Awards',
    category: 'live betting',
  },
  {
    year: '2025',
    title: 'Самая инновационная функция букмекерской конторы',
    event: 'SiGMA Euro-Med Awards',
    category: 'product innovation',
  },
  {
    year: '2025',
    title: 'Лучший провайдер онлайн спортбука',
    event: 'SiGMA Americas',
    category: 'sportsbook platform',
  },
  {
    year: '2024',
    title: 'Платформа года',
    event: 'BEGE Awards',
    category: 'platform',
  },
  {
    year: '2024',
    title: 'Юридическая команда года',
    event: 'Global Regulatory Awards',
    category: 'regulatory',
  },
  {
    year: '2024',
    title: 'Команда года по обеспечению соответствия нормативным требованиям',
    event: 'Global Regulatory Awards',
    category: 'compliance',
  },
];

const capabilities: Capability[] = [
  { title: 'Коэффициенты в реальном времени', text: 'Тысячи событий и рынков с обновлением в моменте.' },
  { title: 'Быстрые ставки', text: 'Готовые подборки для самых популярных рынков.' },
  { title: 'Конструктор ставок', text: 'Игрок собирает свой рынок из одного матча.' },
  { title: 'Бонусный движок', text: 'Фрибеты, акции и программы удержания из коробки.' },
  { title: 'Управление рисками', text: 'Лимиты, маржа и контроль ставок под надзором трейдеров.' },
  { title: 'Розничные терминалы', text: 'Кассы и автоматы самообслуживания в единой системе.' },
];

const ecosystem: EcosystemGroup[] = [
  { role: 'данные', items: ['Stats Perform · Opta', 'Racing and Sports'] },
  { role: 'CRM', items: ['Optimove'] },
  { role: 'контент', items: ['Inspired', 'Spribe'] },
  { role: 'платформы', items: ['Atlaslive', 'Greentube · NOVOMATIC'] },
  { role: 'признание', items: ['SBC', 'SiGMA', 'BEGE', 'Global Regulatory Awards'] },
];

const navLinks = [
  { label: 'Платформа', id: 'platform' },
  { label: 'Кейсы', id: 'cases' },
  { label: 'Рынки', id: 'markets' },
  { label: 'Лицензии', id: 'compliance' },
];

const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

function App() {
  const [layer, setLayer] = React.useState(1);

  return (
    <>
      <ColumnGuides />
      <Header />
      <main className="page">
        <section className="hero-stack" id="top">
          <video className="hero-bg-video" src={assetUrl('armory-videos/armory-hero.mp4')} autoPlay loop muted playsInline aria-hidden="true" />
          <Hero />
          <StatStrip />
        </section>
        <Clients />
        <Theses />
        <Proof />
        <Platform layer={layer} setLayer={setLayer} />
        <Products />
        <Markets />
        <Compliance />
        <Awards />
        <Capabilities />
        <Ecosystem />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

function ColumnGuides() {
  return (
    <div className="column-guides" aria-hidden="true">
      <div className="column-guides-inner" />
    </div>
  );
}

function Header() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <header className="topbar">
        <a className="logo" href="#top">
          <img src={assetUrl('altenar-logo.png')} alt="Altenar" />
        </a>
        <nav className="topnav">
          {navLinks.map((l) => (
            <a key={l.id} href={`#${l.id}`}>{l.label}</a>
          ))}
        </nav>
        <div className="topbar-right">
          <a className="ghost-pill" href="#demo">Запросить демо</a>
          <button
            type="button"
            className={`burger ${open ? 'is-open' : ''}`}
            onClick={() => setOpen((v) => !v)}
            aria-label="Меню"
          >
            <span />
            <span />
          </button>
        </div>
      </header>
      <motion.div className="overlay-menu" initial={false} animate={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}>
        {navLinks.concat({ label: 'Запросить демо', id: 'demo' }).map((l, i) => (
          <motion.a
            key={l.id}
            href={`#${l.id}`}
            onClick={() => setOpen(false)}
            initial={false}
            animate={{ opacity: open ? 1 : 0, y: open ? 0 : 20 }}
            transition={{ duration: 0.5, delay: open ? i * 0.05 : 0, ease: [0.22, 1, 0.36, 1] }}
          >
            {l.label}
          </motion.a>
        ))}
      </motion.div>
    </>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="eyebrow">
      {children}
    </span>
  );
}

function SectionHead({
  kicker,
  title,
  lead,
  align = 'center',
}: {
  kicker: string;
  title: React.ReactNode;
  lead: string;
  align?: 'left' | 'center' | 'right';
}) {
  return (
    <motion.div className={`section-head section-head--${align}`} variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-90px' }}>
      <Eyebrow>{kicker}</Eyebrow>
      <h2>{title}</h2>
      <p>{lead}</p>
    </motion.div>
  );
}

function Hero() {
  return (
    <div className="hero">
      <div className="hero-grid">
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
          <Eyebrow>Платформа для ставок на спорт · с 2011 года</Eyebrow>
          <h1>Ведущая платформа<br />для ставок на спорт</h1>
          <p>
            Altenar помогает быстро запускать и масштабировать букмекерские платформы
            на новых рынках: с учётом локальных требований, гибкой настройки, API
            и круглосуточной экспертной поддержки.
          </p>
          <div className="hero-cta">
            <a className="btn-primary" href="#demo">
              Запросить демо
              <span className="btn-arrow" aria-hidden="true">↗</span>
            </a>
            <a className="btn-ghost" href="#platform">Возможности платформы</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function LiveBoard() {
  return (
    <div className="board-inner">
      <div className="board-top">
        <span className="board-tag">operator command board</span>
        <span className="board-live"><i className="live-dot" />LIVE</span>
      </div>

      <div className="board-match">
        <div className="board-match-meta">
          <span>Футбол · 67′ · 2-й тайм</span>
          <span className="board-score">1 : 1</span>
        </div>
        <strong>Манчестер Сити — Арсенал</strong>
      </div>

      <div className="odds-row">
        <span className="odds-name">Исход</span>
        <button type="button" className="odd"><b>П1</b>2.10</button>
        <button type="button" className="odd"><b>X</b>3.40</button>
        <button type="button" className="odd is-hot"><b>П2</b>3.25</button>
      </div>

      <div className="odds-line">
        <span>Тотал больше 2.5</span>
        <span className="odds-val">1.95</span>
      </div>
      <div className="odds-line">
        <span>Обе забьют — да</span>
        <span className="odds-val">1.80</span>
      </div>

      <div className="slip">
        <div>
          <span className="slip-label">Купон · экспресс ×3</span>
          <strong className="slip-coef">7.21</strong>
        </div>
        <span className="slip-pill">маржа 6.5%</span>
      </div>

      <div className="board-ops">
        <div><span>оборот</span><b className="up">↑ 4.2%</b></div>
        <div><span>риск</span><b>под контролем</b></div>
        <div><span>аптайм</span><b>99.98%</b></div>
      </div>
    </div>
  );
}

function StatStrip() {
  return (
    <section className="stats">
      <div className="stats-row">
        {stats.map((s) => (
          <motion.div className="stat" key={s.label} variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function LogoCell({ client }: { client: Client }) {
  const [iconFailed, setIconFailed] = React.useState(false);
  return (
    <motion.div className="logo-cell" variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}>
      <span className="client-logo">
        {!iconFailed && (
          <img
            className="client-fav"
            src={`https://www.google.com/s2/favicons?domain=${client.domain}&sz=128`}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setIconFailed(true)}
          />
        )}
        <span className="client-name">{client.name}</span>
      </span>
    </motion.div>
  );
}

function Clients() {
  return (
    <section className="section section-clients">
      <Eyebrow>Нам доверяют операторы и партнёры</Eyebrow>
      <div className="logo-wall">
        {clients.map((c) => (
          <LogoCell key={c.name} client={c} />
        ))}
      </div>
    </section>
  );
}

function LineIcon({ name }: { name: IconName }) {
  const common = {
    width: 28,
    height: 28,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    // Миграция без простоя — стрелки замены игрока (substitution)
    case 'migrate':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M8 20V6" />
          <path d="m4.8 9.2 3.2-3.4 3.2 3.4" />
          <path d="M16 4v14" />
          <path d="m12.8 14.8 3.2 3.4 3.2-3.4" />
        </svg>
      );
    // Локализация под рынок — футбольный мяч
    case 'globe':
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8.6 15.2 11l-1.2 3.7h-4L8.8 11Z" />
          <path d="M12 8.6V3.4" />
          <path d="m15.2 11 4.6-1.7" />
          <path d="m14 14.7 2.7 4.7" />
          <path d="m10 14.7-2.7 4.7" />
          <path d="M8.8 11 4.2 9.3" />
        </svg>
      );
    // Риски под контролем — клубный щит-герб с галочкой
    case 'shield':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 3 5 6v5c0 4.2 2.8 7.6 7 9 4.2-1.4 7-4.8 7-9V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    // Все каналы — спортивное табло + мобайл
    case 'channels':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="4" width="12" height="8.5" rx="1.5" />
          <path d="M9 7v2.5" />
          <path d="M6 6.5h1.5" />
          <path d="M10.5 6.5H12" />
          <path d="M9 12.5V16" />
          <path d="M6 16h6" />
          <rect x="17" y="9" width="4.5" height="7.5" rx="1" />
        </svg>
      );
    // Модуль букмекера — купон-ставка
    case 'module':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M5 5h14a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V6a1 1 0 0 1 1-1Z" />
          <path d="M8.5 9.5h7" />
          <path d="M8.5 13h4.5" />
        </svg>
      );
    // Под ключ — кубок (готовое решение = победа)
    case 'key':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M7.5 4h9v3a4.5 4.5 0 0 1-9 0Z" />
          <path d="M7.5 5H6a2 2 0 0 0 2 2" />
          <path d="M16.5 5H18a2 2 0 0 1-2 2" />
          <path d="M12 11.5v2.5" />
          <path d="M9.8 19.5l.7-5.5h3l.7 5.5Z" />
          <path d="M8.3 19.5h7.4" />
        </svg>
      );
    // Розница — терминал самообслуживания
    case 'store':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="4.5" y="3.5" width="15" height="10.5" rx="1.5" />
          <path d="M8 8h8" />
          <path d="M8 11h5" />
          <path d="M12 14v2.5" />
          <path d="M8.5 20.5l1-4h5l1 4Z" />
          <path d="M7.5 20.5h9" />
        </svg>
      );
    // White Label — игровая майка (бренд на форме)
    case 'label':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M8.5 4 6 5 3.5 8.5 6.5 11 8 9.7V20h8V9.7L17.5 11l3-2.5L18 5l-2.5-1a3.5 3.5 0 0 1-7 0Z" />
          <path d="M11.6 13.5h1.2v4" />
        </svg>
      );
  }
}

function Theses() {
  return (
    <section className="section section--light section-theses">
      <SectionHead
        kicker="Почему Altenar"
        title="Технология, на которой строят регулируемый бизнес"
        lead="Операторы выбирают Altenar не за отдельные функции, а за уверенный запуск, контроль рисков и работу на самых сложных рынках."
      />
      <div className="theses-grid">
        {theses.map((t) => (
          <motion.article className="thesis" key={t.title} variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
            <span className="thesis-icon"><LineIcon name={t.icon} /></span>
            <h3>{t.title}</h3>
            <p>{t.text}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function Proof() {
  return (
    <section className="section section--light section-cases" id="cases">
      <SectionHead
        kicker="Кейсы"
        title="Операторы растут вместе с Altenar"
        lead="Миграции, запуски и партнёрства на регулируемых рынках — с измеримым результатом."
      />
      <div className="cases">
        {cases.map((c) => (
          <motion.article className="case" key={c.company} variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
            <span className="case-tag">{c.tag}</span>
            <div className="case-body">
              <h3>{c.company}</h3>
              <p>{c.text}</p>
            </div>
            <span className="case-market">{c.market}</span>
            <span className="case-result">{c.result}</span>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function Platform({ layer, setLayer }: { layer: number; setLayer: (i: number) => void }) {
  return (
    <section className="section section-platform" id="platform">
      <SectionHead
        kicker="Платформа"
        title="Одна платформа для online, mobile и розницы"
        lead="Коэффициенты, ставки, риски и compliance работают как единая система — вы управляете всем из одного места."
      />
      <div className="platform">
        <ul className="layer-list">
          {platformLayers.map((l, i) => (
            <li key={l.id}>
              <button
                type="button"
                className={`layer ${i === layer ? 'is-active' : ''}`}
                onMouseEnter={() => setLayer(i)}
                onFocus={() => setLayer(i)}
                onClick={() => setLayer(i)}
              >
                <span className="layer-index">{String(i + 1).padStart(2, '0')}</span>
                <span className="layer-name">{l.title}</span>
                <span className="layer-label">{l.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <motion.div className="layer-detail" key={layer} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <span className="layer-detail-label">{platformLayers[layer].label}</span>
          <h3>{platformLayers[layer].title}</h3>
          <p>{platformLayers[layer].description}</p>
          <div className="layer-detail-foot">
            <span>слой {String(layer + 1).padStart(2, '0')} / {String(platformLayers.length).padStart(2, '0')}</span>
            <span>единая платформа Altenar</span>
          </div>
        </motion.div>
      </div>
      <div className="platform-demo-row">
        <a className="platform-demo-link" href="#demo" aria-label="Запросить демо Altenar">
          <span>Запросить демо</span>
          <i aria-hidden="true">→</i>
        </a>
      </div>
    </section>
  );
}

function Products() {
  return (
    <section className="section section-products">
      <SectionHead
        kicker="Продукты"
        title="Четыре продукта — один технологический фундамент"
        lead="От модуля для действующего сайта до запуска под ключ, розницы и White Label."
      />
      <div className="product-grid">
        {products.map((p) => (
          <motion.article className="product" key={p.title} variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
            <span className="product-icon"><LineIcon name={p.icon} /></span>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
            <a className="product-link" href="#demo">
              Узнать подробнее <span aria-hidden="true">→</span>
            </a>
          </motion.article>
        ))}
        <a className="product-demo" href="#demo" aria-label="Запросить демо Altenar">
          <span>Запросить Демо</span>
          <i aria-hidden="true">→</i>
        </a>
      </div>
    </section>
  );
}

function Markets() {
  const [active, setActive] = React.useState<string>('all');
  const region = markets.find((m) => m.code === active) ?? null;

  const highlight = region ? region.countries : markets.flatMap((m) => m.countries);
  const markers: MapMarker[] = markets.flatMap((m) =>
    m.markers.map((mk) => ({ name: mk.name, coordinates: mk.coordinates, active: region ? m.code === active : true })),
  );
  const center: [number, number] = region ? region.center : [10, 12];
  const zoom = region ? region.zoom : 1;

  return (
    <section className="section section--light section-markets" id="markets">
      <SectionHead
        kicker="Рынки"
        title="Карта присутствия Altenar"
        lead="Более 30 регулируемых рынков на четырёх континентах. Выберите регион — карта покажет, где работает платформа."
      />
      <div className="map-nav" role="tablist">
        <button type="button" role="tab" aria-selected={active === 'all'} className={active === 'all' ? 'is-active' : ''} onClick={() => setActive('all')}>
          Все рынки
        </button>
        {markets.map((m) => (
          <button key={m.code} type="button" role="tab" aria-selected={active === m.code} className={active === m.code ? 'is-active' : ''} onClick={() => setActive(m.code)}>
            {m.title}
          </button>
        ))}
      </div>
      <div className="map-layout">
        <div className="map-stage">
          <WorldMap center={center} zoom={zoom} highlight={highlight} markers={markers} />
        </div>
        <motion.div className="map-info" key={region ? region.code : 'all'} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          {region ? (
            <>
              <span className="market-detail-code">{region.code}</span>
              <h3>{region.title}</h3>
              <p>{region.description}</p>
              <div className="market-pills">
                {region.details.map((d) => <span key={d}>{d}</span>)}
              </div>
            </>
          ) : (
            <>
              <span className="market-detail-code">30+</span>
              <h3>Глобальное покрытие</h3>
              <p>Altenar работает на регулируемых рынках Латинской Америки, Северной Америки, Европы и Африки — с локальными видами спорта, языками и требованиями юрисдикций.</p>
              <div className="market-pills">
                {markets.map((m) => <span key={m.code}>{m.title}</span>)}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function Compliance() {
  return (
    <section className="section section--light section-compliance" id="compliance">
      <SectionHead
        kicker="Лицензии и безопасность"
        title="Готовы к проверкам на каждом рынке"
        lead="Лицензии, стандарты безопасности и независимые лаборатории помогают оператору запускаться быстрее и спокойнее проходить проверки."
      />
      <div className="compliance-grid">
        {complianceItems.map((item) => (
          <motion.article className="compliance-card" key={item.code} variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
            <span className="compliance-code">{item.code}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <span className="compliance-scope">{item.scope}</span>
          </motion.article>
        ))}
        <div className="compliance-fill" aria-hidden="true" />
      </div>
    </section>
  );
}

function Awards() {
  return (
    <section className="section section--light section-awards">
      <SectionHead
        kicker="Награды"
        title="Награды и мировое признание"
        lead="Награды SBC, SiGMA, BEGE и Global Regulatory Awards показывают, что продукт, compliance и команды Altenar замечают на разных рынках."
      />
      <div className="award-track">
        {awards.slice(0, 6).map((item) => (
          <article key={`${item.event}-${item.title}`} className="award-card">
            <span className="award-year">{item.year}</span>
            <strong>{item.title}</strong>
            <em>{item.event}</em>
          </article>
        ))}
        <a className="award-all" href="#" aria-label="Все награды Altenar">
          <span>Все награды</span>
          <i aria-hidden="true">→</i>
        </a>
      </div>
    </section>
  );
}

function Capabilities() {
  return (
    <section className="section section-caps">
      <SectionHead
        align="left"
        kicker="Возможности"
        title="Всё для сильного букмекерского продукта"
        lead="Инструменты, которые обычно собирают месяцами, доступны на платформе сразу."
      />
      <div className="caps-grid">
        {capabilities.map((c, i) => (
          <motion.article className="cap" key={c.title} variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
            <span className="cap-index">{String(i + 1).padStart(2, '0')}</span>
            <h3>{c.title}</h3>
            <p>{c.text}</p>
          </motion.article>
        ))}
        <a className="cap-demo" href="#demo" aria-label="Заказать демо Altenar">
          <span>Заказать демо</span>
          <i aria-hidden="true">→</i>
        </a>
      </div>
    </section>
  );
}

function Ecosystem() {
  return (
    <section className="section section--light section-eco">
      <SectionHead
        kicker="Экосистема"
        title="Работаем с ведущими поставщиками индустрии"
        lead="Данные, CRM, контент и платформы — Altenar встроена в зрелую отраслевую экосистему."
      />
      <div className="eco-grid">
        {ecosystem.map((g) => (
          <motion.article className="eco" key={g.role} variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
            <span className="eco-role">{g.role}</span>
            <div className="eco-items">
              {g.items.map((it) => <span key={it}>{it}</span>)}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="section section-final" id="demo">
      <div className="final-grid">
        <motion.div className="final-copy" variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
          <Eyebrow>Демо</Eyebrow>
          <h2>Расскажите о вашем рынке — покажем, как запустить</h2>
          <p>
            Демо — это не обычная форма обратной связи. Это первый разговор о вашем
            рынке, лицензии, текущей платформе и плане запуска.
          </p>
          <ul className="final-list">
            <li>Запуск с нуля</li>
            <li>Миграция с другой платформы</li>
            <li>Розница и омниканальность</li>
            <li>Casino + ставки на спорт</li>
          </ul>
        </motion.div>
        <motion.form className="form" variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} onSubmit={(e) => e.preventDefault()}>
          <label>
            <span>Рынок</span>
            <input placeholder="Бразилия, Перу, Онтарио…" />
          </label>
          <label>
            <span>Текущая ситуация</span>
            <select defaultValue="">
              <option value="" disabled>Выберите вариант</option>
              <option>Запуск нового продукта</option>
              <option>Миграция с другой платформы</option>
              <option>Добавить спорт к casino</option>
              <option>Розница и online</option>
            </select>
          </label>
          <label>
            <span>Лицензии</span>
            <input placeholder="MGA, UKGC, локальная…" />
          </label>
          <button type="submit" className="btn-primary form-submit">
            Отправить заявку
            <span className="btn-arrow" aria-hidden="true">↗</span>
          </button>
        </motion.form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-row">
        <a className="logo" href="#top">
          <img src={assetUrl('altenar-logo.png')} alt="Altenar" />
        </a>
        <p>Ведущая платформа для ставок на спорт для лицензированных операторов.</p>
        <span className="footer-meta">© 2026 Altenar · регулируемые рынки</span>
      </div>
    </footer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
