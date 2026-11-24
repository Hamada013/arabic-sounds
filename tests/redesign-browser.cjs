'use strict';
// The 2026-11 move and redesign, in Chromium and WebKit: the clinic start screen, the new home (today's two sounds,
// the road, «ابدأ»), therapist-only Ling and reports, the card-glow reward in matching, and the road bar during the
// route. Firebase is blocked, so nothing here talks to the clinic database.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { chromium, webkit } = require(process.env.SOUNDS_PLAYWRIGHT || 'playwright');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.m4a': 'audio/mp4' };
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return res.writeHead(404).end();
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
const CHILD = { schema: 1, active: 'qa', children: [{ id: 'qa', name: 'تجربة', created: '2026-11-25T08:00:00Z', apps: { arabicsounds: true } }] };

async function page(browser, base, { entry = true, child = true, therapist = false, size = { width: 820, height: 1180 } } = {}) {
  const ctx = await browser.newContext({ viewport: size, serviceWorkers: 'block' });
  await ctx.route(/gstatic\.com\/firebasejs/, route => route.abort());
  await ctx.addInitScript(({ entry, child, therapist, CHILD }) => {
    if (sessionStorage.getItem('qa-seeded')) return; sessionStorage.setItem('qa-seeded', '1');
    if (entry) localStorage.setItem('speech-entry-v1', JSON.stringify({ mode: 'therapist' }));
    if (child) localStorage.setItem('arabicsounds-children-v1', JSON.stringify(CHILD));
    if (therapist) localStorage.setItem('arabicsounds-therapist', 'on');
    const AC = window.AudioContext; window.qaNotes = 0;
    if (AC) window.AudioContext = class extends AC { createOscillator() { window.qaNotes++; return super.createOscillator(); } };
  }, { entry, child, therapist, CHILD });
  const p = await ctx.newPage(), errors = [];
  p.on('pageerror', error => errors.push(error.message));
  await p.goto(base); await p.waitForTimeout(700);
  return { p, ctx, errors };
}

