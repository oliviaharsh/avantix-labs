// Single source of truth for the site's words, prices and settings.
// Edit here; the HTML is generated from this file at build time (see vite.config.js).

export const site = {
  name: 'Avantix Labs',
  // Public address of the live site (used for link previews). Change when the real domain is ready.
  url: 'https://oliviaharsh.github.io/avantix-labs/',
  location: 'Birmingham, UK',
  reach: 'Working with businesses across the UK and India.',
  // Paste a Formspree / Basin / your own endpoint here to make the enquiry form send.
  // While empty, the form says plainly that nothing was sent.
  formEndpoint: '',
  // Optional: a Cal.com or Calendly link for the "Book a call" buttons. Empty = scroll to the form.
  bookingUrl: '',
  email: '',
  showPrices: true,
  year: 2026,
};

export const hero = {
  sideLeft: ['Ideas', 'Systems', 'Growth'],
  sideRight: ['Websites', '3D web', 'Automation', 'AI agents'],
  bottom: 'UK businesses · Indian manufacturers',
  titleA: 'Better websites.',
  titleB: 'Smarter business.',
  sub: 'Avantix Labs designs and builds websites, 3D experiences, booking systems, automation and AI agents. Beautiful on the surface, hard-working underneath.',
};

export const statement =
  'Most small businesses still run on phone calls, spreadsheets and copy-paste. We replace them with a website people remember and systems that quietly do the work, so you can get back to the part of the business you actually enjoy.';

