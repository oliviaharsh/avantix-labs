// Build-time HTML renderer (runs in Node from vite.config.js). Turns src/content into real,
// indexable markup; the client JS then adds motion, 3D and the live demos on top.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { site, hero, statement, services, process, founders, contact } from '../content/content.js';

const here = dirname(fileURLToPath(import.meta.url));
const logoDir = join(here, '..', 'assets', 'logo');

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ------------------------------------------------------------------ logo */
// The logo kit's SVG paths, in order: thin stroke, bronze crossbar, thick slab, AVANTIX, rule, LABS.
const PIECES = ['lg-thin', 'lg-bar', 'lg-slab', 'lg-word', 'lg-rule', 'lg-labs'];

function logoSvg(file, { label = 'Avantix Labs', cls = '' } = {}) {
  let svg = readFileSync(join(logoDir, file), 'utf8');
  let i = 0;
  svg = svg
    .replace(/<title>[^<]*<\/title>/, '')
    .replace(/ width="\d+" height="\d+"/, '')
    .replace(/<(path|rect)([^>]*?)fill="#[0-9A-Fa-f]{6}"/g, (m, tag, attrs) => {
      const piece = PIECES[i++] || 'lg-x';
      const accent = piece === 'lg-bar' || piece === 'lg-rule' || piece === 'lg-labs';
      return `<${tag}${attrs}class="${piece}" fill="${accent ? 'var(--logo-acc)' : 'currentColor'}"`;
    })
    .replace('<svg ', `<svg class="logo ${cls}" role="img" aria-label="${esc(label)}" focusable="false" `);
  return svg;
}
export const logo = {
  horizontal: (cls) => logoSvg('avantix-labs-logo-primary.svg', { cls }),
  mark: (cls) => logoSvg('avantix-labs-mark-primary.svg', { cls, label: 'Avantix Labs mark' }),
};

const arrow = '<svg class="ico-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const arrowUpRight = '<svg class="ico-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 14 14 6M7.5 6H14v6.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const pad = (n) => String(n).padStart(2, '0');
const toneBg = { light: 'var(--ivory)', dark: 'var(--espresso)', stone: 'var(--limestone)' };
// page links; Founders only while that section is switched on in content.js
const links = [['services', 'Services'], ['work', 'Demos'], ['process', 'Process'], ...(site.showFounders ? [['founders', 'Founders']] : [])];

/* ------------------------------------------------------------------ sections */
function nav() {
  return `
<header class="nav" data-nav>
  <a class="nav__logo" href="#top" aria-label="Avantix Labs, back to top" data-nav-logo>${logo.horizontal('nav__svg')}</a>
  <nav class="nav__links" aria-label="Main">
    ${links.map(([h, t]) => `<a href="#${h}">${t}</a>`).join('')}
  </nav>
  <a class="btn btn--bronze btn--sm nav__cta" href="#contact" data-book data-magnetic><span>Book a call</span>${arrowUpRight}</a>
  <button class="nav__menu" type="button" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span><b class="sr-only">Menu</b></button>
</header>
<div class="mobile-menu" id="mobile-menu" hidden>
  <nav aria-label="Mobile">
    ${[...links, ['contact', 'Contact']].map(([h, t]) => `<a href="#${h}">${t}</a>`).join('')}
  </nav>
</div>`;
}

function heroSection() {
  return `
<section class="hero" id="top" data-hero aria-label="Introduction">
  <div class="hero__stage" data-hero-stage>
    <canvas class="hero__canvas" data-hero-canvas aria-hidden="true"></canvas>
    <div class="hero__fallback" aria-hidden="true"></div>
  </div>
  <div class="hero__side hero__side--right" aria-hidden="true"><span class="hero__side-num">02</span>${hero.sideRight.map((s) => `<span>${esc(s)}</span>`).join('')}</div>
  <div class="hero__content">
    <p class="hero__eyebrow" data-fade><span>01</span>${hero.sideLeft.map((s) => esc(s)).join(' · ')}</p>
    <h1 class="hero__title" data-split><span class="line">${esc(hero.titleA)}</span><span class="line"><em>Smarter</em> business.</span></h1>
    <p class="hero__sub" data-fade>${esc(hero.sub)}</p>
    <div class="hero__ctas" data-fade>
      <a class="btn btn--bronze" href="#contact" data-book data-magnetic><span>Book a free call</span>${arrow}</a>
      <a class="btn btn--ghost" href="#work" data-magnetic><span>See it working</span></a>
    </div>
  </div>
  <p class="hero__align" aria-hidden="true">Built with <em>intention.</em></p>
  <p class="hero__bottom" aria-hidden="true">${esc(hero.bottom)}</p>
  <div class="hero__scroll" aria-hidden="true"><span>Scroll to enter</span><i></i></div>
</section>`;
}

function statementSection() {
  return `
<section class="statement" aria-label="What we do">
  <p class="statement__text" data-words>${esc(statement)}</p>
</section>`;
}