async function run(browser, name, base) {
  // 1. A new device opens on the clinic start screen; 013 opens the app.
  { const { p, ctx, errors } = await page(browser, base, { entry: false, child: false });
    await p.locator('.speech-entry').waitFor();
    assert.equal(await p.locator('.speech-entry-logo').getAttribute('src').then(src => /logo/.test(src)), true, 'Start screen shows the app logo');
    await p.locator('.speech-entry [data-therapist]').click(); await p.getByPlaceholder('رمز المعالج').fill('013');
    await p.locator('.speech-entry').waitFor({ state: 'detached' }).catch(() => p.locator('.speech-entry').waitFor({ state: 'hidden' }));
    assert.deepEqual(errors, []); await ctx.close(); }

  // 2. Home with the lock closed: two sound cards, five road stops, «ابدأ»; no Ling, no report button.
  { const { p, ctx, errors } = await page(browser, base);
    assert.equal(await p.locator('.as-pair-card').count(), 2);
    assert.deepEqual(await p.locator('.as-road b').allInnerTexts(), ['نسمع', 'نختار', 'نطابق', 'نتذكّر', 'أحسنت']);
    assert.equal(await p.locator('.as-road li.next').count(), 1, 'The first stop waits');
    assert.equal((await p.locator('.as-start').innerText()).trim(), 'ابدأ');
    assert.equal(await p.locator('#ling').count(), 0, 'Ling is therapist-only');
    assert.equal(await p.locator('[data-suite-control="report"]').isVisible(), false, 'Reports are therapist-only');
    assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('.as-hero h1')).fontFamily.startsWith('Cairo')), true);
    assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('.as-hero h1')).letterSpacing), 'normal');
    // Opening the lock brings Ling and the report back without reloading.
    await p.evaluate(() => { localStorage.setItem('arabicsounds-therapist', 'on'); dispatchEvent(new CustomEvent('voc-therapist-change', { detail: { active: true } })); });
    await p.locator('#ling').waitFor(); assert.equal(await p.locator('[data-suite-control="report"]').isVisible(), true);
    assert.deepEqual(errors, []); await ctx.close(); }

  // 3. Phone width: nothing scrolls sideways and every home control is a big touch target.
  { const { p, ctx } = await page(browser, base, { size: { width: 360, height: 740 } });
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No sideways scroll');
    const small = await p.locator('.as-start, .as-pair-card, .as-more > *, .as-change').evaluateAll(nodes => nodes.filter(n => { const r = n.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).length);
    assert.equal(small, 0, 'Touch targets are at least 44px');
    await ctx.close(); }

  // 4. Matching: the right card glows with a chime, three in a row add the dot burst, a wrong card gets a soft ring.
  { const { p, ctx, errors } = await page(browser, base + '#/arabic/matching');
    for (let i = 0; i < 3; i++) {
      const target = await p.locator('.target-card').getAttribute('data-sound');
      await p.locator(`.match-options [data-sound="${target}"]`).click();
      await p.locator('.match-options .reward-right').waitFor();
      if (i === 2) assert.equal(await p.locator('.reward-burst').count(), 1, 'Burst after three in a row');
      await p.locator('.match-options .reward-right').waitFor({ state: 'detached' });
    }
    const target = await p.locator('.target-card').getAttribute('data-sound');
    await p.locator(`.match-options [data-sound]:not([data-sound="${target}"])`).first().click();
    await p.locator('.match-options .reward-retry').waitFor();
    assert.equal(await p.locator('#announcement').innerText(), 'حاول مرة ثانية');
    assert.equal(await p.locator('#match-feedback, .ling-feedback').count(), 0, 'No full-screen mark');
    await p.locator('.match-options .reward-retry').waitFor({ state: 'detached' });
    assert.equal(await p.locator('.matching-layout button:disabled').count(), 0, 'The child can try again at once');
    assert.equal(await p.evaluate(() => window.qaNotes), 7, 'Two notes per right answer, one for try again');
    await p.emulateMedia({ reducedMotion: 'reduce' });
    const next = await p.locator('.target-card').getAttribute('data-sound');
    await p.locator(`.match-options [data-sound]:not([data-sound="${next}"])`).first().click();
    await p.locator('.match-options .reward-retry').waitFor();
    assert.equal(await p.locator('.match-options .reward-retry').evaluate(node => node.getAnimations().length), 0, 'Reduced motion: colour only');
    assert.deepEqual(errors, []); await ctx.close(); }

  // 5. «ابدأ» starts the route with the road bar on top; leaving ends it and the home road is unchanged.
  { const { p, ctx, errors } = await page(browser, base);
    await p.locator('.as-start').click(); await p.locator('#road-bar').waitFor();
    assert.deepEqual(await p.locator('#road-bar li').evaluateAll(items => items.map(item => item.className)), ['now', '', '', '', '']);
    assert.equal(await p.locator('#road-bar li[aria-current="step"] b').innerText(), 'نسمع');
    await p.evaluate(() => { location.hash = '/home'; }); await p.waitForTimeout(400);
    assert.equal(await p.locator('#road-bar').count(), 0);
    assert.equal(await p.locator('.as-road li.done').count(), 0, 'A step lights up only when finished');
    assert.deepEqual(errors, []); await ctx.close(); }
  console.log(`PASS ${name}: start screen and 013, new home, therapist-only Ling and reports, phone fit and touch targets, card-glow reward with chime and burst, reduced motion, road bar.`);
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/index.html`;
  try {
    for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
      if (process.env.SOUNDS_ENGINE && process.env.SOUNDS_ENGINE !== name) continue;
      const browser = await engine.launch(); try { await run(browser, name, base); } finally { await browser.close(); }
    }
  } finally { server.close(); server.closeAllConnections?.(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
