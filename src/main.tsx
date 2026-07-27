import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, type Variants } from 'framer-motion';
import WorldMap, { type MapMarker } from './WorldMap';
import ParticleImage from './components/originkit/SvgParticles';
import GearFlowBridge from './components/GearFlowBridge';
import CaseBrandParticles from './components/CaseBrandParticles';
import FooterBrandParticles from './components/FooterBrandParticles';
import MapParticles from './components/MapParticles';
import HeroMarkLoop from './components/HeroMarkLoop';
import HeroMatchBoard from './components/HeroMatchBoard';
import ScrollProgressBar from './components/ScrollProgressBar';
import { CtaLink } from './components/CtaLink';
import WipeReveal from './components/WipeReveal';
import { useTextScramble } from './components/textScramble';
import './styles.css';

// SvgParticles is JS (@ts-nocheck) with forwardRef — loosen props for TS.
const HeroParticles = ParticleImage as React.ComponentType<any>;

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

/** Temporary: turn off hero particle / bridge motion. Flip to true to restore. */
const HERO_MOTION_ENABLED = true;
/** New hero: mark ↔ ALTENAR particle loop (default on). */
const HERO_MARK_LOOP = true;
/** Legacy: slogan words assembled from particles. Keep for rollback. */
const HERO_SLOGAN_FROM_PARTICLES = false;
/** Experiment: ARG–ENG 1986 match particle story (frame 1). Overrides mark/slogan loops. */
const HERO_MATCH_1986 = true;
/** Local hero sandbox: hide all sections below hero. Flip to false to restore page. */
const HERO_ONLY = false;

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
type Product = {
  icon: IconName;
  scenario: string;
  title: string;
  text: string;
  cta: string;
  nav: string;
  /** Module labels shown as chips (from product/service pages). */
  chips: string[];
};
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
    nav: 'Turnkey',
    chips: [
      'Premium Data Feeds',
      'Trading & Risk Management',
      'Multi-channel Frontend',
      'Custom content management',
      '24/7 Business Support',
      'Bonus Engine',
      'Bet Builder',
      'Cash Out',
      'Boosted Odds',
    ],
  },
  {
    icon: 'store',
    scenario: 'Expand into venues',
    title: 'Retail / Landbase solution',
    text: 'Retail solution seamlessly extends your brand into cashiers, kiosks, or venues without the need for on-site tech. Manage bets, payments, and accounts across every location through a single interface featuring intuitive touchscreen SSBTs and full remote monitoring. Fully integrated with your existing sportsbook and PAM stack, it ensures a unified omnichannel experience with the same credibility behind every screen and betting slip.',
    cta: 'Realworld launch',
    nav: 'Retail',
    chips: [
      'Cashier & Terminal Solutions',
      'Centralised Back Office',
      'Remote Operations',
      'Tailor-made Configuration',
      '24/7 Business Support',
      'Omnichannel Experience',
      'Self-service Betting Terminals',
      'Bet Reservation',
      'Live & Pre-match Betting',
    ],
  },
  {
    icon: 'label',
    scenario: 'Launch under your brand',
    title: 'White label solution',
    text: 'Altenar’s white-label offering provides operators with a faster, lower-risk route to market, combining proven technology with operational support. Access a fully-managed platform with payment gateways, player management, and features designed to support regulatory requirements. Flexible configuration reflects your brand identity while Altenar manages the sportsbook platform, infrastructure, and system performance.',
    cta: 'Launch Fast',
    nav: 'White label',
    chips: [
      'Fast Market Launch',
      'Licensing & Compliance',
      'Sportsbook & Casino',
      'Payment Infrastructure',
      'Fully Customisable Brand',
      'Clear Growth Path',
      'Multi-brand Management',
      'Bonus Engine',
      'Regional Adaptation',
    ],
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
  { label: 'Solutions & Products', href: assetUrl('solutions-products/') },
  { label: 'Clients', href: assetUrl('clients/') },
  { label: 'Events', href: assetUrl('events/') },
  { label: 'Blog', href: assetUrl('blog/') },
  { label: 'Company', href: assetUrl('company/') },
];

