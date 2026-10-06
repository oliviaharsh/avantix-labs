// 07 Hosting & maintenance: the dashboard behind a care plan. Live response times, uptime history,
// backups, updates and Core Web Vitals, plus a simulated incident from alert to fix. Example data.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clock = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function mount(stage) {
  const bars = Array.from({ length: 60 }, (_, i) => (i === 37 ? 'warn' : ''));
  stage.innerHTML = `
  <div class="mn" data-mn>
    <div class="mn__top">
      <span class="mn__site">harbourlanephysio.co.uk</span>
      <span class="tag">Care plan · Growth</span>
      <span class="mn__status" data-status><span class="tag tag--ok"><i class="dot"></i>All systems normal</span></span>
      <button class="ui-btn ui-btn--ghost" type="button" data-incident>Simulate an incident</button>
    </div>
    <div class="mn__grid">
      <div class="mn__card mn__w4">
        <h5><span>Response time</span><span data-rt-now>—</span></h5>
        <svg class="mn__spark" viewBox="0 0 300 64" preserveAspectRatio="none" aria-hidden="true"><path data-area d=""/><polyline data-line points=""/></svg>
      </div>
      <div class="mn__card mn__w2">
        <h5><span>Uptime</span><span>60 days</span></h5>
        <p class="mn__big" data-uptime>99.98<small>%</small></p>
        <div class="mn__bars" data-bars>${bars.map((c) => `<i class="${c}"></i>`).join('')}</div>
      </div>
      <div class="mn__card mn__w2">
        <h5><span>SSL certificate</span></h5>
        <p class="mn__big">64<small>days left</small></p>
        <p style="font-size:12px;color:var(--muted);margin-top:8px">Renews automatically</p>
      </div>
      <div class="mn__card mn__w2">
        <h5><span>Backups</span></h5>
        <div class="mn__list"><div><span>Today 03:00</span><span>412 MB ✓</span></div><div><span>Yesterday</span><span>411 MB ✓</span></div><div><span>Restore test</span><span>Passed</span></div></div>
      </div>
      <div class="mn__card mn__w2">
        <h5><span>Core Web Vitals</span><span class="tag tag--ok">Good</span></h5>
        <div class="mn__vitals"><div class="mn__vital"><b>1.6s</b><small>LCP</small></div><div class="mn__vital"><b>110ms</b><small>INP</small></div><div class="mn__vital"><b>0.02</b><small>CLS</small></div></div>
      </div>
      <div class="mn__card mn__w6">
        <h5><span>Activity</span><span>Live</span></h5>
        <div class="mn__feed" data-feed aria-live="polite">
          <p>03:00 · <b>Backup completed</b> and verified (412 MB)</p>
          <p>03:04 · <b>3 security updates</b> applied, site checked after each one</p>
          <p>09:15 · Uptime check passed from London, Frankfurt and Dublin</p>
        </div>
      </div>
    </div>
  </div>`;

  const root = stage.querySelector('[data-mn]');
  const line = stage.querySelector('[data-line]');
  const area = stage.querySelector('[data-area]');
  const now = stage.querySelector('[data-rt-now]');
  const feed = stage.querySelector('[data-feed]');
  const status = stage.querySelector('[data-status]');
  const btn = stage.querySelector('[data-incident]');
  const barsEl = stage.querySelector('[data-bars]');

  const N = 48;
  const pts = Array.from({ length: N }, () => 150 + Math.random() * 60);
  let down = false;
  const draw = () => {
    const max = 1200, min = 0;
    const xy = pts.map((v, i) => [(i / (N - 1)) * 300, 64 - ((Math.min(v, max) - min) / (max - min)) * 58 - 3]);
    // scale for normal times so the line is not flat
    const lo = Math.min(...pts), hi = Math.max(...pts, 320);
    const xy2 = pts.map((v, i) => [(i / (N - 1)) * 300, 60 - ((v - lo) / Math.max(1, hi - lo)) * 52]);
    const use = down ? xy : xy2;
    line.setAttribute('points', use.map((p) => p.join(',')).join(' '));
    area.setAttribute('d', `M0,64 L${use.map((p) => p.join(',')).join(' L')} L300,64 Z`);
    now.textContent = down ? 'timeout' : `${Math.round(pts[N - 1])} ms`;
  };
  const push = (v) => { pts.shift(); pts.push(v); draw(); };
  draw();
  const say = (html) => {
    const p = document.createElement('p');
    p.innerHTML = `${clock()} · ${html}`;
    feed.appendChild(p);
    while (feed.children.length > 6) feed.firstElementChild.remove();
  };

  let timer = 0;
  const loop = () => { push(down ? 1100 + Math.random() * 100 : 140 + Math.random() * 70 + (Math.random() < 0.08 ? 90 : 0)); };

  async function incident() {
    btn.disabled = true;
    down = true;
    root.classList.add('is-down');
    status.innerHTML = '<span class="tag tag--bad"><i class="dot"></i>Site unreachable</span>';
    say('<b>Alert:</b> 3 failed checks from London. On-call engineer paged');
    await sleep(1600);
    status.innerHTML = '<span class="tag tag--warn"><i class="dot"></i>Investigating</span>';
    say('<b>Cause found:</b> server ran out of memory after a plugin update');
    await sleep(1600);
    say('<b>Fix:</b> plugin rolled back, server restarted, cache warmed');
    await sleep(1200);
    down = false;
    root.classList.remove('is-down');
    status.innerHTML = '<span class="tag tag--ok"><i class="dot"></i>All systems normal</span>';
    const last = barsEl.lastElementChild; last.className = 'bad';
    stage.querySelector('[data-uptime]').innerHTML = '99.97<small>%</small>';
    say('<b>Resolved in 4 min.</b> Client emailed a plain-English incident note');
    btn.disabled = false;
    btn.textContent = 'Simulate again';
  }
  btn.addEventListener('click', incident);

  return {
    resume() { if (!timer) timer = setInterval(loop, 900); },
    pause() { clearInterval(timer); timer = 0; },
  };
}
