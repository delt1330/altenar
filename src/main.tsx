import React, { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, type Variants } from 'framer-motion';
import WorldMap, { type MapMarker } from './WorldMap';
import ParticleImage from './components/originkit/SvgParticles';
import GearFlowBridge from './components/GearFlowBridge';
import './styles.css';

// SvgParticles is JS (@ts-nocheck) with forwardRef — loosen props for TS.
const HeroParticles = ParticleImage as React.ComponentType<any>;

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

type IconName = 'key' | 'store' | 'label';
type CaseStudy = {
  tag: string;
  company: string;
  market: string;
  result: string;
  resultLabel: string;
  text: string;
  href: string;
  logo?: string;
};
type Product = { icon: IconName; scenario: string; title: string; text: string; cta: string };
type MarketDetail = { name: string; country: string; year: string; result: string };
type Market = {
  code: string;
  title: string;
  description: string;
  details: MarketDetail[];
  countries: string[];
  markers: { name: string; coordinates: [number, number] }[];
  center: [number, number];
  zoom: number;
};
type Award = { year: string; title: string; event: string; category: string; logo: string };
type NewsItem = {
  date: string;
  read: string;
  tag: string;
  title: string;
  excerpt?: string;
  image: string;
  href: string;
};
type Client = { name: string; domain: string; logo: string };
type ClientGroup = { title: string; clients: Client[] };

const clientGroups: ClientGroup[] = [
  {
    title: 'New market launch',
    clients: [
      { name: 'Wplay', domain: 'wplay.co', logo: 'client-logos/wplay.png' },
      { name: 'Multibet', domain: 'multibet.com', logo: 'client-logos/multibet.png' },
      { name: 'YangaGames', domain: 'yangagames.com', logo: 'client-logos/yangagames.svg' },
      { name: 'Betmotion', domain: 'betmotion.com', logo: 'client-logos/betmotion.svg' },
    ],
  },
  {
    title: 'Migration & scaling',
    clients: [
      { name: 'Palms Bet', domain: 'palmsbet.com', logo: 'client-logos/palms-bet.svg' },
      { name: 'MerkurXtip', domain: 'merkur-xtip.rs', logo: 'client-logos/merkurxtip.png' },
      { name: 'Lottoland', domain: 'lottoland.com', logo: 'client-logos/lottoland.png' },
      { name: '7bet', domain: '7bet.lt', logo: 'client-logos/7bet.png' },
    ],
  },
  {
    title: 'Casino → sports betting',
    clients: [
      { name: 'Rootz / Wildz', domain: 'wildz.com', logo: 'client-logos/rootz-wildz.svg' },
      { name: 'Starcasino', domain: 'starcasino.be', logo: 'client-logos/starcasino.svg' },
      { name: 'Immense Group', domain: 'immensegroup.io', logo: 'client-logos/immense-group.png' },
      { name: 'Vegas.hu', domain: 'vegas.hu', logo: 'client-logos/vegas-hu.png' },
    ],
  },
  {
    title: 'Retail locations',
    clients: [
      { name: 'Golden Palace', domain: 'goldenpalace.be', logo: 'client-logos/golden-palace.svg' },
      { name: 'IsibetPRO Srl', domain: 'isibetpro.it', logo: 'client-logos/isibetpro.png' },
      { name: 'JustBet', domain: 'justbet.cx', logo: 'client-logos/justbet.png' },
      { name: 'Replatz', domain: 'replatz.com', logo: 'client-logos/replatz.png' },
    ],
  },
];

const cases: CaseStudy[] = [
  {
    tag: 'migration',
    company: 'Palms Bet',
    market: 'Bulgaria · Peru',
    result: '+137%',
    resultLabel: 'turnover growth in Peru',
    text: 'Migration to Altenar removed the limits of the previous platform: Palms Bet kept stability in regulated markets, expanded event coverage, and grew turnover by 46% in Bulgaria and 137% in Peru.',
    href: 'https://altenar.com/blog/seamless-migration-delivers-measurable-growth-for-palms-bet/',
    logo: 'client-logos/palms-bet.svg',
  },
  {
    tag: 'omnichannel',
    company: 'Golden Palace',
    market: 'Belgium',
    result: '+50%',
    resultLabel: 'profit growth',
    text: 'Altenar connected online, mobile, gaming terminals, and retail outlets for Golden Palace into one omnichannel model for regulated Belgium. After the switch, profit grew by 50%.',
    href: 'https://altenar.com/cases/goldenpalace/',
    logo: 'client-logos/golden-palace.svg',
  },
  {
    tag: 'new product',
    company: 'Immense Group',
    market: 'Multi-brand',
    result: '4 brands',
    resultLabel: 'global launch',
    text: 'A casino group with Mr Vegas, Videoslots, and MegaRiches received managed sportsbook technology from Altenar to launch betting across brands and introduce DBET as a dedicated sportsbook project.',
    href: 'https://altenar.com/cases/immense-group/',
    logo: 'client-logos/immense-group-cropped.svg',
  },
  {
    tag: 'partnership',
    company: 'Greentube',
    market: 'Europe',
    result: '2026',
    resultLabel: 'strategic partnership',
    text: 'Greentube integrates Altenar technology to expand sports betting on regulated European markets and deepen player engagement.',
    href: 'https://altenar.com/blog/altenar-and-greentube-announce-strategic-sportsbook-partnership/',
    logo: 'client-logos/greentube.svg',
  },
];

