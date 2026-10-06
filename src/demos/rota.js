// 06 Custom software: a care agency's weekly rota. Drag visits onto carers (or tap a visit, then a cell),
// see clashes and training gaps instantly, or let it fill the gaps. Fictional agency and people.
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const CARERS = [
  { id: 'grace', name: 'Grace O.', role: 'Senior carer', med: true },
  { id: 'tomasz', name: 'Tomasz K.', role: 'Carer', med: false },
  { id: 'aisha', name: 'Aisha B.', role: 'Medication trained', med: true },
  { id: 'daniel', name: 'Daniel R.', role: 'Carer', med: false },
  { id: 'priya', name: 'Priya S.', role: 'Team lead', med: true },
];
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

function seedVisits() {
  const v = [];
  let n = 0;
  const add = (day, client, start, end, med, carer = null) => v.push({ id: `v${n++}`, day, client, start, end, med, carer });
  // assigned
  add(0, 'E. Ahmed', '07:30', '08:15', true, 'grace'); add(0, 'J. Lewis', '09:00', '09:30', false, 'tomasz');
  add(0, 'M. Doyle', '12:00', '12:45', false, 'daniel'); add(1, 'E. Ahmed', '07:30', '08:15', true, 'aisha');
  add(1, 'B. Singh', '10:00', '11:00', false, 'tomasz'); add(1, 'R. Hall', '17:00', '17:30', true, 'priya');
  add(2, 'E. Ahmed', '07:30', '08:15', true, 'grace'); add(2, 'P. Wood', '13:00', '13:45', false, 'daniel');
  add(3, 'J. Lewis', '09:00', '09:30', false, 'daniel'); add(3, 'R. Hall', '17:00', '17:30', true, 'aisha');
  add(4, 'E. Ahmed', '07:30', '08:15', true, 'priya'); add(4, 'B. Singh', '10:00', '11:00', false, 'tomasz');
  // a deliberate problem: a medication visit given to someone without the training
  add(2, 'R. Hall', '17:00', '17:30', true, 'tomasz');
  // unassigned
  add(0, 'R. Hall', '17:00', '17:30', true); add(1, 'P. Wood', '13:00', '13:45', false);
  add(2, 'B. Singh', '10:00', '11:00', false); add(3, 'E. Ahmed', '07:30', '08:15', true);
  add(3, 'M. Doyle', '12:00', '12:45', false); add(4, 'J. Lewis', '09:00', '09:30', false);
  add(4, 'P. Wood', '13:00', '13:45', false);
  return v;
}