function servicesIndex() {
  return `
<section class="services" id="services" aria-labelledby="services-title">
  <div class="services__head">
    <p class="eyebrow">What we build</p>
    <h2 id="services-title" class="h2" data-split>Eight ways to make<br/> a business <em>work better.</em></h2>
  </div>
  <ol class="services__list">
    ${services.map((s, i) => `
    <li>
      <a class="svc-row" href="#svc-${s.id}" data-svc-row>
        <span class="svc-row__num">${pad(i + 1)}</span>
        <span class="svc-row__name">${esc(s.name)}</span>
        <span class="svc-row__tag">${esc(s.tagline.join(' '))}</span>
        <span class="svc-row__go">${arrow}</span>
      </a>
    </li>`).join('')}
  </ol>
</section>`;
}

function marquee() {
  const items = services.map((s) => `<span>${esc(s.tagline.join(' '))}</span><i aria-hidden="true"></i>`).join('');
  return `<div class="marquee" aria-hidden="true"><div class="marquee__track" data-marquee>${items}${items}</div></div>`;
}

function chapter(s, i, prevTone) {
  const flip = i % 2 === 1 && !s.wide;
  const price = (p) => (site.showPrices ? `<p class="plan__price">${esc(p.price)}<small>/month</small></p>` : '');
  const plans = s.plans ? `<div class="plans">${s.plans.map((p) => `<div class="plan"><div><p class="plan__name">${esc(p.name)}</p><p class="plan__note">${esc(p.note)}</p></div>${price(p)}</div>`).join('')}</div>` : '';
  const meta = `
      <dl class="chapter__meta">
        ${site.showPrices ? `<div><dt>Price</dt><dd>${esc(s.price)}</dd></div>` : ''}
        <div><dt>${esc(s.timeLabel || 'Timeline')}</dt><dd>${esc(s.time)}</dd></div>
      </dl>`;
  return `
<section class="chapter tone-${s.tone}${flip ? ' chapter--flip' : ''}${s.wide ? ' chapter--wide' : ''}" id="svc-${s.id}" data-tone="${s.tone}" style="--prev-bg:${toneBg[prevTone] || toneBg.light}" aria-labelledby="svc-${s.id}-title">
  <div class="chapter__inner">
    <div class="chapter__text">
      <div class="chapter__head">
      <p class="chapter__index"><span class="chapter__num">${pad(i + 1)}</span><span class="chapter__of">/ ${pad(services.length)}</span><span class="chapter__name">${esc(s.name)}</span></p>
      <h2 class="chapter__tagline" id="svc-${s.id}-title" data-split>${s.tagline.map((l) => `<span class="line">${esc(l)}</span>`).join('')}</h2>
      </div>
      <div class="chapter__body">
      <p class="chapter__lead" data-fade>${esc(s.lead)}</p>
      <ul class="chapter__incl" data-fade>${s.included.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      ${meta}
      ${plans}
      </div>
    </div>
    <figure class="chapter__demo" data-demo="${s.demo}" data-tilt>
      <div class="demo-stage" data-demo-stage></div>
      <figcaption class="demo-cap"><span class="demo-cap__live">Live demo</span>${esc(s.demoNote)}</figcaption>
    </figure>
  </div>
</section>`;
}

function processSection() {
  return `
<section class="process" id="process" aria-labelledby="process-title">
  <div class="process__head">
    <p class="eyebrow">How it works</p>
    <h2 class="h2" id="process-title" data-split>From first call<br/> to <em>launch day.</em></h2>
  </div>
  <ol class="process__track" data-process>
    ${process.map((p, i) => `
    <li class="step">
      <span class="step__num">${pad(i + 1)}</span>
      <h3 class="step__name">${esc(p.name)}</h3>
      <p class="step__text">${esc(p.text)}</p>
    </li>`).join('')}
  </ol>
</section>`;
}

function foundersSection() {
  return `
<section class="founders" id="founders" aria-labelledby="founders-title">
  <div class="founders__head">
    <p class="eyebrow">The founders</p>
    <h2 class="h2" id="founders-title" data-split>Two founders.<br/> <em>One studio.</em></h2>
  </div>
  <div class="founders__grid">
    ${founders.map((f) => `
    <article class="founder" data-tilt>
      <div class="founder__plate" aria-hidden="true"><span>${esc(f.initials)}</span></div>
      <div class="founder__body">
        <p class="founder__role">${esc(f.role)}</p>
        <h3 class="founder__name">${esc(f.name)}</h3>
        <p class="founder__bio">${esc(f.bio)}</p>
      </div>
    </article>`).join('')}
  </div>
</section>`;
}