const navGroups = [
  navLinks.slice(0, 2),
  navLinks.slice(2),
];

const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

function clientLogoId(name: string) {
  return `logo-cell-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
}

function caseLogoId(name: string) {
  return `case-logo-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
}

const allClientLogos = clientGroups.flatMap((g) => g.clients);
const clientLogoWall = allClientLogos.slice(0, 12);
const clientLogoTargets = clientLogoWall.map((c) => ({
  id: clientLogoId(c.name),
  imageUrl: assetUrl(c.logo),
}));
const caseLogoTargets = cases
  .filter((c) => c.logo)
  .map((c) => ({
    id: caseLogoId(c.company),
    imageUrl: assetUrl(c.logo!),
  }));

function App() {
  const heroParticlesRef = useRef<any>(null);
  const [heroMatchPlaying, setHeroMatchPlaying] = React.useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) {
      // Debug helper: run `window.__hero.forceShape('logo')` in the
      // console to jump to the large Altenar wordmark without waiting
      // on hover/timer triggers. Dev-only.
      (window as any).__hero = heroParticlesRef.current;
    }
  });

  return (
    <>
      <ColumnGuides />
      <Header />
      {!HERO_ONLY && HERO_MOTION_ENABLED ? (
        <GearFlowBridge
          particleSize={10}
          particleGap={4}
          color="#ffffff"
          logoTargets={clientLogoTargets}
        />
      ) : null}
      {!HERO_ONLY && HERO_MOTION_ENABLED ? (
        <FooterBrandParticles particleSize={10} particleGap={4} color="#ffffff" />
      ) : null}
      {!HERO_ONLY && HERO_MOTION_ENABLED ? (
        <CaseBrandParticles
          particleSize={10}
          particleGap={4}
          color="#15161b"
          logoTargets={caseLogoTargets}
        />
      ) : null}
      <main className="page">
        <section
          className={`hero-stack${HERO_MOTION_ENABLED ? '' : ' hero-stack--static'}${HERO_SLOGAN_FROM_PARTICLES ? ' hero-stack--slogan-particles' : ' hero-stack--solid-type'}${heroMatchPlaying ? ' is-match-playing' : ''}`}
          id="top"
        >
          {HERO_MOTION_ENABLED && HERO_MATCH_1986 ? (
            <div className="hero-bg-particles" aria-hidden="true">
              <HeroMatchBoard onPlayChange={setHeroMatchPlaying} />
            </div>
          ) : null}
          {HERO_MOTION_ENABLED &&
          HERO_MARK_LOOP &&
          !HERO_SLOGAN_FROM_PARTICLES &&
          !HERO_MATCH_1986 ? (
            <div className="hero-bg-particles" aria-hidden="true">
              <HeroMarkLoop
                markSrc={assetUrl('altenar-mark-only.svg')}
                wordmarkSrc={assetUrl('footer-brand/Altenar_Brand.svg')}
                particleSize={10}
                particleGap={4}
              />
            </div>
          ) : null}
          {HERO_MOTION_ENABLED && HERO_SLOGAN_FROM_PARTICLES && !HERO_MATCH_1986 ? (
            <div className="hero-bg-particles" aria-hidden="true">
              <HeroParticles
                ref={heroParticlesRef}
                initialPatternShot
                particleCount={40}
                particleGap={4}
                particleSize={10}
                particleShape="square"
                particleColor="original"
                assembleAfterMoves={0}
                assembleAfterHoverMs={0}
                shapeStory={false}
                shapeAfterMoves={0}
                hoverEnabled
                hoverConfig={{
                  hoverType: 'hide',
                  hideType: 'scatter',
                  transition: { duration: 1.55, ease: 'easeOut' },
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
                  image: assetUrl('altenar-mark.png'),
                  logoImage: assetUrl('Altenar_Logo.svg'),
                  mode: 'fill',
                  scale: 10,
                }}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          ) : null}
          <Hero />
        </section>
        {!HERO_ONLY ? (
          <>
            <Clients />
            <BridgeStatement />
            <Products />
            <Markets />
            <Proof />
            <Awards />
            <News />
            <FinalCta />
            <SeoBlock />
          </>
        ) : null}
      </main>
      {!HERO_ONLY ? (
        <>
          <Footer />
          <ScrollProgressBar />
        </>
      ) : null}
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

function TopNavLink({ href, children }: { href: string; children: string }) {
  const rootRef = React.useRef<HTMLAnchorElement | null>(null);
  const labelRef = React.useRef<HTMLSpanElement | null>(null);
  useTextScramble(rootRef, labelRef, children, { hover: true });

  return (
    <a ref={rootRef} href={href}>
      <span ref={labelRef}>{children}</span>
    </a>
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
        <nav className="topnav" aria-label="Main">
          {navGroups.map((group, gi) => (
            <div className="topnav-group" key={gi}>
              {group.map((l) => (
                <TopNavLink key={l.label} href={l.href}>
                  {l.label}
                </TopNavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="topbar-right">
          <a className="topbar-action" href="https://altenar.com/en-us/" aria-label="Выбрать язык">
            <span className="topbar-action__bracket" aria-hidden="true">[</span>
            <span className="topbar-action__label">RU</span>
            <span className="topbar-action__bracket" aria-hidden="true">]</span>
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

function Eyebrow({ children }: { children: string }) {
  const rootRef = React.useRef<HTMLSpanElement | null>(null);
  const labelRef = React.useRef<HTMLSpanElement | null>(null);
  useTextScramble(rootRef, labelRef, children, {
    hover: true,
    onView: true,
    viewMargin: '-90px',
  });

  return (
    <span className="eyebrow" ref={rootRef}>
      <span className="eyebrow__label" ref={labelRef}>
        {children}
      </span>
    </span>
  );
}

/** Large stats: CTA scramble timing, digit charset, once on view. */
function ScrambleDigits({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const labelRef = React.useRef<HTMLSpanElement | null>(null);
  useTextScramble(rootRef, labelRef, children, {
    hover: false,
    onView: true,
    viewMargin: '-60px',
    charset: 'digit',
  });

  return (
    <strong
      ref={(el) => {
        rootRef.current = el;
      }}
      className={className}
    >
      <span ref={labelRef}>{children}</span>
    </strong>
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
  lead?: string;
  align?: 'left' | 'center' | 'right';
}) {
  return (
    <div className={`section-head section-head--${align}`}>
      <Eyebrow>{kicker}</Eyebrow>
      <WipeReveal as="h2">{title}</WipeReveal>
      {lead ? <p>{lead}</p> : null}
    </div>
  );
}

function Hero() {
  if (HERO_SLOGAN_FROM_PARTICLES) {
    return (
      <div className="hero">
        <div className="hero-layout">
          <h1 className="visually-hidden">Stability meets flexibility</h1>
          <div className="hero-slogan-tl" aria-hidden="true">
            <span
              className="hero-slogan-word hero-slogan-word--stability"
              data-particle-shot="both"
              data-particle-color="ink"
            >
              Stability
            </span>
          </div>
          <span
            className="hero-slogan-word hero-slogan-word--meets-center"
            data-particle-shot="1"
            data-particle-color="live"
            aria-hidden="true"
          >
            meets
          </span>
          <span
            className="hero-slogan-word hero-slogan-word--flexibility"
            data-particle-shot="both"
            data-particle-color="ink"
            aria-hidden="true"
          >
            flexibility
          </span>
          <motion.div
            className="hero-side"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          >
            <p className="hero-lead">
              As your strategic partner, Altenar guides licensed operators to maximize profits and enter new markets confidently. We deliver highly flexible software—from API to fully managed operations—letting your team focus entirely on performance. Our cooperation ensures lightning-fast deployment, localized tools, and 24/7 trading support built to scale your business for shared growth.
            </p>
            <div className="hero-cta">
              <CtaLink href="#scenarios" color="live">See solutions</CtaLink>
              <CtaLink href="#demo" color="ink">Contact Us</CtaLink>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero">
      <div className="hero-layout hero-layout--solid">
        <h1 className="visually-hidden">Stability meets flexibility</h1>

        <div className="hero-slogan-solid" aria-hidden="true">
          <WipeReveal as="span" className="hero-slogan-solid__line" delay={0.05}>
            Stability meets
          </WipeReveal>
          <WipeReveal as="span" className="hero-slogan-solid__line" delay={0.18}>
            flexibility
          </WipeReveal>
        </div>

        <div className="hero-product">
          <Eyebrow>Altenar</Eyebrow>
          <Eyebrow>Sportsbook</Eyebrow>
          <Eyebrow>Platform</Eyebrow>
        </div>

        <div className="hero-cta-row">
          <div className="hero-cta-col hero-cta-col--1">
            <CtaLink href="#scenarios" color="live">See solution</CtaLink>
          </div>
          <div className="hero-cta-col hero-cta-col--2">
            <CtaLink href="#demo" color="ink">Contact Us</CtaLink>
          </div>
        </div>

        <motion.div
          className="hero-lead-row"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <p className="hero-lead-col hero-lead-col--3">
            As your strategic partner, Altenar guides licensed operators to maximize profits and enter new markets confidently. We deliver highly flexible software—from API to fully managed operations—letting your team focus entirely on performance.
          </p>
          <p className="hero-lead-col hero-lead-col--4">
            Our cooperation ensures lightning-fast deployment, localized tools, and 24/7 trading support built to scale your business for shared growth.
          </p>
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
  // Flat 4×3 logo wall (three rows).
  const logos = clientLogoWall;

  return (
    <section className="section section-clients" id="clients">
      <SectionHead
        kicker="Clients"
        title="Trusted by operators worldwide"
        lead="A selection of partners who launch, migrate, and scale with Altenar."
      />
      <div className="client-logo-grid">
        {logos.map((c) => (
          <LogoCell key={c.name} client={c} />
        ))}
      </div>
      <div className="client-cases-link">
        <CtaLink href="#cases" color="soft">View all cases</CtaLink>
      </div>
    </section>
  );
}

const BRIDGE_STATEMENT =
  'Altenar is a real-time technology engine that powers sportsbook operations, manages risk and optimises profitability—enabling operators to scale efficiently and achieve sustainable growth.';

function BridgeStatement() {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const [t, setT] = React.useState(0);
  const chars = React.useMemo(() => Array.from(BRIDGE_STATEMENT), []);
  const liveCount = Math.floor(t * chars.length);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setT(1);
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Letter fill L→R: blue then dim gray (solutions-nav inactive).
      const start = vh * 0.88;
      const end = vh * 0.28;
      const next = (start - rect.top) / Math.max(1, start - end);
      setT(Math.max(0, Math.min(1, next)));
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, []);

  return (
    <section ref={rootRef} className="section section-bridge" aria-label="Altenar technology">
      <p className="bridge-statement">
        <span className="bridge-statement__sr">{BRIDGE_STATEMENT}</span>
        <span className="bridge-statement__chars" aria-hidden="true">
          {chars.map((ch, i) => (
            <span
              key={i}
              className={`bridge-statement__char ${i < liveCount ? 'is-live' : 'is-dim'}`}
            >
              {ch}
            </span>
          ))}
        </span>
      </p>
    </section>
  );
}

/** CSS-mask silhouettes (sparse particle art). */
const PRODUCT_ICON_SRC: Record<IconName, string> = {
  key: assetUrl('product-icons/turnkey.png'),
  store: assetUrl('product-icons/retail.png'),
  label: assetUrl('product-icons/label.png'),
};

/** Solid ink for HeroParticles sampling (sparse PNGs undersample into a ring). */
const PRODUCT_ICON_SAMPLE_SRC: Record<IconName, string> = {
  key: assetUrl('product-icons/sample/turnkey.png'),
  store: assetUrl('product-icons/sample/retail.png'),
  label: assetUrl('product-icons/sample/label.png'),
};

function ProductIcon({ name }: { name: IconName }) {
  return (
    <span
      className="product-icon"
      style={{
        WebkitMaskImage: `url(${PRODUCT_ICON_SRC[name]})`,
        maskImage: `url(${PRODUCT_ICON_SRC[name]})`,
      }}
      aria-hidden="true"
    />
  );
}

function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
  if (!parts) return [text];
  return parts.map((s) => s.trim()).filter(Boolean);
}

function Products() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const active = products[activeIndex];
  const navItems = ['', ...products.map((p) => p.nav)];

  return (
    <section className="section section-products" id="scenarios">
      <SectionHead
        kicker="Solutions"
        title="Our solutions"
        lead="Three ways to launch and scale a sportsbook with Altenar."
      />
      <div className="solutions-stage">
        <nav className="solutions-nav grid-nav" aria-label="Solutions">
          <span
            className="grid-nav__ink"
            aria-hidden="true"
            style={{ transform: `translateX(${(activeIndex + 1) * 100}%)` }}
          />
          {navItems.map((label, i) => {
            const productIndex = i - 1;
            const isEmpty = !label;
            const isActive = !isEmpty && productIndex === activeIndex;
            return (
              <button
                key={`nav-${i}`}
                type="button"
                className={[
                  'solutions-nav__item',
                  'grid-nav__item',
                  isEmpty ? 'is-empty' : '',
                  isActive ? 'is-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                disabled={isEmpty}
                tabIndex={isEmpty ? -1 : 0}
                aria-current={isActive ? 'true' : undefined}
                aria-hidden={isEmpty || undefined}
                onClick={() => {
                  if (!isEmpty) setActiveIndex(productIndex);
                }}
              >
                {label ? (
                  <>
                    <span className="solutions-nav__num" aria-hidden="true">
                      {String(i).padStart(2, '0')}
                    </span>
                    <span className="solutions-nav__label grid-nav__label">{label}</span>
                  </>
                ) : (
                  '\u00A0'
                )}
              </button>
            );
          })}
        </nav>

        <motion.article
          className="solutions-panel"
          variants={rise}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <div className="solutions-visual" aria-hidden="true">
            <div className="solutions-visual__stage">
              <HeroParticles
                key={active.nav}
                className="solutions-visual__particles"
                particleCount={14}
                particleGap={24}
                particleSize={53}
                particleShape="square"
                particleColor="single"
                singleColor="#009ee3"
                autoAssemble={false}
                assembleWhenVisible
                assembleAfterMoves={0}
                assembleAfterHoverMs={0}
                disassembleAfterSweeps={3}
                reassembleOnMove
                gridScatter
                shapeStory={false}
                shapeAfterMoves={0}
                hoverEnabled
                hoverConfig={{
                  hoverType: 'hide',
                  hideType: 'scatter',
                  transition: { duration: 1.55, ease: 'easeOut' },
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
                  image: PRODUCT_ICON_SAMPLE_SRC[active.icon],
                  mode: 'fill',
                  sizeUnit: '%',
                  widthPct: 50,
                  heightPct: 50,
                  anchor: 'center',
                }}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
          <div className="solutions-copy">
            {products.map((product, productIndex) => {
              const isActive = productIndex === activeIndex;
              const sentences = splitSentences(product.text);
              return (
                <div
                  key={product.nav}
                  className={`solutions-copy__panel${isActive ? ' is-active' : ''}`}
                  aria-hidden={isActive ? undefined : true}
                >
                  <span className="product-scenario">{product.scenario}</span>
                  <h3>{product.title}</h3>
                  <div className="solutions-copy-body">
                    <div className="solutions-copy-text">
                      {sentences.map((sentence) => (
                        <p key={sentence}>{sentence}</p>
                      ))}
                    </div>
                    {product.chips.length > 0 ? (
                      <ul className="solutions-chips">
                        {product.chips.map((item) => (
                          <li key={item} className="solutions-chip">
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <CtaLink className="product-link" href="#demo" color="live" tabIndex={isActive ? undefined : -1}>
                    {product.cta}
                  </CtaLink>
                </div>
              );
            })}
          </div>
        </motion.article>
      </div>
    </section>
  );
}

function Markets() {
  const [active, setActive] = React.useState<string>('all');
  const [selectedMarketDetail, setSelectedMarketDetail] = React.useState<string | null>(null);
  const region = markets.find((m) => m.code === active) ?? null;
  const selectedDetail = region?.details.find((d) => d.name === selectedMarketDetail) ?? null;
  const territoryTabs = [
    { code: 'all', title: 'All territories' },
    ...markets.map((m) => ({ code: m.code, title: m.title })),
  ];
  const activeTabIndex = Math.max(
    0,
    territoryTabs.findIndex((tab) => tab.code === active),
  );
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
  const inkCol = activeTabIndex % 4;
  const inkRow = Math.floor(activeTabIndex / 4);

  return (
    <section className="section section--light section-markets" id="markets">
      <SectionHead
        kicker="Territories of expertise"
        title="Licences and regions of operation"
        lead="Altenar works with licensed operators across multiple jurisdictions, supporting launches, expansions, and long-term operations in environments where regulatory expectations are clearly defined and actively enforced."
      />
      <div className="map-nav grid-nav" role="tablist" aria-label="Territories">
        <span
          className="grid-nav__ink"
          aria-hidden="true"
          style={{ transform: `translate(${inkCol * 100}%, ${inkRow * 100}%)` }}
        />
        {territoryTabs.map((tab) => {
          const isActive = active === tab.code;
          return (
            <button
              key={tab.code}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={['grid-nav__item', isActive ? 'is-active' : ''].filter(Boolean).join(' ')}
              onClick={() => {
                setActive(tab.code);
                setSelectedMarketDetail(null);
              }}
            >
              <span className="grid-nav__label">{tab.title}</span>
            </button>
          );
        })}
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
          {HERO_MOTION_ENABLED ? <MapParticles particleGap={4} particleSize={10} /> : null}
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
                <CtaLink
                  href="https://altenar.com/services/licensing-and-compliance-support/"
                  target="_blank"
                  rel="noreferrer"
                  color="live"
                >
                  View licensing details
                </CtaLink>
              </p>
              <div className="market-metrics" aria-label="Altenar territory metrics">
                <div>
                  <ScrambleDigits>90</ScrambleDigits>
                  <span>Countries of operation</span>
                </div>
                <div>
                  <ScrambleDigits>50</ScrambleDigits>
                  <span>Licenses obtained</span>
                </div>
                <div>
                  <ScrambleDigits>1500</ScrambleDigits>
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
        {cases.map((c) => {
          const id = c.logo ? caseLogoId(c.company) : undefined;
          return (
            <motion.a
              className={['case', c.logo ? 'case--particle' : ''].filter(Boolean).join(' ')}
              key={c.company}
              id={id}
              href={c.href}
              data-logo-id={id}
              data-logo-src={c.logo ? assetUrl(c.logo) : undefined}
              variants={rise}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
            >
              <span className="case-brand">
                {c.logo ? (
                  <img
                    className="case-brand__img case-brand__img--solid"
                    src={assetUrl(c.logo)}
                    alt={c.company}
                    loading="lazy"
                  />
                ) : (
                  <span className="case-logo-text">{c.company}</span>
                )}
              </span>
              <span className="case-proof">
                <span className="case-market">{c.market}</span>
                <ScrambleDigits className="case-result">{c.result}</ScrambleDigits>
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
          );
        })}
        <div className="case-all">
          <CtaLink href="#demo" color="live">Contact us</CtaLink>
        </div>
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
        <a className="award-all group" href="https://altenar.com/about/" aria-label="All Altenar awards">
          <CtaLink as="span" triggerOnParentHover>All awards</CtaLink>
        </a>
      </div>
    </section>
  );
}

function NewsCard({ item, wide = false }: { item: NewsItem; wide?: boolean }) {
  const rootRef = React.useRef<HTMLAnchorElement | null>(null);
  const dateRef = React.useRef<HTMLTimeElement | null>(null);
  const readLabelRef = React.useRef<HTMLSpanElement | null>(null);
  useTextScramble(rootRef, readLabelRef, 'READ', { hover: true });

  React.useEffect(() => {
    const date = dateRef.current;
    if (!date) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      date.classList.add('is-in');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          date.classList.add('is-in');
          observer.disconnect();
        }
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.2 },
    );
    observer.observe(date);
    return () => observer.disconnect();
  }, []);

  return (
    <a
      ref={rootRef}
      className={['news-card', 'news-card--article', wide ? 'news-card--wide' : ''].filter(Boolean).join(' ')}
      href={item.href}
    >
      <span className="news-card__top">
        <time ref={dateRef} className="news-card__date" dateTime={item.date}>
          <span className="news-card__date-fill" aria-hidden="true" />
          <span className="news-card__date-text">{item.date}</span>
        </time>
        <span className="news-card__read">{item.read}</span>
      </span>
      <h3 className="news-card__title">{item.title}</h3>
      <span className="news-card__foot">
        <span className="news-card__thumb">
          <img src={assetUrl(item.image)} alt="" loading="lazy" />
        </span>
        <span className="news-card__cta">
          <span className="news-card__cta-label" ref={readLabelRef}>
            READ
          </span>
          <svg
            className="news-card__cta-arrow"
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            aria-hidden="true"
          >
            <path d="M2 8L8 2M8 2H3.5M8 2V6.5" stroke="currentColor" strokeWidth="1" />
          </svg>
        </span>
      </span>
    </a>
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
        <NewsCard item={featured} wide />
        {rest.map((item) => (
          <NewsCard key={item.title} item={item} />
        ))}
        <a className="news-card news-card--cta group" href="https://altenar.com/news/" aria-label="All company news">
          <CtaLink as="span" triggerOnParentHover>All news</CtaLink>
        </a>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="section section-final" id="demo">
      <div className="final-grid">
        <div className="final-copy">
          <Eyebrow>Contact</Eyebrow>
          <WipeReveal as="h2">Where your ambitions unlock growth</WipeReveal>
          <motion.p variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
            Tell us which market you are targeting and which solution you need. Altenar will help you launch, expand, and scale with confidence.
          </motion.p>
          <ul className="final-list">
            <li>Turnkey sportsbook</li>
            <li>Retail / landbase</li>
            <li>White label</li>
            <li>Licensed market entry</li>
          </ul>
        </div>
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
          <CtaLink as="button" type="submit" className="form-submit" color="live">
            Contact Us
          </CtaLink>
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
    <section className="section section-seo" id="seo" aria-label="SEO">
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
          <CtaLink className="footer-more-link" href="https://altenar.com/" target="_blank" rel="noreferrer" color="dim">
            Learn more
          </CtaLink>
        </div>
        <div className="footer-cell footer-company-copy">
          <p>Altenar’s activity is licensed and regulated by the Malta Gaming Authority.</p>
          <CtaLink className="footer-more-link" href="https://altenar.com/" target="_blank" rel="noreferrer" color="dim">
            Learn more
          </CtaLink>
        </div>
        <div className="footer-brand" id="footer-brand">
          <img src={assetUrl('footer-brand/Altenar_Brand.svg')} alt="Altenar" />
        </div>
      </div>
    </footer>
  );
}

const rootEl = document.getElementById('root')!;
const existing = (rootEl as any)._reactRoot;
const root = existing || createRoot(rootEl);
(rootEl as any)._reactRoot = root;
root.render(<App />);
