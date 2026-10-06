// 05 Booking systems: a customer books on their phone; the booking lands in the owner's calendar.
// Fictional clinic, generated availability, no real payment.
import { gsap } from 'gsap';

const SERVICES = [
  { id: 'assess', name: 'Initial assessment', dur: 45, price: 60 },
  { id: 'follow', name: 'Follow-up session', dur: 30, price: 45 },
  { id: 'sports', name: 'Sports massage', dur: 60, price: 55 },
];
const OPEN = 9 * 60, CLOSE = 18 * 60, ROW = 34; // minutes; px per hour
const NAMES = ['J. Patel', 'M. O’Brien', 'S. Khan', 'L. Evans', 'R. Hughes', 'A. Nowak', 'T. Begum', 'C. Wright', 'D. Okafor', 'E. Murphy'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const key = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
function rng(seed) { let a = 0; for (const c of seed) a = (a * 31 + c.charCodeAt(0)) | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function mount(stage) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const book = new Map(); // dateKey -> [{start, dur, who, svc, isNew}]
  const bookingsFor = (d) => {
    const k = key(d);
    if (!book.has(k)) {
      const r = rng(k), list = [];
      if (d.getDay() !== 0) {
        const n = 3 + Math.floor(r() * 4);
        for (let i = 0; i < n * 3 && list.length < n; i++) {
          const dur = [30, 45, 60][Math.floor(r() * 3)];
          const start = OPEN + Math.floor(r() * ((CLOSE - OPEN - dur) / 30)) * 30;
          if (list.some((b) => start < b.start + b.dur && b.start < start + dur)) continue;
          list.push({ start, dur, who: NAMES[Math.floor(r() * NAMES.length)], svc: SERVICES[Math.floor(r() * 3)].name });
        }
      }
      book.set(k, list);
    }
    return book.get(k);
  };

  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const S = { step: 0, svc: null, date: dates.find((d, i) => i > 0 && d.getDay() !== 0), slot: null, deposit: true, booked: 0 };

  stage.innerHTML = `
  <div class="bk">
    <div>
    <p class="bk__who"><b>01</b> Customer, on their phone</p>
    <div class="phone" data-notilt>
      <div class="phone__notch"></div>
      <div class="phone__screen">
        <div class="bk__app"><span class="new__brand"><i></i>Harbour Lane</span><span class="bk__steps" data-steps><i></i><i></i><i></i></span></div>
        <div class="bk__body" data-body></div>
      </div>
    </div>
    </div>
    <div>
      <p class="bk__who"><b>02</b> Owner, in the calendar</p>
      <div class="cal" data-cal></div>
      <p class="bk__nophone"><span class="tag tag--ok"><i class="dot"></i>No phone tag</span><s>Call us to book</s></p>
    </div>
  </div>`;
  const body = stage.querySelector('[data-body]');
  const cal = stage.querySelector('[data-cal]');
  const steps = stage.querySelectorAll('[data-steps] i');

  /* ---------------- owner calendar */
  function weekStart(d) { const x = new Date(d); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return x; }
  function renderCal(highlightNew = false) {
    const ws = weekStart(S.date || today);
    const days = Array.from({ length: 6 }, (_, i) => addDays(ws, i));
    const hours = Array.from({ length: (CLOSE - OPEN) / 60 }, (_, i) => OPEN / 60 + i);
    const total = days.reduce((n, d) => n + bookingsFor(d).length, 0);
    cal.innerHTML = `
      <div class="cal__head"><b>Bookings</b><span>${days[0].getDate()} ${MONTHS[days[0].getMonth()]} – ${days[5].getDate()} ${MONTHS[days[5].getMonth()]}</span><span class="tag">${total} this week</span></div>
      <div class="cal__cols">
        <div class="cal__times"><div class="cal__dh"></div>${hours.map((h) => `<div class="cal__t">${h}:00</div>`).join('')}</div>
        ${days.map((d) => `
          <div class="cal__col${S.date && key(d) === key(S.date) ? ' is-sel' : ''}">
            <div class="cal__dh">${DAYS[d.getDay()]} ${d.getDate()}</div>
            <div class="cal__body" style="height:${hours.length * ROW}px">
              ${bookingsFor(d).map((b) => `<div class="cal__ev${b.isNew ? ' is-new' : ''}" style="top:${((b.start - OPEN) / 60) * ROW}px;height:${(b.dur / 60) * ROW - 2}px"><b>${hhmm(b.start)}</b>${b.who}</div>`).join('')}
            </div>
          </div>`).join('')}
      </div>
      <div class="cal__toast" data-toast></div>`;
    if (highlightNew) {
      const ev = cal.querySelector('.cal__ev.is-new:last-of-type') || cal.querySelector('.cal__ev.is-new');
      if (ev) gsap.from(ev, { scale: 0.5, opacity: 0, duration: 0.9, ease: 'back.out(2)' });
    }
  }

  /* ---------------- phone */
  const slotsFor = (d, dur) => {
    const taken = bookingsFor(d);
    const out = [];
    for (let m = OPEN; m + dur <= CLOSE; m += 30) {
      const clash = taken.some((b) => m < b.start + b.dur && b.start < m + dur);
      out.push({ m, free: !clash && d.getDay() !== 0 });
    }
    return out;
  };
  function show(step) {
    S.step = step;
    steps.forEach((s, i) => s.classList.toggle('on', i <= Math.min(step, 2)));
    let html = '';
    if (step === 0) {
      html = `<div class="bk__pane" data-lenis-prevent>
        <p class="bk__h">Book an appointment</p><p class="bk__sub">Choose a treatment. Times update live.</p>
        ${SERVICES.map((s) => `<button type="button" class="bk__svc" data-svc="${s.id}"><b>${s.name}</b><small>${s.dur} minutes</small><span>£${s.price}</span></button>`).join('')}
      </div>`;
    } else if (step === 1) {
      const slots = slotsFor(S.date, S.svc.dur);
      html = `<div class="bk__pane" data-lenis-prevent>
        <button type="button" class="bk__back" data-back>← ${S.svc.name}</button>
        <p class="bk__h">Pick a time</p>
        <div class="bk__dates" data-lenis-prevent>${dates.map((d) => `<button type="button" class="bk__date" data-date="${key(d)}" aria-pressed="${key(d) === key(S.date)}" ${d.getDay() === 0 ? 'disabled' : ''}><span>${DAYS[d.getDay()]}</span><b>${d.getDate()}</b></button>`).join('')}</div>
        <div class="bk__slots">${slots.map((s) => `<button type="button" class="bk__slot" data-slot="${s.m}" ${s.free ? '' : 'disabled'} aria-pressed="${S.slot === s.m}">${hhmm(s.m)}</button>`).join('')}</div>
        <button type="button" class="bk__go" data-next ${S.slot == null ? 'disabled' : ''}>Continue</button>
      </div>`;
    } else if (step === 2) {
      html = `<div class="bk__pane" data-lenis-prevent>
        <button type="button" class="bk__back" data-back>← ${DAYS[S.date.getDay()]} ${S.date.getDate()} ${MONTHS[S.date.getMonth()]}, ${hhmm(S.slot)}</button>
        <p class="bk__h">Your details</p>
        <label class="bk__field">Name<div>Amelia Rhodes</div></label>
        <label class="bk__field">Email<div>amelia@example.com</div></label>
        <button type="button" class="bk__toggle" data-deposit aria-pressed="${S.deposit}"><span>Pay £20 deposit now<br/><small style="color:#6B7570">Test mode, nothing is charged</small></span><i></i></button>
        <button type="button" class="bk__go" data-confirm>Confirm booking</button>
      </div>`;
    } else {
      html = `<div class="bk__pane bk__done">
        <div class="bk__tick">✓</div>
        <p class="bk__h">You're booked</p>
        <div class="bk__sum">
          <div><span>Treatment</span><span>${S.svc.name}</span></div>
          <div><span>When</span><span>${DAYS[S.date.getDay()]} ${S.date.getDate()} ${MONTHS[S.date.getMonth()]}, ${hhmm(S.slot)}</span></div>
          <div><span>Deposit</span><span>${S.deposit ? '£20 paid (test)' : 'Pay at clinic'}</span></div>
          <div><span>Reminder</span><span>SMS + email, day before</span></div>
        </div>
        <button type="button" class="bk__go" data-again style="width:100%">Book another</button>
      </div>`;
    }
    body.innerHTML = html;
    gsap.from(body.firstElementChild, { x: step >= S.prevStep ? 40 : -40, opacity: 0, duration: 0.5, ease: 'expo.out' });
    S.prevStep = step;
  }
  S.prevStep = 0;

  body.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.svc) { S.svc = SERVICES.find((s) => s.id === t.dataset.svc); S.slot = null; show(1); }
    else if (t.dataset.date) { S.date = dates.find((d) => key(d) === t.dataset.date); S.slot = null; show(1); renderCal(); }
    else if (t.dataset.slot) { S.slot = +t.dataset.slot; body.querySelectorAll('[data-slot]').forEach((b) => b.setAttribute('aria-pressed', String(b === t))); body.querySelector('[data-next]').disabled = false; }
    else if (t.hasAttribute('data-next')) show(2);
    else if (t.hasAttribute('data-back')) show(S.step - 1);
    else if (t.hasAttribute('data-deposit')) { S.deposit = !S.deposit; t.setAttribute('aria-pressed', String(S.deposit)); }
    else if (t.hasAttribute('data-confirm')) {
      bookingsFor(S.date).forEach((b) => { b.isNew = false; });
      bookingsFor(S.date).push({ start: S.slot, dur: S.svc.dur, who: 'Amelia R.', svc: S.svc.name, isNew: true });
      S.booked++;
      show(3);
      renderCal(true);
      const toast = cal.querySelector('[data-toast]');
      toast.innerHTML = `<b>New booking</b> · ${S.svc.name}<br/>${DAYS[S.date.getDay()]} ${hhmm(S.slot)} · ${S.deposit ? 'deposit paid (test)' : 'pay at clinic'}<br/>Reminder scheduled for the day before`;
      requestAnimationFrame(() => toast.classList.add('show'));
      setTimeout(() => toast.classList.remove('show'), 4200);
    } else if (t.hasAttribute('data-again')) { S.slot = null; show(0); }
  });

  show(0);
  renderCal();
  return {};
}