export function mount(stage) {
  let visits = seedVisits();
  stage.innerHTML = `
  <div class="frame rt" data-notilt>
    <div class="rt__head">
      <b>Rota · Week 42</b>
      <div class="rt__kpis" data-kpis></div>
      <button class="ui-btn ui-btn--acc" type="button" data-fill>Fill the gaps</button>
      <button class="ui-btn ui-btn--ghost" type="button" data-reset>Reset</button>
    </div>
    <div class="rt__tray" data-tray></div>
    <div class="rt__grid" data-grid></div>
  </div>`;
  const tray = stage.querySelector('[data-tray]');
  const grid = stage.querySelector('[data-grid]');
  const kpis = stage.querySelector('[data-kpis]');
  let picked = null;

  const problems = () => {
    const bad = new Set();
    for (const a of visits) {
      if (!a.carer) continue;
      const c = CARERS.find((x) => x.id === a.carer);
      if (a.med && !c.med) bad.add(a.id);
      for (const b of visits) {
        if (a === b || a.carer !== b.carer || a.day !== b.day) continue;
        if (toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end)) { bad.add(a.id); bad.add(b.id); }
      }
    }
    return bad;
  };
  const card = (v, bad, inTray) => `<button type="button" class="rt__card${v.med ? ' med' : ''}${bad.has(v.id) ? ' is-conflict' : ''}${picked === v.id ? ' is-picked' : ''}" data-v="${v.id}" data-flip-id="${v.id}" title="${v.med ? 'Needs medication training. ' : ''}${bad.has(v.id) ? 'Problem: check training or times.' : ''}"><b>${v.client}</b><small>${inTray ? `${DAYS[v.day]} ` : ''}${v.start}–${v.end}</small></button>`;

  function render() {
    const bad = problems();
    const open = visits.filter((v) => !v.carer);
    tray.innerHTML = open.length
      ? `<p>${open.length} visit${open.length > 1 ? 's' : ''} need a carer</p>${open.sort((a, b) => a.day - b.day || toMin(a.start) - toMin(b.start)).map((v) => card(v, bad, true)).join('')}`
      : '<p>Every visit is covered.</p>';
    tray.dataset.drop = 'tray';
    const hours = (cid) => visits.filter((v) => v.carer === cid).reduce((h, v) => h + (toMin(v.end) - toMin(v.start)) / 60, 0);
    const maxH = 8;
    grid.innerHTML = `<div class="rt__colh"></div>${DAYS.map((d) => `<div class="rt__colh">${d}</div>`).join('')}
      ${CARERS.map((c) => `
        <div class="rt__who"><b>${c.name}</b><small>${c.role}</small><span class="rt__load"><i style="width:${Math.min(100, (hours(c.id) / maxH) * 100)}%"></i></span></div>
        ${DAYS.map((_, di) => `<div class="rt__cell" data-drop="${c.id}:${di}">${visits.filter((v) => v.carer === c.id && v.day === di).sort((a, b) => toMin(a.start) - toMin(b.start)).map((v) => card(v, bad, false)).join('')}</div>`).join('')}
      `).join('')}`;
    const covered = visits.length - open.length;
    kpis.innerHTML = `<span>Covered <b>${covered}/${visits.length}</b></span><span class="${bad.size ? 'bad' : ''}">Problems <b>${bad.size}</b></span>`;
  }

  function move(id, target, animate = true) {
    const state = animate ? Flip.getState(stage.querySelectorAll('.rt__card')) : null;
    const v = visits.find((x) => x.id === id);
    if (target === 'tray') v.carer = null;
    else {
      const [cid, di] = target.split(':');
      if (+di !== v.day) return false; // a visit stays on its day
      v.carer = cid;
    }
    picked = null;
    render();
    if (state) Flip.from(state, { duration: 0.55, ease: 'power3.inOut', targets: stage.querySelectorAll('.rt__card'), absolute: true });
    return true;
  }

  function fill() {
    const state = Flip.getState(stage.querySelectorAll('.rt__card'));
    // fix training problems first, then cover open visits with the least-loaded qualified carer
    const bad = problems();
    visits.forEach((v) => { if (bad.has(v.id) && v.carer && v.med && !CARERS.find((c) => c.id === v.carer).med) v.carer = null; });
    const load = (cid) => visits.filter((x) => x.carer === cid).length;
    visits.filter((v) => !v.carer).forEach((v) => {
      const options = CARERS.filter((c) => (!v.med || c.med) && !visits.some((o) => o.carer === c.id && o.day === v.day && toMin(v.start) < toMin(o.end) && toMin(o.start) < toMin(v.end)));
      options.sort((a, b) => load(a.id) - load(b.id));
      if (options[0]) v.carer = options[0].id;
    });
    picked = null;
    render();
    Flip.from(state, { duration: 0.8, ease: 'power3.inOut', stagger: 0.04, targets: stage.querySelectorAll('.rt__card'), absolute: true });
  }

  /* ---------------- drag and drop (pointer), plus tap-to-pick for keyboard and touch */
  let drag = null;
  stage.addEventListener('pointerdown', (e) => {
    const c = e.target.closest('.rt__card'); if (!c || e.button > 0) return;
    drag = { id: c.dataset.v, el: c, x: e.clientX, y: e.clientY, started: false, ghost: null };
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.started && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) {
      drag.started = true;
      const r = drag.el.getBoundingClientRect();
      drag.ghost = drag.el.cloneNode(true);
      drag.ghost.classList.add('rt__ghost');
      Object.assign(drag.ghost.style, { width: `${r.width}px`, left: `${r.left}px`, top: `${r.top}px` });
      drag.dx = e.clientX - r.left; drag.dy = e.clientY - r.top;
      document.body.appendChild(drag.ghost);
      drag.el.style.opacity = '0.3';
      const v = visits.find((x) => x.id === drag.id);
      stage.querySelectorAll('.rt__cell').forEach((cell) => { if (+cell.dataset.drop.split(':')[1] === v.day) cell.classList.add('is-target'); });
    }
    if (drag.started) {
      drag.ghost.style.left = `${e.clientX - drag.dx}px`;
      drag.ghost.style.top = `${e.clientY - drag.dy}px`;
      stage.querySelectorAll('.is-over').forEach((x) => x.classList.remove('is-over'));
      const under = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-drop]');
      if (under && stage.contains(under)) under.classList.add('is-over');
    }
  });
  addEventListener('pointerup', (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    stage.querySelectorAll('.is-over, .is-target').forEach((x) => x.classList.remove('is-over', 'is-target'));
    if (!d.started) { // a tap: pick, or drop the picked one here
      picked = picked === d.id ? null : d.id;
      render();
      return;
    }
    d.ghost.remove(); d.el.style.opacity = '';
    const under = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-drop]');
    if (!under || !stage.contains(under) || !move(d.id, under.dataset.drop)) render();
  });
  stage.addEventListener('click', (e) => {
    if (!picked) return;
    const cell = e.target.closest('[data-drop]');
    if (cell && !e.target.closest('.rt__card')) move(picked, cell.dataset.drop);
  });
  stage.querySelector('[data-fill]').addEventListener('click', fill);
  stage.querySelector('[data-reset]').addEventListener('click', () => { visits = seedVisits(); picked = null; render(); });

  render();
  return {};
}
