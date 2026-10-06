// 04 AI agents: a scripted demo of a clinic's website assistant at 2am, with a side panel that shows
// what the agent did behind the scenes. Fictional clinic; replies are pre-written for the demo.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const QA = [
  {
    q: 'Do you have anything this Saturday?',
    trace: ['calendar.search(day: "Saturday")', '→ 3 free slots with Dr Ellis'],
    a: 'Yes. Saturday has three openings with Dr Ellis, our sports physio. Shall I hold one for you?',
    slots: ['09:30', '11:00', '14:15'],
  },
  {
    q: 'How much is a first appointment?',
    trace: ['knowledge.lookup("prices")', '→ prices page, updated last week'],
    a: 'An initial assessment is £60 for 45 minutes and follow-ups are £45. You can pay a £20 deposit online and the rest at the clinic.',
    card: ['Initial assessment', '45 min · £60 · £20 deposit online'],
  },
  {
    q: 'Do you treat lower back pain?',
    trace: ['knowledge.lookup("conditions")', 'safety.check(red flags) → none'],
    a: 'Yes, it is one of the most common things we treat. Your first session includes an assessment and a plan you can follow at home. If you ever have numbness or loss of bladder control, please call 999 or go to A&E.',
  },
  {
    q: 'Can I speak to a person?',
    trace: ['handoff.create(priority: normal)', '→ ticket #2214 for the front desk'],
    a: 'Of course. I have passed your message to the team and Sarah will reply after 9am. Your reference is #2214.',
    handoff: true,
  },
];

export function mount(stage) {
  stage.innerHTML = `
  <div class="ag">
    <div class="ag__chat" data-notilt>
      <div class="ag__head">
        <span class="ag__av" aria-hidden="true"></span>
        <div class="ag__who"><b>Ava</b><small>Harbour Lane Physio assistant</small></div>
        <span class="ag__clock" data-clock>02:14</span>
      </div>
      <div class="ag__msgs" data-msgs aria-live="polite" data-lenis-prevent>
        <div class="ag__msg ag__msg--bot">Hi, I'm Ava. I can check availability, answer questions about treatment and prices, or pass you to the team. What can I help with?</div>
      </div>
      <div class="ag__foot">
        <div class="ag__chips" data-chips>${QA.map((x, i) => `<button type="button" data-q="${i}">${x.q}</button>`).join('')}</div>
        <div class="ag__input" aria-hidden="true">Choose a question above</div>
      </div>
    </div>
    <div class="ag__side">
      <div class="ag__panel"><h4>Behind the scenes</h4><div class="ag__trace" data-trace><p>Waiting for a question…</p></div></div>
      <div class="ag__panel"><h4>Timesheet</h4>
        <div class="ag__sheet">
          <span>Hours</span><span>00:00–24:00</span>
          <span>Days</span><span>Mon–Sun</span>
          <span>Breaks</span><span>None needed</span>
          <span>Questions handled</span><span data-count>0</span>
          <span>Pay rises requested</span><span>0</span>
        </div>
      </div>
    </div>
  </div>`;

  const msgs = stage.querySelector('[data-msgs]');
  const trace = stage.querySelector('[data-trace]');
  const chips = stage.querySelector('[data-chips]');
  const count = stage.querySelector('[data-count]');
  const clock = stage.querySelector('[data-clock]');
  let handled = 0, busy = false, minutes = 14;

  const scrollDown = () => { msgs.scrollTop = msgs.scrollHeight; };
  const add = (cls, html) => {
    const d = document.createElement('div');
    d.className = `ag__msg ${cls}`;
    d.innerHTML = html;
    msgs.appendChild(d); scrollDown();
    return d;
  };
  const tracePush = (txt) => {
    if (trace.firstElementChild?.textContent.startsWith('Waiting')) trace.innerHTML = '';
    const p = document.createElement('p'); p.innerHTML = txt; trace.appendChild(p);
    while (trace.children.length > 7) trace.firstElementChild.remove();
  };
  const tickClock = () => { minutes += 1; clock.textContent = `02:${String(minutes % 60).padStart(2, '0')}`; };

  async function stream(el, text) {
    const words = text.split(' ');
    el.textContent = '';
    for (let i = 0; i < words.length; i++) { el.textContent += (i ? ' ' : '') + words[i]; scrollDown(); await sleep(28 + Math.random() * 30); }
  }

  async function ask(i) {
    if (busy) return;
    busy = true;
    chips.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    const x = QA[i];
    add('ag__msg--me', x.q);
    tickClock();
    const typing = add('ag__msg--bot ag__typing', '<i></i><i></i><i></i>');
    for (const t of x.trace) { await sleep(380); tracePush(t.startsWith('→') ? `<b>${t}</b>` : t); }
    await sleep(300);
    typing.remove();
    const bubble = add('ag__msg--bot', '');
    await stream(bubble, x.a);
    if (x.slots) {
      const row = document.createElement('div'); row.className = 'ag__slots';
      row.innerHTML = x.slots.map((s) => `<button type="button" data-slot="${s}">Sat ${s}</button>`).join('');
      bubble.appendChild(row); scrollDown();
      row.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-slot]'); if (!b) return;
        row.querySelectorAll('button').forEach((o) => { o.disabled = true; });
        add('ag__msg--me', `Saturday at ${b.dataset.slot}, please`);
        tracePush(`booking.create(Sat ${b.dataset.slot}, Dr Ellis)`);
        await sleep(500);
        tracePush('<b>→ confirmed, reminder scheduled for Friday</b>');
        const done = add('ag__msg--bot', '');
        await stream(done, `Done. You're booked for Saturday at ${b.dataset.slot}. A confirmation is on its way to your email and I'll send a reminder the day before.`);
        handled++; count.textContent = handled;
      }, { once: true });
    }
    if (x.card) {
      const c = document.createElement('div'); c.className = 'ag__card';
      c.innerHTML = `<b>${x.card[0]}</b><span>${x.card[1]}</span>`;
      bubble.appendChild(c); scrollDown();
    }
    if (x.handoff) {
      const c = document.createElement('div'); c.className = 'ag__card';
      c.innerHTML = '<b>Passed to a person</b><span>Ticket #2214 · front desk · reply expected after 9am</span>';
      bubble.appendChild(c); scrollDown();
    }
    handled++; count.textContent = handled;
    chips.querySelectorAll('button').forEach((b) => { b.disabled = false; });
    chips.querySelector(`[data-q="${i}"]`).disabled = true;
    busy = false;
  }
  chips.addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (b) ask(+b.dataset.q); });

  let started = false;
  return {
    resume() { if (!started) { started = true; setTimeout(() => { if (!handled && !busy) ask(0); }, 1100); } },
    pause() {},
  };
}