const products: Product[] = [
  {
    icon: 'key',
    scenario: 'Need a complete launch',
    title: 'Turnkey Sportsbook Solution',
    text: 'Turnkey sportsbook solution provides the software and management tools needed to stand out and scale across desktop, mobile, and retail channels. With integrated core systems, a front end CMS, and 24/7 support, you can focus entirely on market entry and growth strategy. Bring your sportsbook to market fast and with everything in sync.',
    cta: 'Launch turnkey',
  },
  {
    icon: 'store',
    scenario: 'Expand into venues',
    title: 'Retail / Landbase solution',
    text: 'Retail solution seamlessly extends your brand into cashiers, kiosks, or venues without the need for on-site tech. Manage bets, payments, and accounts across every location through a single interface featuring intuitive touchscreen SSBTs and full remote monitoring. Fully integrated with your existing sportsbook and PAM stack, it ensures a unified omnichannel experience with the same credibility behind every screen and betting slip.',
    cta: 'Realworld launch',
  },
  {
    icon: 'label',
    scenario: 'Launch under your brand',
    title: 'White label solution',
    text: 'Designed for entrepreneurs and challenger brands, our white-label solution ensures a fast, impactful launch with licensing, payment, and regulatory setups ready. You get full control over your front end and marketing, with smooth upgrade paths as you scale without changing providers. Move from plan to product in weeks with a proven sportsbook.',
    cta: 'Launch Fast',
  },
];

