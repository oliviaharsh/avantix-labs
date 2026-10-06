// 03 Business automation: a workflow canvas. Press Run and an enquiry travels through six steps
// that someone would otherwise copy and paste by hand. Nodes can be dragged. Example data only.
import { gsap } from 'gsap';

const STEPS = [
  { id: 'form', title: 'New enquiry', sub: 'Website form', ico: 'F', bg: '#191814' },
  { id: 'ai', title: 'Qualify with AI', sub: 'Need, budget, fit', ico: 'AI', bg: '#8A4B2A' },
  { id: 'crm', title: 'Create contact', sub: 'CRM', ico: 'CR', bg: '#746F64' },
  { id: 'mail', title: 'Send welcome email', sub: 'Personalised', ico: '@', bg: '#3E6B57' },
  { id: 'cal', title: 'Book discovery call', sub: 'Calendar invite', ico: '31', bg: '#5B5A8C' },
  { id: 'team', title: 'Notify the team', sub: 'Slack or WhatsApp', ico: '#', bg: '#B5793F' },
];
const LEADS = [
  { name: 'Amelia Rhodes', co: 'Harbour Lane Physio', need: 'online booking', budget: '£1k–3k', fit: 86, day: 'Thu', time: '10:30' },
  { name: 'Raj Mehta', co: 'Mehta Exports', need: 'catalogue + RFQ site', budget: '₹1L', fit: 78, day: 'Fri', time: '14:00' },
  { name: 'Sophie Clarke', co: 'Clarke Care Ltd', need: 'carer recruitment flow', budget: '£3k–10k', fit: 91, day: 'Mon', time: '09:45' },
];
const DESK = [[0.03, 0.1], [0.355, 0.1], [0.68, 0.1], [0.68, 0.6], [0.355, 0.6], [0.03, 0.6]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toLocaleTimeString('en-GB', { hour12: false });

export function mount(stage) {
  stage.innerHTML = `
  <div class="frame af">
    <div class="af__head">
      <div class="af__name">New enquiry to booked call <span class="tag tag--ok"><i class="dot"></i>Active</span></div>
      <div class="af__stats"><span>Runs <b data-runs>0</b></span><span>Copy-pastes avoided <b data-saved>0</b></span></div>
      <button class="ui-btn ui-btn--acc" type="button" data-run>Run workflow</button>
    </div>
    <div class="af__canvas" data-canvas>
      <svg class="af__svg" data-svg aria-hidden="true"></svg>
      ${STEPS.map((s, i) => `
      <div class="af__node" data-node="${i}" data-cursor="Drag" tabindex="0" aria-label="Step ${i + 1}: ${s.title}">
        <span class="af__ico" style="background:${s.bg}">${s.ico}</span>
        <b>${s.title}</b><small data-sub>${s.sub}</small>
        <span class="af__state" aria-hidden="true"></span>
      </div>`).join('')}
    </div>
    <div class="af__log" data-log aria-live="polite">
      <p>${now()} · Workflow ready. Press <b>Run workflow</b> to send a sample enquiry through it.</p>
    </div>
  </div>`;

  const canvas = stage.querySelector('[data-canvas]');
  const svg = stage.querySelector('[data-svg]');
  const nodes = [...stage.querySelectorAll('[data-node]')];
  const log = stage.querySelector('[data-log]');
  const runBtn = stage.querySelector('[data-run]');
  const pos = DESK.map(([x, y]) => ({ x, y })); // normalised
  let moved = false;

  const NS = 'http://www.w3.org/2000/svg';
  const edges = STEPS.slice(1).map(() => { const p = document.createElementNS(NS, 'path'); p.setAttribute('class', 'af__edge'); svg.appendChild(p); return p; });
  const packet = document.createElementNS(NS, 'circle');
  packet.setAttribute('r', '5'); packet.setAttribute('class', 'af__packet'); packet.style.opacity = '0';
  svg.appendChild(packet);

  function layout() {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    const narrow = W < 520;
    nodes.forEach((n, i) => {
      let x, y;
      if (narrow && !moved) { x = 0.08 + (i % 2) * 0.34; y = 0.04 + i * 0.155; }
      else { x = pos[i].x; y = pos[i].y; }
      n.style.left = `${Math.round(x * W)}px`;
      n.style.top = `${Math.round(y * H)}px`;
    });
    drawEdges();
  }
  function port(el, side) {
    const x = el.offsetLeft, y = el.offsetTop, w = el.offsetWidth, h = el.offsetHeight;
    return { r: [x + w, y + h / 2], l: [x, y + h / 2], b: [x + w / 2, y + h], t: [x + w / 2, y] }[side];
  }
  function drawEdges() {
    edges.forEach((p, i) => {
      const a = nodes[i], b = nodes[i + 1];
      const dx = b.offsetLeft - a.offsetLeft, dy = b.offsetTop - a.offsetTop;
      let s, e, c1, c2;
      if (Math.abs(dx) >= Math.abs(dy)) {
        s = dx > 0 ? port(a, 'r') : port(a, 'l'); e = dx > 0 ? port(b, 'l') : port(b, 'r');
        const k = Math.max(40, Math.abs(e[0] - s[0]) * 0.45) * Math.sign(dx || 1);
        c1 = [s[0] + k, s[1]]; c2 = [e[0] - k, e[1]];
      } else {
        s = dy > 0 ? port(a, 'b') : port(a, 't'); e = dy > 0 ? port(b, 't') : port(b, 'b');
        const k = Math.max(30, Math.abs(e[1] - s[1]) * 0.45) * Math.sign(dy || 1);
        c1 = [s[0], s[1] + k]; c2 = [e[0], e[1] - k];
      }
      p.setAttribute('d', `M${s[0]},${s[1]} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${e[0]},${e[1]}`);
    });
  }
  new ResizeObserver(layout).observe(canvas);
  layout();

  // dragging
  nodes.forEach((n, i) => {
    let sx = 0, sy = 0, ox = 0, oy = 0, drag = false;
    n.addEventListener('pointerdown', (e) => {
      drag = true; n.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY; ox = n.offsetLeft; oy = n.offsetTop;
    });
    n.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const W = canvas.clientWidth, H = canvas.clientHeight;
      const x = Math.max(0, Math.min(W - n.offsetWidth, ox + e.clientX - sx));
      const y = Math.max(0, Math.min(H - n.offsetHeight, oy + e.clientY - sy));
      n.style.left = `${x}px`; n.style.top = `${y}px`;
      pos[i] = { x: x / W, y: y / H }; moved = true;
      drawEdges();
    });
    const end = () => { drag = false; };
    n.addEventListener('pointerup', end); n.addEventListener('pointercancel', end);
  });

  function write(html) {
    const p = document.createElement('p');
    p.innerHTML = `${now()} · ${html}`;
    log.appendChild(p);
    while (log.children.length > 6) log.firstElementChild.remove();
  }
  function travel(i) {
    return new Promise((resolve) => {
      const path = edges[i];
      const len = path.getTotalLength();
      path.classList.add('is-run');
      packet.style.opacity = '1';
      const o = { t: 0 };
      gsap.to(o, {
        t: 1, duration: 0.6, ease: 'power1.inOut',
        onUpdate: () => { const pt = path.getPointAtLength(o.t * len); packet.setAttribute('cx', pt.x); packet.setAttribute('cy', pt.y); },
        onComplete: () => { path.classList.remove('is-run'); packet.style.opacity = '0'; resolve(); },
      });
    });
  }

  let runs = 0, busy = false;
  async function run() {
    if (busy) return;
    busy = true; runBtn.disabled = true; runBtn.textContent = 'Running…';
    nodes.forEach((n) => n.classList.remove('is-run', 'is-done'));
    const L = LEADS[runs % LEADS.length];
    const first = L.name.split(' ')[0];
    const lines = [
      `Form submitted by <b>${L.name}</b>, ${L.co}`,
      `AI read the message: <b>${L.need}</b>, budget ${L.budget}, fit <b>${L.fit}/100</b>`,
      `Contact created in CRM <b>#${1042 + runs}</b> with notes and source`,
      `Email sent: <b>“Thanks ${first}, here is what happens next”</b>`,
      `Discovery call booked for <b>${L.day} ${L.time}</b>, invite sent`,
      `Team notified in <b>#new-leads</b> with a one-line summary`,
    ];
    const t0 = performance.now();
    for (let i = 0; i < STEPS.length; i++) {
      nodes[i].classList.add('is-run');
      await sleep(420 + Math.random() * 380);
      nodes[i].classList.remove('is-run'); nodes[i].classList.add('is-done');
      write(`<span class="ok">✓</span> ${lines[i]}`);
      if (i < STEPS.length - 1) await travel(i);
    }
    runs++;
    stage.querySelector('[data-runs]').textContent = runs;
    stage.querySelector('[data-saved]').textContent = runs * 6;
    write(`<b>Done in ${((performance.now() - t0) / 1000).toFixed(1)}s.</b> Nobody copied anything.`);
    busy = false; runBtn.disabled = false; runBtn.textContent = 'Run again';
  }
  runBtn.addEventListener('click', run);

  let auto = false;
  return {
    resume() { if (!auto && !runs) { auto = true; setTimeout(() => { if (!runs && !busy) run(); }, 900); } },
    pause() {},
  };
}