function contactSection() {
  const chips = services.map((s, i) => `<label class="chip"><input type="checkbox" name="needs" value="${esc(s.name)}" id="need-${s.id}"/><span>${esc(s.name)}</span></label>`).join('');
  const opts = (arr) => arr.map((x) => `<option>${esc(x)}</option>`).join('');
  return `
<section class="contact tone-dark" id="contact" aria-labelledby="contact-title">
  <div class="contact__inner">
    <div class="contact__intro">
      <p class="eyebrow">Start a project</p>
      <h2 class="h2" id="contact-title" data-split>${contact.title.map((l, i) => `<span class="line">${i === 1 ? `<em>${esc(l)}</em>` : esc(l)}</span>`).join('')}</h2>
      <p class="contact__sub" data-fade>${esc(contact.sub)}</p>
      <p class="contact__where" data-fade>${esc(site.location)}<br/>${esc(site.reach)}</p>
    </div>
    <form class="form" data-form novalidate>
      <div class="form__row">
        <label class="field"><span>Your name</span><input id="f-name" name="name" autocomplete="name" required/></label>
        <label class="field"><span>Email</span><input id="f-email" name="email" type="email" autocomplete="email" required/></label>
      </div>
      <label class="field"><span>Business name</span><input id="f-business" name="business" autocomplete="organization"/></label>
      <fieldset class="field field--chips"><legend>What do you need?</legend><div class="chips">${chips}</div></fieldset>
      <div class="form__row">
        <label class="field"><span>Budget</span><select id="f-budget" name="budget">${opts(contact.budgets)}</select></label>
        <label class="field"><span>Timeline</span><select id="f-timeline" name="timeline">${opts(contact.timelines)}</select></label>
      </div>
      <label class="field"><span>Anything else?</span><textarea id="f-message" name="message" rows="3" placeholder="What is slowing your business down?"></textarea></label>
      <div class="form__foot">
        <button class="btn btn--bronze" type="submit" data-magnetic><span>Send enquiry</span>${arrow}</button>
        <p class="form__status" role="status" aria-live="polite" data-form-status></p>
      </div>
    </form>
  </div>
</section>`;
}

function footer() {
  return `
<footer class="footer tone-dark">
  <div class="footer__top">
    <div class="footer__brand">
      ${logo.horizontal('footer__logo')}
      <p>Websites, 3D, booking systems, automation and AI agents for businesses that want to grow.</p>
    </div>
    <nav class="footer__col" aria-label="Services">
      <p class="eyebrow">Services</p>
      ${services.map((s) => `<a href="#svc-${s.id}">${esc(s.name)}</a>`).join('')}
    </nav>
    <nav class="footer__col" aria-label="Studio">
      <p class="eyebrow">Studio</p>
      ${[...links.slice(1), ['contact', 'Contact']].map(([h, t]) => `<a href="#${h}">${t}</a>`).join('')}
      <button type="button" class="footer__replay" data-replay>Replay the intro</button>
    </nav>
  </div>
  <div class="footer__mark" aria-hidden="true">${logo.mark('footer__bigmark')}</div>
  <div class="footer__base">
    <p>© ${site.year} ${esc(site.name)}. ${esc(site.location)}.</p>
    ${site.showFounders ? `<p>Founded by ${founders.map((f) => esc(f.name)).join(' and ')}.</p>` : ''}
  </div>
</footer>`;
}

function introOverlay() {
  return `
<div class="intro" data-intro aria-hidden="true">
  <canvas class="intro__canvas" data-intro-canvas></canvas>
  <div class="intro__vignette"></div>
  <div class="intro__captions">
    <p data-cap="0">An idea,</p>
    <p data-cap="1">connected,</p>
    <p data-cap="2">comes alive.</p>
  </div>
  <div class="intro__flash" data-intro-flash></div>
  <div class="intro__logo" data-intro-logo>${logo.horizontal('intro__svg')}</div>
  <div class="intro__ui">
    <span class="intro__load"><i data-intro-bar></i></span>
    <button class="intro__skip" type="button" data-intro-skip>Skip intro</button>
  </div>
</div>`;
}

// schema.org data for search engines, from the same content
export function structuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    description: 'Websites, 3D web experiences, booking systems, business automation, AI agents and custom software.',
    ...(site.url ? { url: site.url } : {}),
    ...(site.showFounders ? { founder: founders.map((f) => ({ '@type': 'Person', name: f.name })) } : {}),
    address: { '@type': 'PostalAddress', addressLocality: 'Birmingham', addressCountry: 'GB' },
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

export function renderSite() {
  const tones = services.map((s) => s.tone);
  return [
    introOverlay(),
    nav(),
    '<main id="main">',
    heroSection(),
    statementSection(),
    servicesIndex(),
    marquee(),
    '<div class="chapters" id="work">',
    services.map((s, i) => chapter(s, i, i === 0 ? 'light' : tones[i - 1])).join(''),
    '</div>',
    processSection(),
    site.showFounders ? foundersSection() : '',
    contactSection(),
    '</main>',
    footer(),
    '<div class="cursor" aria-hidden="true"><i></i><span data-cursor-label></span></div>',
    '<div class="grain" aria-hidden="true"></div>',
  ].join('\n');
}