const markets: Market[] = [
  {
    code: 'LATAM',
    title: 'Latin America',
    description: 'Fast-growing regulated markets, football as the main driver, and demand for local support.',
    details: [
      { name: 'Brazil', country: 'Brazil', year: '2025', result: 'Sportsbook localisation prepared for a regulated launch.' },
      { name: 'Peru', country: 'Peru', year: '2024', result: 'Operator migration to the Altenar platform launched.' },
      { name: 'Colombia', country: 'Colombia', year: '2023', result: 'Local markets, reporting, and operational support configured.' },
      { name: 'Uruguay', country: 'Uruguay', year: '2022', result: 'Regional sports and odds management enabled.' },
    ],
    countries: ['Brazil', 'Peru', 'Colombia', 'Uruguay', 'Argentina', 'Chile', 'Mexico'],
    markers: [
      { name: 'Brazil', coordinates: [-47.9, -15.8] },
      { name: 'Peru', coordinates: [-77.0, -12.0] },
      { name: 'Colombia', coordinates: [-74.1, 4.6] },
      { name: 'Uruguay', coordinates: [-56.2, -34.9] },
    ],
    center: [-65, -15],
    zoom: 2.1,
  },
  {
    code: 'NA',
    title: 'North America',
    description: 'New Canadian licences and operators moving into a regulated environment.',
    details: [
      { name: 'Ontario', country: 'Canada', year: '2022', result: 'Platform adapted to regulated market requirements.' },
      { name: 'Alberta', country: 'Canada', year: '2024', result: 'Product configuration prepared for a regional launch.' },
      { name: 'USA', country: 'United States of America', year: '2025', result: 'Market setup prepared for partner integrations.' },
    ],
    countries: ['Canada', 'United States of America'],
    markers: [
      { name: 'Ontario', coordinates: [-79.4, 43.7] },
      { name: 'Alberta', coordinates: [-114.1, 51.0] },
      { name: 'USA', coordinates: [-95.0, 39.0] },
    ],
    center: [-96, 48],
    zoom: 2.1,
  },
  {
    code: 'EU',
    title: 'Europe',
    description: 'Mature markets with high requirements for licensing, security, and reporting.',
    details: [
      { name: 'Malta', country: 'Malta', year: '2011', result: 'Operational base established for European markets.' },
      { name: 'United Kingdom', country: 'United Kingdom', year: '2020', result: 'Platform prepared for UKGC requirements and reporting.' },
      { name: 'Denmark', country: 'Denmark', year: '2021', result: 'Local product rules and compliance processes configured.' },
      { name: 'Belgium', country: 'Belgium', year: '2023', result: 'Omnichannel model launched for online and retail.' },
      { name: 'Portugal', country: 'Portugal', year: '2019', result: 'Software certification obtained.' },
    ],
    countries: ['United Kingdom', 'Denmark', 'Belgium', 'Portugal', 'Spain', 'Italy', 'Germany', 'Sweden', 'Netherlands'],
    markers: [
      { name: 'Malta', coordinates: [14.5, 35.9] },
      { name: 'United Kingdom', coordinates: [-0.1, 51.5] },
      { name: 'Denmark', coordinates: [12.6, 55.7] },
      { name: 'Belgium', coordinates: [4.4, 50.8] },
      { name: 'Portugal', coordinates: [-9.1, 38.7] },
    ],
    center: [10, 51],
    zoom: 3.4,
  },
  {
    code: 'AFR',
    title: 'Africa',
    description: 'Mobile-first journeys, retail formats, and local product adaptation.',
    details: [
      { name: 'South Africa', country: 'South Africa', year: '2021', result: 'Product adapted for local sports markets.' },
      { name: 'Nigeria', country: 'Nigeria', year: '2023', result: 'Mobile journeys and regional traffic support prepared.' },
      { name: 'Kenya', country: 'Kenya', year: '2024', result: 'Markets and operational processes set up for launch.' },
    ],
    countries: ['South Africa', 'Nigeria', 'Kenya'],
    markers: [
      { name: 'South Africa', coordinates: [28.0, -26.2] },
      { name: 'Nigeria', coordinates: [3.4, 6.5] },
      { name: 'Kenya', coordinates: [36.8, -1.3] },
    ],
    center: [20, 2],
    zoom: 2.0,
  },
  {
    code: 'ASIA',
    title: 'Asia',
    description: 'Diverse sports habits, mobile journeys, and localisation requirements.',
    details: [
      { name: 'India', country: 'India', year: '2022', result: 'Sports preferences and mobile user journeys localised.' },
      { name: 'Philippines', country: 'Philippines', year: '2023', result: 'Integrations and regional sportsbook shelf prepared.' },
      { name: 'Kazakhstan', country: 'Kazakhstan', year: '2024', result: 'Local language and operational parameters configured.' },
    ],
    countries: ['India', 'Philippines', 'Kazakhstan'],
    markers: [
      { name: 'India', coordinates: [77.2, 28.6] },
      { name: 'Philippines', coordinates: [121.0, 14.6] },
      { name: 'Kazakhstan', coordinates: [71.4, 51.2] },
    ],
    center: [88, 30],
    zoom: 2.1,
  },
];

const awards: Award[] = [
  {
    year: '2026',
    title: 'Best sportsbook supplier of the year',
    event: 'SBC Americas Awards',
    category: 'Americas',
    logo: 'award-logos/sbc-americas-2026.png',
  },
  {
    year: '2026',
    title: 'Best workplace',
    event: 'SiGMA Europe Awards',
    category: 'Team',
    logo: 'award-logos/sigma-europe-2026.png',
  },
  {
    year: '2026',
    title: 'Best Online Sportsbook Providers',
    event: 'SiGMA Brazil',
    category: 'South America',
    logo: 'award-logos/sigma-brazil-2026.png',
  },
  {
    year: '2025',
    title: 'Best live betting product',
    event: 'SiGMA South Asia Awards',
    category: 'Live',
    logo: 'award-logos/sigma-south-asia-2025.png',
  },
  {
    year: '2025',
    title: 'Most innovative sportsbook feature',
    event: 'SiGMA Euro-Med Awards',
    category: 'Product',
    logo: 'award-logos/sigma-innovation-2025.png',
  },
  {
    year: '2025',
    title: 'Best Online Sportsbook Provider',
    event: 'SiGMA Americas',
    category: 'Platform',
    logo: 'award-logos/sigma-americas-2025.svg',
  },
  {
    year: '2024',
    title: 'Outstanding Contribution to Sports Betting Integrity',
    event: 'Global Regulatory Awards',
    category: 'Regulation',
    logo: 'award-logos/global-regulatory-2024.png',
  },
];

