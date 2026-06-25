import React from 'react';
import { createRoot } from 'react-dom/client';
import { motion, type Variants } from 'framer-motion';
import WorldMap, { type MapMarker } from './WorldMap';
import './styles.css';

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const hangingWords = new Set([
  'а',
  'в',
  'во',
  'да',
  'до',
  'для',
  'же',
  'за',
  'и',
  'из',
  'к',
  'ко',
  'ли',
  'на',
  'над',
  'не',
  'ни',
  'но',
  'о',
  'об',
  'обо',
  'от',
  'по',
  'под',
  'при',
  'про',
  'с',
  'со',
  'у',
]);

function bindShortWords(root: ParentNode = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT'].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }

      return /[А-Яа-яЁё]/.test(node.nodeValue ?? '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];
  let node = walker.nextNode();

  while (node) {
    nodes.push(node as Text);
    node = walker.nextNode();
  }

  nodes.forEach((textNode) => {
    const current = textNode.nodeValue ?? '';
    const next = current.replace(/(^|[\s([{"«])([А-Яа-яЁё]{1,3})\s+/g, (match, prefix: string, word: string) => {
      return hangingWords.has(word.toLowerCase()) ? `${prefix}${word}\u00A0` : match;
    });

    if (next !== current) {
      textNode.nodeValue = next;
    }
  });
}

type IconName =
  | 'migrate'
  | 'globe'
  | 'risk'
  | 'shield'
  | 'channels'
  | 'chart'
  | 'module'
  | 'key'
  | 'store'
  | 'label';
type Stat = { value: string; label: string; up?: boolean };
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
type PlatformLayer = { id: string; label: string; title: string; description: string; items: string[] };
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
type Capability = { title: string; text: string };
type RiskCard = Capability & { icon: IconName };
type EcosystemGroup = { role: string; items: string[] };
type ComplianceItem = { code: string; title: string; text: string; scope: string };
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

const stats: Stat[] = [
  { value: '15', label: 'лет на рынке' },
  { value: '56', label: 'стран присутствия' },
  { value: '195', label: 'партнеров по всему миру' },
  { value: '24/7', label: 'поддержка' },
  { value: '6', label: 'офисов' },
  { value: '700+', label: 'сотрудников' },
];

type Client = { name: string; domain: string; logo: string };
type ClientGroup = { title: string; clients: Client[] };

const clientGroups: ClientGroup[] = [
  {
    title: 'Запуск на новом рынке',
    clients: [
      { name: 'Wplay', domain: 'wplay.co', logo: 'client-logos/wplay.png' },
      { name: 'Multibet', domain: 'multibet.com', logo: 'client-logos/multibet.png' },
      { name: 'YangaGames', domain: 'yangagames.com', logo: 'client-logos/yangagames.svg' },
      { name: 'Betmotion', domain: 'betmotion.com', logo: 'client-logos/betmotion.svg' },
    ],
  },
  {
    title: 'Миграция и масштабирование',
    clients: [
      { name: 'Palms Bet', domain: 'palmsbet.com', logo: 'client-logos/palms-bet.svg' },
      { name: 'MerkurXtip', domain: 'merkur-xtip.rs', logo: 'client-logos/merkurxtip.png' },
      { name: 'Lottoland', domain: 'lottoland.com', logo: 'client-logos/lottoland.png' },
      { name: '7bet', domain: '7bet.lt', logo: 'client-logos/7bet.png' },
    ],
  },
  {
    title: 'Казино → ставки на спорт',
    clients: [
      { name: 'Rootz / Wildz', domain: 'wildz.com', logo: 'client-logos/rootz-wildz.svg' },
      { name: 'Starcasino', domain: 'starcasino.be', logo: 'client-logos/starcasino.svg' },
      { name: 'Immense Group', domain: 'immensegroup.io', logo: 'client-logos/immense-group.png' },
      { name: 'Vegas.hu', domain: 'vegas.hu', logo: 'client-logos/vegas-hu.png' },
    ],
  },
  {
    title: 'Розница / все каналы',
    clients: [
      { name: 'Golden Palace', domain: 'goldenpalace.be', logo: 'client-logos/golden-palace.svg' },
      { name: 'IsibetPRO Srl', domain: 'isibetpro.it', logo: 'client-logos/isibetpro.png' },
      { name: 'JustBet', domain: 'justbet.cx', logo: 'client-logos/justbet.png' },
      { name: 'Replatz', domain: 'replatz.com', logo: 'client-logos/replatz.png' },
    ],
  },
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
    tag: 'миграция',
    company: 'Palms Bet',
    market: 'Болгария · Перу',
    result: '+137%',
    resultLabel: 'рост оборота в Перу',
    text: 'Миграция на Altenar сняла ограничения старой платформы: Palms Bet сохранила стабильность на регулируемых рынках, расширила покрытие событий и получила рост оборота на 46% в Болгарии и 137% в Перу.',
    href: 'https://altenar.com/ru/blog/seamless-migration-delivers-measurable-growth-for-palms-bet/',
    logo: 'client-logos/palms-bet.svg',
  },
  {
    tag: 'омниканальность',
    company: 'Golden Palace',
    market: 'Бельгия',
    result: '+50%',
    resultLabel: 'рост прибыли',
    text: 'Altenar связала онлайн, мобильные сценарии, игровые терминалы и розничные точки Golden Palace в единую омниканальную модель для регулируемого рынка Бельгии. После перехода прибыль выросла на 50%.',
    href: 'https://altenar.com/ru/cases/goldenpalace/',
    logo: 'client-logos/golden-palace.svg',
  },
  {
    tag: 'новый продукт',
    company: 'Immense Group',
    market: 'Мульти-бренд',
    result: '4 бренда',
    resultLabel: 'глобальный запуск',
    text: 'Казино-группа с портфелем Mr Vegas, Videoslots и MegaRiches получила управляемую букмекерскую технологию Altenar, чтобы запустить ставки во всех брендах и вывести DBET как отдельный букмекерский проект.',
    href: 'https://altenar.com/ru/cases/immense-group/',
    logo: 'client-logos/immense-group-cropped.svg',
  },
  {
    tag: 'партнёрство',
    company: 'Greentube',
    market: 'Европа',
    result: '2026',
    resultLabel: 'стратегическое партнёрство',
    text: 'Greentube интегрирует технологию Altenar, чтобы расширить предложение спортивных ставок на регулируемых европейских рынках и повысить вовлечённость игроков.',
    href: 'https://altenar.com/ru/blog/altenar-and-greentube-announce-strategic-sportsbook-partnership/',
    logo: 'client-logos/greentube.svg',
  },
];

const platformLayers: PlatformLayer[] = [
  {
    id: 'core',
    label: 'ядро',
    title: 'Букмекерское ядро',
    description: 'Движок ставок, линия и управление рынками для ежедневной работы букмекерского продукта.',
    items: ['Коэффициенты в реальном времени', 'Конструктор ставок', 'Быстрые рынки', 'Покрытие событий', 'Управление рынками'],
  },
  {
    id: 'operations',
    label: 'операции',
    title: 'Операционная работа',
    description: 'Инструменты контроля, трейдинга и мониторинга, которые защищают маржу оператора.',
    items: ['Управление рисками', 'Лимиты', 'Трейдинговая поддержка', 'Отчётность', 'Мониторинг'],
  },
  {
    id: 'growth',
    label: 'рост',
    title: 'Рост продукта',
    description: 'Маркетинговые и продуктовые механики для роста вовлечения после запуска.',
    items: ['Бонусный движок', 'Усиленные коэффициенты', 'Акции', 'Персонализация', 'Витрины турниров'],
  },
  {
    id: 'infrastructure',
    label: 'инфраструктура',
    title: 'Инфраструктура',
    description: 'Интеграции, локализация, розница и поддержка регуляторных требований для регулируемых рынков.',
    items: ['Интеграции с системой игроков', 'Гибкий интерфейс', 'Розничные терминалы', 'Помощь с требованиями регуляторов', 'Локализация'],
  },
];

const products: Product[] = [
  {
    icon: 'module',
    scenario: 'Уже есть платформа',
    title: 'Букмекерский модуль',
    text: 'Добавьте букмекерский продукт к существующей инфраструктуре без смены ядра: оператор сохраняет контроль над брендом, пользовательским опытом, лимитами и коммерческой логикой.',
    cta: 'Подробнее',
  },
  {
    icon: 'key',
    scenario: 'Нужен запуск под ключ',
    title: 'Решение под ключ',
    text: 'Быстрый запуск букмекерского бренда без сборки платформы с нуля: готовая инфраструктура, система игроков, CMS, интерфейс, retail и mobile-каналы, операционные инструменты и поддержка.',
    cta: 'Подробнее',
  },
  {
    icon: 'store',
    scenario: 'Есть офлайн-точки',
    title: 'Розничное решение',
    text: 'Выводите букмекерский продукт в офлайн без сложной локальной инфраструктуры: кассы, терминалы, платежи и точки приёма ставок работают в едином контуре и управляются удалённо.',
    cta: 'Подробнее',
  },
  {
    icon: 'label',
    title: 'Запуск под вашим брендом',
    scenario: 'Нужен быстрый выход под брендом',
    text: 'Запускайте букмекерский продукт под собственным брендом за считанные недели: готовая платформа, поддержка по лицензированию, платежам и требованиям регуляторов с возможностью масштабирования без смены поставщика.',
    cta: 'Подробнее',
  },
  {
    icon: 'migrate',
    scenario: 'Хотите сменить провайдера',
    title: 'Миграция с текущего провайдера',
    text: 'Переходите на платформу Altenar без простоя и потери данных: выделенная команда миграции переносит игроков, историю и интеграции, а поэтапный запуск и тестовые среды исключают сбои в работе с игроками.',
    cta: 'Подробнее',
  },
];

const markets: Market[] = [
  {
    code: 'LATAM',
    title: 'Latin America',
    description: 'Быстро растущие регулируемые рынки, футбол как главный драйвер и спрос на локальную поддержку.',
    details: [
      { name: 'Бразилия', country: 'Brazil', year: '2025', result: 'Подготовлена локализация sportsbook под регулируемый запуск.' },
      { name: 'Перу', country: 'Peru', year: '2024', result: 'Запущена миграция оператора на платформу Altenar.' },
      { name: 'Колумбия', country: 'Colombia', year: '2023', result: 'Настроены локальные рынки, отчётность и операционная поддержка.' },
      { name: 'Уругвай', country: 'Uruguay', year: '2022', result: 'Подключены региональные виды спорта и управление коэффициентами.' },
    ],
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
    title: 'North America',
    description: 'Новые лицензии в Канаде и непростой переход операторов в регулируемое поле.',
    details: [
      { name: 'Онтарио', country: 'Canada', year: '2022', result: 'Платформа адаптирована под требования регулируемого рынка.' },
      { name: 'Альберта', country: 'Canada', year: '2024', result: 'Подготовлена конфигурация продукта для регионального запуска.' },
      { name: 'США', country: 'United States of America', year: '2025', result: 'Собран рыночный контур для партнёрских интеграций.' },
    ],
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
    title: 'Europe',
    description: 'Зрелые рынки с высокими требованиями к лицензиям, безопасности и отчётности.',
    details: [
      { name: 'Мальта', country: 'Malta', year: '2011', result: 'Получена операционная база для работы на европейских рынках.' },
      { name: 'Великобритания', country: 'United Kingdom', year: '2020', result: 'Платформа подготовлена к требованиям UKGC и отчётности.' },
      { name: 'Дания', country: 'Denmark', year: '2021', result: 'Настроены локальные правила продукта и compliance-процессы.' },
      { name: 'Бельгия', country: 'Belgium', year: '2023', result: 'Запущена омниканальная модель для online и розницы.' },
      { name: 'Португалия', country: 'Portugal', year: '2019', result: 'Получена сертификация программного обеспечения.' },
    ],
    countries: ['United Kingdom', 'Denmark', 'Belgium', 'Portugal', 'Spain', 'Italy', 'Germany', 'Sweden', 'Netherlands'],
    markers: [
      { name: 'Мальта', coordinates: [14.5, 35.9] },
      { name: 'Великобритания', coordinates: [-0.1, 51.5] },
      { name: 'Дания', coordinates: [12.6, 55.7] },
      { name: 'Бельгия', coordinates: [4.4, 50.8] },
      { name: 'Португалия', coordinates: [-9.1, 38.7] },
    ],
    center: [10, 51],
    zoom: 3.4,
  },
  {
    code: 'AFR',
    title: 'Africa',
    description: 'Мобильные сценарии, розничные форматы и локальная адаптация продукта.',
    details: [
      { name: 'ЮАР', country: 'South Africa', year: '2021', result: 'Адаптирован продукт под локальные спортивные рынки.' },
      { name: 'Нигерия', country: 'Nigeria', year: '2023', result: 'Подготовлены мобильные сценарии и поддержка регионального трафика.' },
      { name: 'Кения', country: 'Kenya', year: '2024', result: 'Настроены рынки и операционные процессы для запуска.' },
    ],
    countries: ['South Africa', 'Nigeria', 'Kenya'],
    markers: [
      { name: 'ЮАР', coordinates: [28.0, -26.2] },
      { name: 'Нигерия', coordinates: [3.4, 6.5] },
      { name: 'Кения', coordinates: [36.8, -1.3] },
    ],
    center: [20, 2],
    zoom: 2.0,
  },
  {
    code: 'ASIA',
    title: 'Asia',
    description: 'Разные спортивные привычки, мобильные сценарии и требования к локализации продукта.',
    details: [
      { name: 'Индия', country: 'India', year: '2022', result: 'Локализованы спортивные предпочтения и мобильный пользовательский путь.' },
      { name: 'Филиппины', country: 'Philippines', year: '2023', result: 'Подготовлены интеграции и региональная витрина sportsbook.' },
      { name: 'Казахстан', country: 'Kazakhstan', year: '2024', result: 'Настроены локальные языковые и операционные параметры.' },
    ],
    countries: ['India', 'Philippines', 'Kazakhstan'],
    markers: [
      { name: 'Индия', coordinates: [77.2, 28.6] },
      { name: 'Филиппины', coordinates: [121.0, 14.6] },
      { name: 'Казахстан', coordinates: [71.4, 51.2] },
    ],
    center: [88, 30],
    zoom: 2.1,
  },
];

const complianceItems: ComplianceItem[] = [
  {
    code: 'MGA',
    title: 'Мальтийская лицензия',
    text: 'Подходит операторам, которые запускают букмекерский продукт в строгой европейской регуляторной среде.',
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
    title: 'Стандарт букмекерской платформы',
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
    event: 'SBC Americas Awards',
    category: 'Америка',
    logo: 'award-logos/sbc-americas-2026.png',
  },
  {
    year: '2026',
    title: 'Лучшее место работы',
    event: 'SiGMA Europe Awards',
    category: 'Команда',
    logo: 'award-logos/sigma-europe-2026.png',
  },
  {
    year: '2026',
    title: 'Лучшие онлайн-поставщики спортивных игр',
    event: 'SiGMA Brazil',
    category: 'Южная Америка',
    logo: 'award-logos/sigma-brazil-2026.png',
  },
  {
    year: '2025',
    title: 'Лучший продукт для ставок в реальном времени',
    event: 'SiGMA South Asia Awards',
    category: 'Лайв-ставки',
    logo: 'award-logos/sigma-south-asia-2025.png',
  },
  {
    year: '2025',
    title: 'Самая инновационная функция букмекерской конторы',
    event: 'SiGMA Euro-Med Awards',
    category: 'Продукт',
    logo: 'award-logos/sigma-innovation-2025.png',
  },
  {
    year: '2025',
    title: 'Лучший провайдер онлайн-спортбука',
    event: 'SiGMA Americas',
    category: 'Платформа',
    logo: 'award-logos/sigma-americas-2025.svg',
  },
  {
    year: '2024',
    title: 'Вклад в честность спортивных ставок',
    event: 'Global Regulatory Awards',
    category: 'Регулирование',
    logo: 'award-logos/global-regulatory-2024.png',
  },
];

const news: NewsItem[] = [
  {
    date: '23.06.2026',
    read: '5 мин',
    tag: 'Партнёрство',
    title: 'Logrand и Altenar запускают улучшенный мультиканальный спортивный опыт',
    excerpt: 'Оператор объединяет онлайн и розницу на единой платформе ставок Altenar, чтобы дать игрокам бесшовный опыт во всех каналах.',
    image: 'news/logrand.webp',
    href: 'https://altenar.com/ru/news/',
  },
  {
    date: '18.06.2026',
    read: '4 мин',
    tag: 'Партнёрство',
    title: 'Altenar и Greentube объявили о стратегическом партнёрстве в спортивных играх',
    image: 'news/greentube.webp',
    href: 'https://altenar.com/ru/news/',
  },
  {
    date: '11.06.2026',
    read: '3 мин',
    tag: 'Награда',
    title: 'Altenar назван поставщиком спортивных игр года на SBC Americas Awards 2026',
    image: 'news/sbc-americas.webp',
    href: 'https://altenar.com/ru/news/',
  },
  {
    date: '10.06.2026',
    read: '3 мин',
    tag: 'Регулирование',
    title: 'Altenar получил одобрение для выхода на рынок iGaming Альберты',
    image: 'news/alberta.webp',
    href: 'https://altenar.com/ru/news/',
  },
  {
    date: '03.06.2026',
    read: '4 мин',
    tag: 'Кейс',
    title: 'Безупречная миграция обеспечила измеримый рост для Palms Bet',
    image: 'news/palms-bet.webp',
    href: 'https://altenar.com/ru/news/',
  },
  {
    date: '28.05.2026',
    read: '4 мин',
    tag: 'Награда',
    title: 'Altenar получил награду лучшего рабочего места на SiGMA Europe Awards',
    image: 'news/sigma-europe.webp',
    href: 'https://altenar.com/ru/news/',
  },
];

const riskCards: RiskCard[] = [
  { icon: 'risk', title: 'Управление рисками', text: 'Контролируйте лимиты, экспозицию и подозрительную активность до того, как они начнут влиять на маржу и операционные решения.' },
  { icon: 'chart', title: 'Трейдинговая поддержка', text: 'Получайте экспертизу по рынкам, коэффициентам и событиям в реальном времени, чтобы быстрее реагировать на движение спроса.' },
  { icon: 'shield', title: 'Операционная стабильность', text: 'Поддерживайте платформу в рабочем состоянии 24/7 с мониторингом, процессами реагирования и инфраструктурой для пиковых нагрузок.' },
];

const capabilities: Capability[] = [
  { title: 'Бонусный движок', text: 'Создавайте фрибеты, правила начислений и кампании удержания прямо внутри платформы, без отдельной ручной операционки.' },
  { title: 'Усиленные коэффициенты', text: 'Выделяйте ключевые события улучшенными условиями и направляйте внимание игроков туда, где выше потенциал оборота.' },
  { title: 'Промо-коэффициенты', text: 'Запускайте специальные предложения для матчей, турниров и событий в реальном времени, чтобы поддерживать активность в течение всего календаря.' },
  { title: 'Подсказки для ставок', text: 'Подсказывайте игроку релевантные выборы и сценарии, сокращая путь от интереса к размещённой ставке.' },
  { title: 'Витрины турниров', text: 'Собирайте турниры и события в понятные подборки, чтобы продвигать спортивный календарь как продуктовую историю.' },
  { title: 'Акции', text: 'Планируйте промо после запуска рынка: от разовых кампаний до регулярных механик вовлечения и реактивации.' },
  { title: 'Персонализация', text: 'Показывайте предложения разным сегментам игроков с учётом их интересов, поведения и предпочтительных спортивных сценариев.' },
  { title: 'Отчётность', text: 'Оценивайте активность, эффективность механик и результаты кампаний, чтобы быстрее корректировать продуктовые решения.' },
];

const ecosystem: EcosystemGroup[] = [
  { role: 'данные', items: ['Stats Perform · Opta', 'Racing and Sports'] },
  { role: 'CRM', items: ['Optimove'] },
  { role: 'контент', items: ['Inspired', 'Spribe'] },
  { role: 'платформы', items: ['Atlaslive', 'Greentube · NOVOMATIC'] },
  { role: 'признание', items: ['SBC', 'SiGMA', 'BEGE', 'Global Regulatory Awards'] },
];

const navLinks = [
  { label: 'О компании', href: 'https://altenar.com/ru/about/' },
  { label: 'Продукты', href: 'https://altenar.com/ru/products/' },
  { label: 'Клиенты и партнеры', href: 'https://altenar.com/ru/cases/' },
  { label: 'Контакты', href: 'https://altenar.com/ru/contacts/' },
];

const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

function App() {
  const [layer, setLayer] = React.useState(1);

  React.useEffect(() => {
    bindShortWords(document.getElementById('root') ?? document.body);
  }, [layer]);

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
        <Products />
        <Proof />
        <Platform layer={layer} setLayer={setLayer} />
        <Markets />
        <RiskTrading />
        <Capabilities />
        <Awards />
        <News />
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
          <h1>Ведущая B2b платформа<br />для ставок на спорт</h1>
          <p>
            Altenar помогает лицензированным операторам запускать, настраивать и
            масштабировать платформу ставок на спорт на регулируемых рынках: от отдельного модуля
            до решения под ключ, с локализацией, риск-менеджментом и поддержкой 24/7.
          </p>
          <div className="hero-cta">
            <a className="btn-primary" href="#demo">
              Запросить демо
              <span className="btn-arrow" aria-hidden="true">↗</span>
            </a>
            <a className="btn-ghost" href="#scenarios">Наши продукты</a>
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
        <span className="board-tag">панель оператора</span>
        <span className="board-live"><i className="live-dot" />В эфире</span>
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
  return (
    <motion.a
      className="logo-cell"
      href="#cases"
      aria-label={`Смотреть кейсы ${client.name}`}
      variants={rise}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
    >
      <span className="client-logo-mark">
        <img className="client-logo-img" src={assetUrl(client.logo)} alt={client.name} loading="lazy" />
      </span>
    </motion.a>
  );
}

function Clients() {
  return (
    <section className="section section-clients" id="clients">
      <SectionHead
        kicker="Клиенты"
        title="Платформа, которой доверяют букмекеры и партнёры игровой индустрии"
        lead="Altenar работает с операторами в разных сценариях: запуск на новом рынке, миграция с текущего провайдера, развитие ставок на спорт внутри казино-бренда и розничная омниканальная модель."
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
      <a className="client-cases-link" href="#cases">Смотреть все кейсы <span aria-hidden="true">→</span></a>
    </section>
  );
}

function ApproachVideo({ variant = 'break' }: { variant?: 'break' | 'panel' }) {
  return (
    <section className={`approach-video approach-video--${variant}`} aria-label="Видео Altenar">
      <video className="approach-video-media" src={assetUrl('armory-videos/armory-approach.webm')} autoPlay loop muted playsInline aria-hidden="true" />
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
    // Управление рисками — лимиты и контроль экспозиции
    case 'risk':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M5 18V6" />
          <path d="M19 18V6" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h8" />
          <circle cx="10" cy="8" r="1.2" />
          <circle cx="14" cy="12" r="1.2" />
          <circle cx="11.5" cy="16" r="1.2" />
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
    // Трейдинг — растущий график
    case 'chart':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 19h16" />
          <path d="M5.5 16 10 11.5l3 2.5 5.5-7" />
          <path d="M15.2 7h3.3v3.3" />
          <path d="M7 19V15.5" />
          <path d="M12 19v-4" />
          <path d="M17 19v-7" />
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
    // Модуль букмекера — подключаемый модуль к существующей платформе
    case 'module':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="4" y="5.5" width="6.5" height="6.5" rx="1.2" />
          <rect x="13.5" y="12" width="6.5" height="6.5" rx="1.2" />
          <path d="M10.5 8.8h2.2c1.3 0 2.3 1 2.3 2.3v.9" />
          <path d="m13.2 10.3 1.8 1.8 1.8-1.8" />
          <path d="M6.7 8.8h1.1" />
          <path d="M16.2 15.3h1.1" />
          <path d="M16.2 17h2" />
        </svg>
      );
    // Под ключ — готовая платформа на desktop и mobile
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
    // Розница — бумажная валюта / касса
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
        title="Истории успеха наших клиентов"
        lead="Несколько сценариев, в которых Altenar помогает операторам быстрее выйти на рынок, сменить провайдера или добавить ставки на спорт к существующему казино-бренду."
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
        <a className="case-all" href="#demo" aria-label="Посмотреть все истории">
          <span>Все истории</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}

function Platform({ layer, setLayer }: { layer: number; setLayer: (i: number) => void }) {
  return (
    <section className="section section-platform" id="platform">
      <SectionHead
        kicker="Платформа"
        title="Полный операционный контур букмекерского продукта в одной платформе"
        lead="Единая архитектура помогает оператору быстрее запускаться, держать продукт под контролем и развивать бизнес без разрозненных систем и ручных связок между командами."
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
              </button>
            </li>
          ))}
        </ul>
        <motion.div className="layer-detail" key={layer} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <span className="layer-detail-label">единая платформа Altenar</span>
          <h3>{platformLayers[layer].title}</h3>
          <p>{platformLayers[layer].description}</p>
          <div className="layer-items">
            {platformLayers[layer].items.map((item) => <span key={item}>{item}</span>)}
          </div>
        </motion.div>
      </div>
      <div className="platform-demo-row">
        <a className="platform-demo-link" href="#demo" aria-label="Запросить демо Altenar">
          <span>Получить презентацию платформы</span>
          <i aria-hidden="true">→</i>
        </a>
      </div>
    </section>
  );
}

function Products() {
  return (
    <section className="section section-products" id="scenarios">
      <SectionHead
        kicker="Продукты Altenar"
        title="Наши продукты и решения"
        lead="Выберите формат запуска под текущую стадию бизнеса: от подключения букмекерского продукта к действующей платформе до полноценной инфраструктуры для нового бренда и омниканального роста."
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
        <a className="product-demo" href="#demo" aria-label="Запросить демо Altenar">
          <span>Запросить демо</span>
          <i aria-hidden="true">→</i>
        </a>
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
        kicker="Рынки"
        title="Платформа для регулируемых рынков и локальных особенностей"
        lead="Каждый рынок отличается законами, спортивными привычками, форматами коэффициентов, платёжными сценариями, лимитами, устройствами и ожиданиями игроков. Altenar помогает адаптировать букмекерский продукт под конкретную страну, а не просто перевести интерфейс."
      />
      <div className="map-nav" role="tablist">
        <button type="button" role="tab" aria-selected={active === 'all'} className={active === 'all' ? 'is-active' : ''} onClick={() => { setActive('all'); setSelectedMarketDetail(null); }}>
          Все рынки
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
              <h3>Глобальное покрытие</h3>
              <p>Altenar работает на регулируемых рынках Европы, Латинской Америки, Северной Америки, Африки и Азии — с локальными видами спорта, языками, форматами коэффициентов и требованиями юрисдикций.</p>
              <div className="market-metrics" aria-label="Глобальные показатели Altenar">
                <div>
                  <strong>56</strong>
                  <span>стран</span>
                </div>
                <div>
                  <strong>195</strong>
                  <span>партнеров</span>
                </div>
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
    <section className="section section--light section-awards" id="industry-proof">
      <SectionHead
        kicker="Награды"
        title="Признание продукта на ключевых рынках"
        lead="Altenar регулярно получает отраслевые награды за букмекерскую платформу, ставки в лайве, продуктовые функции, качество команды и работу с регулируемыми рынками."
      />
      <div className="award-track">
        {awards.slice(0, 7).map((item) => (
          <article key={`${item.event}-${item.title}`} className="award-card">
            <span className="award-logo">
              <img src={assetUrl(item.logo)} alt={item.event} loading="lazy" />
            </span>
            <span className="award-meta">{item.year} · {item.category}</span>
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

function News() {
  const [featured, ...rest] = news;

  return (
    <section className="section section--light section-news" id="news">
      <SectionHead
        align="left"
        kicker="Пресс-центр"
        title="Новости компании"
        lead="Партнёрства, награды, выход на новые регулируемые рынки и продуктовые обновления — что происходит в Altenar прямо сейчас."
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
        <a className="news-card news-card--cta" href="https://altenar.com/ru/news/" aria-label="Все новости компании Altenar">
          <span>Все новости</span>
          <i aria-hidden="true">→</i>
        </a>
      </div>
    </section>
  );
}

function RiskTrading() {
  return (
    <section className="section section-risk">
      <SectionHead
        kicker="Риски и трейдинг"
        title="Контроль риска и стабильная работа 24/7"
        lead="Платформа ставок работает в реальном времени. Ошибки в коэффициентах, лимитах или расчётах напрямую влияют на деньги оператора. Altenar помогает контролировать риски, поддерживать ставки в реальном времени, управлять рынками и защищать маржу в периоды высокой нагрузки."
      />
      <div className="caps-grid risk-grid">
        {riskCards.map((c) => (
          <motion.article className="cap" key={c.title} variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
            <span className="risk-icon"><LineIcon name={c.icon} /></span>
            <h3>{c.title}</h3>
            <p>{c.text}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function Capabilities() {
  return (
    <section className="section section-caps" id="growth">
      <div className="growth-head">
        <SectionHead
          align="left"
          kicker="Рост после запуска"
          title="Инструменты для роста вовлечения после запуска"
          lead="После запуска платформу ставок нужно развивать: продвигать события, возвращать игроков, усиливать ставки в реальном времени, запускать бонусы и повышать активность. Altenar даёт инструменты роста внутри платформы."
        />
        <ApproachVideo variant="panel" />
      </div>
      <div className="caps-grid">
        {capabilities.map((c, i) => (
          <motion.article className="cap" key={c.title} variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
            <span className="cap-index">{String(i + 1).padStart(2, '0')}</span>
            <h3>{c.title}</h3>
            <p>{c.text}</p>
          </motion.article>
        ))}
        <a className="cap-demo" href="#demo" aria-label="Заказать демо Altenar">
          <span>Смотреть инструменты роста</span>
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
          <h2>Обсудите запуск или развитие вашей платформы ставок</h2>
          <p>
            Расскажите, какой рынок вы рассматриваете, есть ли у вас действующая
            платформа и какой формат решения нужен. Команда Altenar покажет подходящий
            сценарий запуска, миграции или масштабирования.
          </p>
          <ul className="final-list">
            <li>Модуль / под ключ / розница / запуск под брендом / миграция</li>
            <li>Запуск на новом регулируемом рынке</li>
            <li>Миграция с текущего провайдера</li>
            <li>Рост платформы ставок после запуска</li>
          </ul>
        </motion.div>
        <motion.form className="form" variants={rise} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} onSubmit={(e) => e.preventDefault()}>
          <label>
            <span>Имя</span>
            <input placeholder="Ваше имя" />
          </label>
          <label>
            <span>Рабочий email</span>
            <input type="email" placeholder="name@company.com" />
          </label>
          <label>
            <span>Компания</span>
            <input placeholder="Название компании" />
          </label>
          <label>
            <span>Регион</span>
            <input placeholder="Европа, Латинская Америка, Северная Америка…" />
          </label>
          <label>
            <span>Что нужно</span>
            <select defaultValue="">
              <option value="" disabled>Выберите вариант</option>
              <option>Модуль</option>
              <option>Под ключ</option>
              <option>Розница</option>
              <option>Запуск под брендом</option>
              <option>Миграция</option>
            </select>
          </label>
          <label>
            <span>Сообщение</span>
            <textarea placeholder="Кратко опишите рынок, текущую платформу и сроки запуска" />
          </label>
          <button type="submit" className="btn-primary form-submit">
            Запросить демо
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
      <div className="footer-grid">
        <a className="footer-logo-small" href="#top" aria-label="Altenar">
          <img src={assetUrl('footer-brand/logo-small.svg')} alt="Altenar" />
        </a>
        <div className="footer-cell footer-socials">
          <span className="footer-label">© 2026 Altenar. Все права защищены.</span>
          <div className="footer-social-links" aria-label="Социальные сети Altenar">
            <a href="https://www.linkedin.com/company/altenar" target="_blank" rel="noreferrer" aria-label="LinkedIn Altenar">in</a>
            <a href="https://www.youtube.com/@altenarb2b" target="_blank" rel="noreferrer" aria-label="YouTube Altenar">yt</a>
            <a href="https://www.instagram.com/altenar_b2b/" target="_blank" rel="noreferrer" aria-label="Instagram Altenar">ig</a>
          </div>
        </div>
        <div className="footer-cell footer-legal-copy">
          <p>Логотип и графические изображения Altenar являются интеллектуальной собственностью компании и защищены от несанкционированного использования.</p>
          <a className="footer-more-link" href="https://altenar.com/ru/" target="_blank" rel="noreferrer">Подробнее</a>
        </div>
        <div className="footer-cell footer-company-copy">
          <p>Деятельность компании Altenar лицензирована и регулируется Управлением по азартным играм Мальты.</p>
          <a className="footer-more-link" href="https://altenar.com/ru/" target="_blank" rel="noreferrer">Подробнее</a>
        </div>
        <div className="footer-brand">
          <img src={assetUrl('footer-brand/Altenar_Brand.svg')} alt="Altenar" />
        </div>
      </div>
    </footer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