export const services = [
  {
    id: 'web',
    name: 'Web development',
    tagline: ['Designed to impress.', 'Built to convert.'],
    lead: 'Your website is often the first meeting. We design sites that look the part and are built to turn visitors into enquiries: fast on mobile, clear about what you do, and easy to act on.',
    included: ['Up to 10 pages, written with you', 'Mobile-first, fast-loading build', 'Enquiry forms wired to your inbox', 'SEO basics, analytics and Google Business Profile'],
    price: 'From £450',
    time: '1–4 weeks',
    demo: 'webdev',
    demoNote: 'Drag the handle to compare. Fictional clinic, concept redesign.',
    tone: 'light',
  },
  {
    id: '3d',
    name: '3D web',
    tagline: ['Make an entrance', 'they can explore.'],
    lead: 'For brands that sell something worth looking at. Interactive 3D lets visitors turn your product over, open it up and explore it in the browser, with no app to install.',
    included: ['Real-time 3D product viewers and configurators', 'Scroll-driven 3D storytelling', 'Fast loading, with graceful fallbacks on older phones', 'Content your team can update'],
    price: 'Quoted per project',
    time: 'Scoped on a call',
    demo: 'product3d',
    demoNote: 'Drag to rotate. Fictional manufacturer, concept product viewer.',
    tone: 'dark',
  },
  {
    id: 'automation',
    name: 'Business automation',
    tagline: ['Copy. Paste.', 'Repeat. Retire.'],
    lead: 'If someone on your team copies data from one place to another, that job can probably run itself. We connect the tools you already use so enquiries, invoices and follow-ups move on their own.',
    included: ['Process mapping session', 'Make, Zapier or n8n workflows', 'Error alerts and a monthly health check', 'Handover video for your team'],
    price: 'From £250 per workflow',
    time: '3–10 days',
    demo: 'automation',
    demoNote: 'Press Run. Drag the nodes. Example data.',
    tone: 'light',
  },
  {
    id: 'ai',
    name: 'AI agents',
    tagline: ['Works 24/7.', 'Never asks for a raise.'],
    lead: 'An assistant that answers questions, qualifies leads and books appointments at 2am on a Sunday. Trained on your own information, with a human always one click away.',
    included: ['Website chat assistant', 'Lead qualification and booking', 'Email triage and drafting', 'Human review and hand-off built in'],
    price: 'From £800 setup',
    time: '2–5 weeks',
    demo: 'aiagent',
    demoNote: 'Pick a question. Scripted demo conversation, fictional clinic.',
    tone: 'dark',
  },
  {
    id: 'booking',
    name: 'Booking systems',
    tagline: ['“Call us to book” is not', 'a booking system.'],
    lead: 'Let customers book, pay a deposit and get reminders without picking up the phone. Every booking lands in your calendar, and reminders do the chasing so fewer appointments are missed.',
    included: ['Online booking with calendar sync', 'Stripe deposits and payments', 'Email and SMS reminders', 'Admin dashboard'],
    price: 'From £1,200',
    time: '3–6 weeks',
    demo: 'booking',
    wide: true,
    demoNote: 'Book a slot on the phone and watch it land in the owner’s calendar. Nothing is charged.',
    tone: 'light',
  },
  {
    id: 'software',
    name: 'Custom software',
    tagline: ['Make your tools fit', 'the way you work.'],
    lead: 'When off-the-shelf software makes you work around it, we build the tool around you: rotas, quoting, stock, client portals. Exactly the screens your team needs and nothing they don’t.',
    included: ['Discovery workshop with your team', 'Web app with secure logins', 'Integrations with your existing systems', 'Training and ongoing support'],
    price: 'Quoted per project',
    time: 'Scoped on a call',
    demo: 'rota',
    demoNote: 'Drag visits between carers, or let it fill the gaps. Fictional care agency.',
    tone: 'stone',
  },
  {
    id: 'care',
    name: 'Hosting & maintenance',
    tagline: ['We keep it running.', 'You keep it growing.'],
    lead: 'Launch day is the start. We host, monitor, back up and update your site and systems, and send a short report every month showing exactly what we did.',
    included: ['Managed hosting and SSL', 'Daily backups and uptime monitoring', 'Security updates', 'A monthly report in plain English'],
    price: 'From £30/month',
    time: 'Monthly, no lock-in',
    timeLabel: 'Terms',
    demo: 'monitoring',
    demoNote: 'Example dashboard. Try simulating an incident.',
    tone: 'dark',
    plans: [
      { name: 'Essential', price: '£30–45', note: 'Hosting, SSL, daily backups, uptime monitoring, security updates' },
      { name: 'Growth', price: '£75–120', note: 'Essential, plus an hour of edits, a monthly report and SEO tweaks' },
      { name: 'Automation Care', price: '£100–300', note: 'Monitoring and fixing automations and AI agents, API cost management' },
    ],
  },
  {
    id: 'export',
    name: 'B2B & export',
    tagline: ['There’s a bigger world', 'beyond “PDF ATTACHED”.'],
    lead: 'Buyers abroad shortlist suppliers online before they ever send an email. We build export-ready catalogues with clear specs, multi-currency quotes and request-for-quote flows, so the conversation starts with a qualified enquiry instead of a PDF.',
    included: ['Product catalogue with technical specs', 'RFQ and quote request flows', 'Multi-currency and multi-language', 'Export SEO for international buyers'],
    price: 'From ₹40,000',
    time: '2–4 weeks',
    demo: 'export',
    wide: true,
    demoNote: 'Switch currency, add parts to a request for quote. Fictional manufacturer, example rates.',
    tone: 'light',
  },
];

export const process = [
  { name: 'Discovery call', text: 'Twenty minutes to understand your business and where time or money is leaking.' },
  { name: 'Proposal in 48 hours', text: 'A fixed price with three options, what is included and what is not.' },
  { name: 'Build', text: 'A staging link so you can watch it come together, with two rounds of revisions included.' },
  { name: 'Launch & care', text: 'We launch, train your team with a short video and keep everything running on a care plan.' },
];

// Parth first, as agreed.
export const founders = [
  {
    name: 'Parth Savaliya',
    initials: 'PS',
    role: 'Co-founder',
    bio: 'Finance and MBA background, with first-hand experience of how UK care and health businesses really run. Parth leads discovery and makes sure every system solves a real problem.',
  },
  {
    name: 'Harsh Walia',
    initials: 'HW',
    role: 'Co-founder',
    bio: 'Builds the engineering behind the studio: e-commerce, automation pipelines and AI agents, with a background in finance and equity research.',
  },
];

export const contact = {
  title: ['Let’s build something', 'people remember.'],
  sub: 'Book a free 20-minute call. Tell us what is slowing your business down and we will show you what we would build.',
  budgets: ['Under £1k', '£1k–3k', '£3k–10k', '£10k+', 'Not sure yet'],
  timelines: ['As soon as possible', 'In 1–3 months', 'Just exploring'],
};