const news: NewsItem[] = [
  {
    date: '23.06.2026',
    read: '3 min',
    tag: 'Partnership',
    title: 'Logrand partners with Altenar to launch enhanced omni-channel sportsbook experience',
    excerpt: 'The operator unites online and retail on Altenar’s betting platform for a seamless multi-channel experience.',
    image: 'news/logrand.webp',
    href: 'https://altenar.com/news/',
  },
  {
    date: '18.06.2026',
    read: '2 min',
    tag: 'Partnership',
    title: 'Altenar and Greentube Announce Strategic Sportsbook Partnership',
    image: 'news/greentube.webp',
    href: 'https://altenar.com/news/',
  },
  {
    date: '11.06.2026',
    read: '2 min',
    tag: 'Award',
    title: 'Altenar Named Sportsbook Supplier of the Year at SBC Americas Awards 2026',
    image: 'news/sbc-americas.webp',
    href: 'https://altenar.com/news/',
  },
  {
    date: '10.06.2026',
    read: '2 min',
    tag: 'Regulation',
    title: 'Altenar Received Approval to Enter Alberta’s iGaming Market',
    image: 'news/alberta.webp',
    href: 'https://altenar.com/news/',
  },
  {
    date: '03.06.2026',
    read: '2 min',
    tag: 'Case',
    title: 'Seamless migration delivers measurable growth for Palms Bet',
    image: 'news/palms-bet.webp',
    href: 'https://altenar.com/news/',
  },
  {
    date: '28.05.2026',
    read: '2 min',
    tag: 'Award',
    title: 'Altenar Wins Best Workplace at SiGMA Europe Awards',
    image: 'news/sigma-europe.webp',
    href: 'https://altenar.com/news/',
  },
];

const seoParagraphs = [
  'Leading sportsbook provider Altenar has announced the launch of Super Early Payout to give soccer bettors more chance to celebrate winning moments before the final whistle.',
  'The new promotion has gone live in time for the World Cup 2026 and means bettors who back a team in eligible markets will have their bet settled as a winner as soon as their selected team takes a one-goal lead, regardless of the final result.',
  'This is an upgrade to the popular Early Payout offer, which requires a team to lead by two goals before qualifying bets are settled. Reducing the threshold to one goal allows Super Early Payout to deliver faster wins and an even more engaging betting experience.',
  'Operators can configure the promotion for a specific team or both teams, while also having the option to replace the standard 1X2 market for a more prominent promotional experience.',
  'Altenar has also brought greater flexibility to promotional campaigns with improvements to the Early Payout feature, which can now be applied directly to selected events rather than entire championships, making it easier to highlight key World Cup fixtures and other high-profile matches. The enhancement supports both two-goal and three-goal Early Payout configurations and can also be applied to one or both teams. By moving beyond championship-wide set-ups, operators can create more targeted campaigns.',
  'Expanded markets have also enriched Altenar’s soccer coverage at major tournaments such as the World Cup. New additions allow bettors more choice when it comes to player performance, including how goals or shots were made (by foot, header, outside the box etc).',
  'Player specials have been expanded to include substitute coverage, allowing betting opportunities to remain relevant even when the originally selected player is replaced by a substitute.',
  'A comprehensive range of player, team and match markets are also now available for matches that go to extra time, creating additional betting opportunities during the knockout stage of tournaments such as the World Cup.',
  'These new features follow on from the World Cup Lobby, which was recently released by Altenar as a dedicated event hub designed to enhance player engagement and streamline navigation during the upcoming tournament.',
];

const navLinks = [
  { label: 'About', href: 'https://altenar.com/about/' },
  { label: 'Products', href: 'https://altenar.com/products/' },
  { label: 'Clients & partners', href: 'https://altenar.com/cases/' },
  { label: 'Contacts', href: 'https://altenar.com/contacts/' },
];

const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

function clientLogoId(name: string) {
  return `logo-cell-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
}

const allClientLogos = clientGroups.flatMap((g) => g.clients);
const clientLogoTargets = allClientLogos.map((c) => ({
  id: clientLogoId(c.name),
  imageUrl: assetUrl(c.logo),
}));

function App() {
  const heroParticlesRef = useRef<any>(null);

  return (
    <>
      <ColumnGuides />
      <Header />
      <GearFlowBridge
        heroRef={heroParticlesRef}
        particleSize={10}
        color="#f3f4f5"
        logoTargets={clientLogoTargets}
      />
      <main className="page">
        <section className="hero-stack" id="top">
          <div className="hero-bg-particles" aria-hidden="true">
            <HeroParticles
              ref={heroParticlesRef}
              particleCount={40}
              particleGap={5}
              particleSize={10}
              particleShape="square"
              particleColor="single"
              singleColor="#f3f4f5"
              assembleAfterMoves={4}
              shapeStory
              shapeAfterMoves={4}
              hoverEnabled
              hoverConfig={{
                hoverType: 'hide',
                hideType: 'scatter',
                transition: { duration: 2.8, ease: 'smootherstep' },
                roamWidth: 0,
                roamHeight: 0,
                roamOpacity: 0.35,
                roamShape: 'rectangle',
              }}
              repulsionEnabled
              repulsionConfig={{
                repulsionForce: 14,
                repulsionRadius: 110,
                repulsionMode: 'outside',
              }}
              imageConfig={{
                image: assetUrl('altenar-mark-solid.png'),
                mode: 'fit',
                scale: 6,
              }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <Hero />
        </section>
        <Clients />
        <Products />
        <Markets />
        <Proof />
        <Awards />
        <News />
        <FinalCta />
        <SeoBlock />
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
  const [isInverted, setIsInverted] = React.useState(false);
  const [isHidden, setIsHidden] = React.useState(false);

  React.useEffect(() => {
    let frame = 0;
    let lastScrollY = window.scrollY;

    const updateTheme = () => {
      frame = 0;
      const currentScrollY = window.scrollY;
      const sampleY = 76;
      const sampleX = window.innerWidth / 2;
      const elements = document.elementsFromPoint(sampleX, sampleY);
      const overLightSection = elements.some((element) => element.closest('.section--light'));
      setIsInverted(overLightSection);
      setIsHidden(currentScrollY > lastScrollY && currentScrollY > 120);
      lastScrollY = Math.max(currentScrollY, 0);
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateTheme);
    };

    updateTheme();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, []);

  return (
    <>
      <header className={`topbar ${isInverted ? 'is-inverted' : ''} ${isHidden && !open ? 'is-hidden' : ''}`}>
        <a className="logo" href="#top">
          <img src={assetUrl(isInverted ? 'Altenar_Logo_Dark.svg' : 'Altenar_Logo.svg')} alt="Altenar" />
        </a>
        <nav className="topnav">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href}>{l.label}</a>
          ))}
        </nav>
        <div className="topbar-right">
          <a className="topbar-tool lang-switch" href="https://altenar.com/en-us/" aria-label="Выбрать язык">
            RU
          </a>
          <a className="topbar-tool search-link" href="https://altenar.com/ru/search/" aria-label="Поиск по сайту">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.2" />
              <path d="M12.4 12.4L17 17" />
            </svg>
          </a>
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
        {navLinks.map((l, i) => (
          <motion.a
            key={l.label}
            href={l.href}
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
  return <span className="eyebrow">{children}</span>;
}

function SectionHead({
  kicker,
  title,
  lead,
  align = 'center',
}: {
  kicker: string;
  title: React.ReactNode;
  lead?: string;
  align?: 'left' | 'center' | 'right';
}) {
  return (
    <motion.div className={`section-head section-head--${align}`} variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-90px' }}>
      <Eyebrow>{kicker}</Eyebrow>
      <h2>{title}</h2>
      {lead ? <p>{lead}</p> : null}
    </motion.div>
  );
}

function Hero() {
  return (
    <div className="hero">
      <div className="hero-grid">
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
          <h1 className="hero-slogan">
            <span className="hero-slogan-line">Stability</span>
            <span className="hero-slogan-line">meets</span>
            <span className="hero-slogan-line">flexibility</span>
          </h1>
          <p className="hero-lead">
            As your strategic partner, Altenar guides licensed operators to maximize profits and enter new markets confidently. We deliver highly flexible software—from API to fully managed operations—letting your team focus entirely on performance. Our cooperation ensures lightning-fast deployment, localized tools, and 24/7 trading support built to scale your business for shared growth.
          </p>
          <div className="hero-cta">
            <a className="btn-primary" href="#demo">
              Contact Us
              <span className="btn-arrow" aria-hidden="true">↗</span>
            </a>
            <a className="btn-ghost" href="#scenarios">See solutions</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function LogoCell({ client }: { client: Client }) {
  const id = clientLogoId(client.name);
  return (
    <motion.a
      id={id}
      className="logo-cell logo-cell--particle"
      href="#cases"
      aria-label={`View cases for ${client.name}`}
      data-logo-id={id}
      data-logo-src={assetUrl(client.logo)}
      variants={rise}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
    >
      <span className="client-logo-mark">
        {/* Also used as the solid hover state over the particle silhouette. */}
        <img
          className="client-logo-img client-logo-img--solid"
          src={assetUrl(client.logo)}
          alt=""
          aria-hidden="true"
          loading="lazy"
        />
      </span>
    </motion.a>
  );
}

function Clients() {
  return (
    <section className="section section-clients" id="clients">
      <SectionHead
        kicker="Clients"
        title="Trusted by operators worldwide"
        lead="A selection of partners who launch, migrate, and scale with Altenar."
      />
      <div className="client-groups">
        {clientGroups.map((group) => (
          <motion.article className="client-group" key={group.title} variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}>
            <span className="client-group-title">{group.title}</span>
            <div className="client-group-list">
              {group.clients.map((c) => (
                <LogoCell key={`${group.title}-${c.name}`} client={c} />
              ))}
            </div>
          </motion.article>
        ))}
      </div>
      <a className="client-cases-link" href="#cases">View all cases <span aria-hidden="true">→</span></a>
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
    case 'key':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3.5" y="5" width="12" height="8.5" rx="1.4" />
          <path d="M9.5 13.5v2.7" />
          <path d="M6.8 17.5h5.4" />
          <path d="M6.8 8.5h5.4" />
          <path d="M6.8 11h3.2" />
          <rect x="16.5" y="8" width="4" height="9.5" rx="1" />
          <path d="M18.5 15.5h.01" />
        </svg>
      );
    case 'store':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="4" y="7" width="16" height="10" rx="1.4" />
          <circle cx="12" cy="12" r="2.2" />
          <path d="M7 10.2v-.8h1.3" />
          <path d="M17 10.2v-.8h-1.3" />
          <path d="M7 13.8v.8h1.3" />
          <path d="M17 13.8v.8h-1.3" />
          <path d="M6.5 12h1.2" />
          <path d="M16.3 12h1.2" />
        </svg>
      );
    case 'label':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M8.5 4 6 5 3.5 8.5 6.5 11 8 9.7V20h8V9.7L17.5 11l3-2.5L18 5l-2.5-1a3.5 3.5 0 0 1-7 0Z" />
          <path d="M11.6 13.5h1.2v4" />
        </svg>
      );
  }
}

function Products() {
  return (
    <section className="section section-products" id="scenarios">
      <SectionHead
        kicker="Solutions"
        title="Our solutions"
        lead="Three ways to launch and scale a sportsbook with Altenar."
      />
      <div className="product-grid">
        {products.map((p) => (
          <motion.article className="product" key={p.title} variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
            <span className="product-icon"><LineIcon name={p.icon} /></span>
            <span className="product-scenario">{p.scenario}</span>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
            <a className="product-link" href="#demo">
              {p.cta} <span aria-hidden="true">→</span>
            </a>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function Markets() {
  const [active, setActive] = React.useState<string>('all');
  const [selectedMarketDetail, setSelectedMarketDetail] = React.useState<string | null>(null);
  const region = markets.find((m) => m.code === active) ?? null;
  const selectedDetail = region?.details.find((d) => d.name === selectedMarketDetail) ?? null;
  const selectMarketDetail = (market: Market, detail: MarketDetail) => {
    setActive(market.code);
    setSelectedMarketDetail(detail.name);
  };
  const selectDetailByCountry = (country: string) => {
    const match = markets.flatMap((market) => market.details.map((detail) => ({ market, detail }))).find(({ detail }) => detail.country === country);
    if (match) selectMarketDetail(match.market, match.detail);
  };
  const selectDetailByMarker = (name: string) => {
    const match = markets.flatMap((market) => market.details.map((detail) => ({ market, detail }))).find(({ detail }) => detail.name === name);
    if (match) selectMarketDetail(match.market, match.detail);
  };

  const highlight = selectedDetail ? [selectedDetail.country] : active === 'all' ? markets.flatMap((m) => m.countries) : [];
  const markers: MapMarker[] = markets.flatMap((m) =>
    m.markers.map((mk) => ({
      name: mk.name,
      coordinates: mk.coordinates,
      active: selectedDetail ? mk.name === selectedDetail.name : active === 'all',
      label: selectedDetail?.name === mk.name ? selectedDetail.name : undefined,
      year: selectedDetail?.name === mk.name ? selectedDetail.year : undefined,
    })),
  );
  const center: [number, number] = region ? region.center : [10, 12];
  const zoom = region ? region.zoom : 1;

  return (
    <section className="section section--light section-markets" id="markets">
      <SectionHead
        kicker="Territories of expertise"
        title="Licences and regions of operation"
        lead="Altenar works with licensed operators across multiple jurisdictions, supporting launches, expansions, and long-term operations in environments where regulatory expectations are clearly defined and actively enforced."
      />
      <div className="map-nav" role="tablist">
        <button type="button" role="tab" aria-selected={active === 'all'} className={active === 'all' ? 'is-active' : ''} onClick={() => { setActive('all'); setSelectedMarketDetail(null); }}>
          All territories
        </button>
        {markets.map((m) => (
          <button key={m.code} type="button" role="tab" aria-selected={active === m.code} className={active === m.code ? 'is-active' : ''} onClick={() => { setActive(m.code); setSelectedMarketDetail(null); }}>
            {m.title}
          </button>
        ))}
      </div>
      <div className="map-layout">
        <div className="map-stage">
          <WorldMap
            center={center}
            zoom={zoom}
            highlight={highlight}
            markers={markers}
            onCountryClick={selectDetailByCountry}
            onMarkerClick={selectDetailByMarker}
          />
        </div>
        <motion.div className="map-info" key={region ? region.code : 'all'} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          {region ? (
            <>
              <h3>{region.title}</h3>
              <p>{region.description}</p>
              <div className="market-pills">
                {region.details.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    className={selectedMarketDetail === d.name ? 'is-active' : ''}
                    onClick={() => selectMarketDetail(region, d)}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
              <div className={`market-result ${selectedDetail ? '' : 'is-empty'}`}>
                {selectedDetail && (
                  <>
                    <span>{selectedDetail.name} · {selectedDetail.year}</span>
                    <p>{selectedDetail.result}</p>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <h3>Global coverage</h3>
              <p>
                Licences and compliance support across regulated jurisdictions.{' '}
                <a href="https://altenar.com/services/licensing-and-compliance-support/" target="_blank" rel="noreferrer">View licensing details</a>
              </p>
              <div className="market-metrics" aria-label="Altenar territory metrics">
                <div>
                  <strong>90</strong>
                  <span>Countries of operation</span>
                </div>
                <div>
                  <strong>50</strong>
                  <span>Licenses obtained</span>
                </div>
                <div>
                  <strong>1500</strong>
                  <span>Successful clients</span>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function Proof() {
  return (
    <section className="section section--light section-cases" id="cases">
      <SectionHead
        kicker="Clients and Cases"
        title="Growing together with our clients"
        lead="Altenar is dedicated to an idea of growing together with our clients. We believe that ambitions unlock infinite growth in the partnership."
      />
      <div className="cases">
        {cases.map((c) => (
          <motion.a className="case" key={c.company} href={c.href} variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
            <span className="case-brand">
              {c.logo ? (
                <img src={assetUrl(c.logo)} alt={c.company} loading="lazy" />
              ) : (
                <span className="case-logo-text">{c.company}</span>
              )}
            </span>
            <span className="case-proof">
              <span className="case-market">{c.market}</span>
              <strong className="case-result">{c.result}</strong>
              <span className="case-result-label">{c.resultLabel}</span>
            </span>
            <div className="case-body">
              <span className="case-copy">
                <h3>{c.company}</h3>
                <p>{c.text}</p>
                <span className="case-tag">{c.tag}</span>
              </span>
              <span className="case-arrow" aria-hidden="true">↗</span>
            </div>
          </motion.a>
        ))}
        <a className="case-all" href="#demo" aria-label="Contact us">
          <span>Contact us</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}

function Awards() {
  return (
    <section className="section section--light section-awards" id="industry-proof">
      <SectionHead kicker="Awards" title="Industry recognition" />
      <div className="award-track">
        {awards.slice(0, 10).map((item) => (
          <article key={`${item.event}-${item.title}`} className="award-card">
            <span className="award-logo">
              <img src={assetUrl(item.logo)} alt={item.event} loading="lazy" />
            </span>
            <span className="award-meta">{item.year} · {item.category}</span>
            <strong>{item.title}</strong>
            <em>{item.event}</em>
          </article>
        ))}
        <a className="award-all" href="https://altenar.com/about/" aria-label="All Altenar awards">
          <span>All awards</span>
          <i aria-hidden="true">→</i>
        </a>
      </div>
    </section>
  );
}

function News() {
  const [featured, ...rest] = news;

  return (
    <section className="section section--light section-news" id="news">
      <SectionHead
        align="left"
        kicker="Company news"
        title="Company news"
      />
      <div className="news-track">
        <a className="news-card news-card--wide" href={featured.href}>
          <span className="news-visual">
            <img src={assetUrl(featured.image)} alt="" loading="lazy" />
          </span>
          <span className="news-card-body">
            <span className="news-meta">{featured.date} · {featured.read}</span>
            <h3>{featured.title}</h3>
          </span>
        </a>
        {rest.map((item) => (
          <a className="news-card" key={item.title} href={item.href}>
            <span className="news-visual">
              <img src={assetUrl(item.image)} alt="" loading="lazy" />
            </span>
            <span className="news-card-body">
              <span className="news-meta">{item.date} · {item.read}</span>
              <h3>{item.title}</h3>
            </span>
          </a>
        ))}
        <a className="news-card news-card--cta" href="https://altenar.com/news/" aria-label="All company news">
          <span>All news</span>
          <i aria-hidden="true">→</i>
        </a>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="section section-final" id="demo">
      <div className="final-grid">
        <motion.div className="final-copy" variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
          <Eyebrow>Contact</Eyebrow>
          <h2>Where your ambitions unlock growth</h2>
          <p>
            Tell us which market you are targeting and which solution you need. Altenar will help you launch, expand, and scale with confidence.
          </p>
          <ul className="final-list">
            <li>Turnkey sportsbook</li>
            <li>Retail / landbase</li>
            <li>White label</li>
            <li>Licensed market entry</li>
          </ul>
        </motion.div>
        <motion.form className="form" variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} onSubmit={(e) => e.preventDefault()}>
          <label>
            <span>Name</span>
            <input placeholder="Your name" />
          </label>
          <label>
            <span>Work email</span>
            <input type="email" placeholder="name@company.com" />
          </label>
          <label>
            <span>Company</span>
            <input placeholder="Company name" />
          </label>
          <label>
            <span>Region</span>
            <input placeholder="Europe, Latin America, North America…" />
          </label>
          <label>
            <span>What you need</span>
            <select defaultValue="">
              <option value="" disabled>Select an option</option>
              <option>Turnkey sportsbook</option>
              <option>Retail / landbase</option>
              <option>White label</option>
            </select>
          </label>
          <label>
            <span>Message</span>
            <textarea placeholder="Briefly describe your market, current stack, and timeline" />
          </label>
          <button type="submit" className="btn-primary form-submit">
            Contact Us
            <span className="btn-arrow" aria-hidden="true">↗</span>
          </button>
        </motion.form>
      </div>
    </section>
  );
}

function SeoBlock() {
  const columnCount = 4;
  const baseSize = Math.floor(seoParagraphs.length / columnCount);
  const remainder = seoParagraphs.length % columnCount;
  const columns: string[][] = [];
  let cursor = 0;

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const size = baseSize + (columnIndex < remainder ? 1 : 0);
    columns.push(seoParagraphs.slice(cursor, cursor + size));
    cursor += size;
  }

  return (
    <section className="section section--light section-seo" id="seo" aria-label="SEO">
      <div className="seo-grid">
        {columns.map((paragraphs, columnIndex) => (
          <div className="seo-col" key={`seo-col-${columnIndex}`}>
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <a className="footer-logo-small" href="#top" aria-label="Altenar">
          <img src={assetUrl('footer-brand/logo-small.svg')} alt="Altenar" />
        </a>
        <div className="footer-cell footer-socials">
          <span className="footer-label">© 2026 Altenar. All rights reserved.</span>
          <div className="footer-social-links" aria-label="Altenar social links">
            <a href="https://www.linkedin.com/company/altenar" target="_blank" rel="noreferrer" aria-label="LinkedIn Altenar">in</a>
            <a href="https://www.youtube.com/@altenarb2b" target="_blank" rel="noreferrer" aria-label="YouTube Altenar">yt</a>
            <a href="https://www.instagram.com/altenar_b2b/" target="_blank" rel="noreferrer" aria-label="Instagram Altenar">ig</a>
          </div>
        </div>
        <div className="footer-cell footer-legal-copy">
          <p>The Altenar logo and visual assets are intellectual property and protected from unauthorised use.</p>
          <a className="footer-more-link" href="https://altenar.com/" target="_blank" rel="noreferrer">Learn more</a>
        </div>
        <div className="footer-cell footer-company-copy">
          <p>Altenar’s activity is licensed and regulated by the Malta Gaming Authority.</p>
          <a className="footer-more-link" href="https://altenar.com/" target="_blank" rel="noreferrer">Learn more</a>
        </div>
        <div className="footer-brand">
          <img src={assetUrl('footer-brand/Altenar_Brand.svg')} alt="Altenar" />
        </div>
      </div>
    </footer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
