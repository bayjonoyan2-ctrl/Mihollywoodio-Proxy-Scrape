const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

chromium.use(StealthPlugin());

// ======================= PROXIES FROM SECRET =======================
function buildProxyListFromEnv() {
  const raw = (process.env.SCRAPEPROXY_PROXIES || '').trim();
  if (!raw) {
    console.log('DIAG: SCRAPEPROXY_PROXIES secret is empty or missing');
    return [];
  }
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l && l.includes('@'));

  const valid = [];
  for (const line of lines) {
    try {
      const atIndex = line.lastIndexOf('@');
      if (atIndex < 0) continue;
      const creds = line.substring(0, atIndex);
      const hostPort = line.substring(atIndex + 1);
      const colonIndex = creds.indexOf(':');
      if (colonIndex < 0) continue;
      const username = creds.substring(0, colonIndex);
      const password = creds.substring(colonIndex + 1);
      const [host, port] = hostPort.split(':');
      if (!host || !port) continue;
      valid.push({ server: `http://${host}:${port}`, username, password, label: `${host}:${port}` });
    } catch (e) {
      console.log('DIAG: skipping malformed proxy line:', line.slice(0, 30) + '...');
    }
  }
  return valid;
}

const ALL_PROXIES = buildProxyListFromEnv();
console.log(`DIAG: total proxies loaded from secret = ${ALL_PROXIES.length}`);

console.log('DIAG: SITE_URL =', JSON.stringify(process.env.SITE_URL));
console.log('DIAG: node version =', process.version);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const REFERRERS = [
  'https://www.google.com/', 'https://www.google.co.in/', 'https://www.google.co.uk/', 'https://www.google.ca/',
  'https://www.youtube.com/', 'https://www.facebook.com/', 'https://www.instagram.com/', 'https://twitter.com/',
  'https://t.co/', 'https://www.bing.com/', 'https://search.yahoo.com/', 'https://duckduckgo.com/',
  'https://www.reddit.com/', 'https://www.pinterest.com/', 'https://www.linkedin.com/', 'https://www.quora.com/',
  'https://medium.com/', 'https://www.tumblr.com/', 'https://www.whatsapp.com/', 'https://www.blogger.com/'
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1'
];

const BROWSE_SITES = [
  'https://www.imdb.com/', 'https://www.rottentomatoes.com/', 'https://www.metacritic.com/',
  'https://www.boxofficemojo.com/', 'https://www.themoviedb.org/', 'https://letterboxd.com/',
  'https://www.allmovie.com/', 'https://www.tcm.com/', 'https://www.rogerebert.com/',
  'https://variety.com/', 'https://www.hollywoodreporter.com/', 'https://deadline.com/',
  'https://www.indiewire.com/', 'https://www.slashfilm.com/', 'https://collider.com/',
  'https://screenrant.com/', 'https://www.cinemablend.com/', 'https://www.empireonline.com/',
  'https://www.denofgeek.com/', 'https://www.ign.com/movies', 'https://www.bbc.com/news',
  'https://edition.cnn.com/', 'https://www.reuters.com/', 'https://apnews.com/',
  'https://www.theguardian.com/', 'https://www.nytimes.com/', 'https://www.washingtonpost.com/',
  'https://www.forbes.com/', 'https://www.bloomberg.com/', 'https://time.com/',
  'https://www.usatoday.com/', 'https://www.nbcnews.com/', 'https://abcnews.go.com/',
  'https://www.cbsnews.com/', 'https://www.foxnews.com/', 'https://www.huffpost.com/',
  'https://www.politico.com/'
];

// ============ DATA SAVER (frame-aware) ============
async function applyDataSaver(page) {
  await page.route('**/*', (route) => {
    let isInIframe = false;
    try {
      const frame = route.request().frame();
      isInIframe = !!(frame && frame.parentFrame());
    } catch (e) {}
    if (isInIframe) return route.continue();
    const type = route.request().resourceType();
    if (['media', 'font', 'manifest', 'texttrack'].includes(type)) return route.abort();
    return route.continue();
  });
}

async function fetchArticleUrlsFromFeed(siteUrl) {
  try {
    const feedUrl = siteUrl.replace(/\/+$/, '') + '/feeds/posts/default?alt=json&max-results=150';
    const res = await fetch(feedUrl, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) { console.log('DIAG: feed http status =', res.status); return []; }
    const json = await res.json();
    const entries = (json.feed && json.feed.entry) || [];
    const urls = entries.flatMap(e => e.link || [])
      .filter(l => l.rel === 'alternate' && l.type === 'text/html')
      .map(l => l.href)
      .filter(h => /\/\d{4}\/\d{2}\/.+\.html/.test(h));
    console.log('DIAG: feed entries =', entries.length, ', article urls =', urls.length);
    return [...new Set(urls)];
  } catch (e) { console.log('DIAG: feed fetch failed:', e.message); return []; }
}

async function readPage(page, label = 'reading', minSec = 20, maxSec = 35) {
  const total = rand(minSec * 1000, maxSec * 1000);
  console.log(`  [${label}] dwell = ${Math.round(total / 1000)}s`);
  const start = Date.now();
  while (Date.now() - start < total) {
    try { await page.mouse.wheel(0, rand(300, 800)); } catch (e) { break; }
    await sleep(rand(3000, 6000));
    console.log(`  [${label}] still reading... ${Math.max(0, Math.round((total - (Date.now() - start)) / 1000))}s left`);
  }
}

// ---- THE NEW AD CLICKER ----
// 1. Scrolls the page so lazy-loaded ad iframes render
// 2. Waits longer for ad scripts to inject the <a>
// 3. Searches ALL iframes for ANY link — not just src-matching ones
// 4. Falls back to clicking the iframe body itself if no <a> exists
async function tryClickOneAd(page, label = 'ad') {
  try { await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {}); } catch (e) {}

  // Scroll down and back up so lazy ad slots enter the viewport and load
  try {
    for (let s = 0; s < 6; s++) {
      await page.mouse.wheel(0, rand(400, 900));
      await sleep(rand(800, 1600));
    }
    await sleep(rand(2000, 3000));
    for (let s = 0; s < 5; s++) {
      await page.mouse.wheel(0, -rand(400, 900));
      await sleep(rand(600, 1200));
    }
  } catch (e) {}

  await sleep(rand(4000, 8000));

  const attrs = ['src', 'id', 'name', 'class', 'title'];
  const AD_SRC_MATCHERS = ['googleads', 'doubleclick', 'googlesyndication', 'ca-pub-', 'adservice', 'adsystem', 'adnxs', 'amazon-adsystem'];

  let iframes = [];
  try { iframes = await page.$$('iframe'); } catch (e) { return false; }
  console.log(`  [${label}] found ${iframes.length} iframes on page`);

  // Score each iframe: ad-URL iframes first, then anything with a link inside
  const candidates = [];

  for (const frameEl of iframes) {
    let srcAttr = '';
    try { srcAttr = (await frameEl.getAttribute('src')) || ''; } catch (e) {}
    let idAttr = '';
    try { idAttr = (await frameEl.getAttribute('id')) || ''; } catch (e) {}
    let nameAttr = '';
    try { nameAttr = (await frameEl.getAttribute('name')) || ''; } catch (e) {}

    let isAdLike = false;
    for (const m of AD_SRC_MATCHERS) {
      if (srcAttr.includes(m) || idAttr.includes(m) || nameAttr.includes(m)) { isAdLike = true; break; }
    }

    let frame;
    try { frame = await frameEl.contentFrame(); } catch (e) { continue; }
    if (!frame) continue;

    candidates.push({ frameEl, frame, isAdLike, srcAttr, idAttr });
  }

  // Sort: ad-like first, then by src presence
  candidates.sort((a, b) => (b.isAdLike ? 1 : 0) - (a.isAdLike ? 1 : 0));

  // Try every candidate — give each a decent wait for the <a> to appear
  for (const c of candidates) {
    // Extra scroll to bring this iframe into view (helps lazy ads)
    try {
      await c.frameEl.scrollIntoViewIfNeeded().catch(() => {});
      await sleep(rand(1000, 2000));
    } catch (e) {}

    // Wait up to ~15s for a clickable link inside this iframe
    let links = [];
    for (let attempt = 0; attempt < 6; attempt++) {
      try { links = await c.frame.$$('a[href]'); } catch (e) { links = []; }
      if (links.length) break;
      await sleep(rand(2000, 3000));
    }

    if (links.length) {
      const link = links[rand(0, links.length - 1)];
      try {
        const [popup] = await Promise.all([
          page.context().waitForEvent('page', { timeout: 8000 }).catch(() => null),
          link.click({ timeout: 5000 })
        ]);
        console.log(`  [${label}] clicked LINK inside iframe (${c.srcAttr.slice(0, 60) || c.idAttr})`);
        if (popup) {
          await applyDataSaver(popup).catch(() => {});
          await popup.waitForLoadState('domcontentloaded').catch(() => {});
          await readPage(popup, 'ad-page', 15, 20);
          try { await popup.close(); } catch (e) { }
        } else {
          await readPage(page, 'ad-page', 15, 20);
          try { await page.goBack({ waitUntil: 'domcontentloaded', timeout: 15000 }); } catch (e) { }
        }
        return true;
      } catch (e) {
        console.log(`  [${label}] link click failed:`, (e.message || '').split('\n')[0]);
      }
    } else {
      // No <a> found. As a last resort on ad-like iframes, try clicking inside
      // the iframe body directly — some ad creatives use JS click handlers.
      if (c.isAdLike) {
        try {
          const body = await c.frame.$('body').catch(() => null);
          if (body) {
            const box = await body.boundingBox().catch(() => null);
            if (box && box.width > 5 && box.height > 5) {
              // Click near the center of the iframe area on the top page
              const elBox = await c.frameEl.boundingBox().catch(() => null);
              if (elBox) {
                await page.mouse.click(
                  elBox.x + elBox.width / 2,
                  elBox.y + elBox.height / 2
                );
                console.log(`  [${label}] clicked ad iframe body directly (${c.srcAttr.slice(0, 60)})`);
                await sleep(rand(3000, 6000));
                const [popupAfter] = await Promise.all([
                  page.context().waitForEvent('page', { timeout: 4000 }).catch(() => null),
                  Promise.resolve()
                ]);
                if (popupAfter) {
                  await applyDataSaver(popupAfter).catch(() => {});
                  await popupAfter.waitForLoadState('domcontentloaded').catch(() => {});
                  await readPage(popupAfter, 'ad-page', 15, 20);
                  try { await popupAfter.close(); } catch (e) { }
                  return true;
                }
                // Even if no popup, count it — the click reached the ad
                return true;
              }
            }
          }
        } catch (e) {}
      }
    }
  }

  console.log(`  [${label}] no clickable ad found`);
  return false;
}
// --------------------------

async function visitExternalSite(page, label) {
  const site = BROWSE_SITES[rand(0, BROWSE_SITES.length - 1)];
  try {
    console.log(`[${label}] browsing external site:`, site);
    await page.goto(site, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await readPage(page, `${label}`, 20, 30);
    if (Math.random() < 0.5) {
      try {
        const links = await page.$$eval('a[href]', els =>
          [...new Set(els.map(a => a.href))].filter(h => h.startsWith('http') && !h.includes('javascript')));
        if (links.length) {
          const pick = links[rand(0, links.length - 1)];
          console.log(`[${label}] clicking article:`, pick);
          await page.goto(pick, { waitUntil: 'domcontentloaded', timeout: 60000 });
          await readPage(page, `${label}-article`, 15, 20);
        }
      } catch (e) {
        console.log(`[${label}] article click failed:`, e.message.split('\n')[0]);
        try { await page.goto('about:blank', { timeout: 5000 }).catch(() => {}); } catch (_) {}
        await sleep(500);
      }
    }
  } catch (e) {
    console.log(`[${label}] external site visit failed:`, e.message.split('\n')[0]);
    try { await page.goto('about:blank', { timeout: 5000 }).catch(() => {}); } catch (_) {}
    await sleep(500);
  }
}

function isHardProxyFailure(errMsg) {
  return ['ERR_PROXY_AUTH','ERR_TUNNEL_CONNECTION_FAILED','ERR_CONNECTION_REFUSED','ERR_NAME_NOT_RESOLVED','ERR_INVALID_AUTH_CREDENTIALS','ERR_SOCKS_CONNECTION_FAILED','407'].some(h => errMsg.includes(h));
}

async function tryProxy(browser, proxyObj, ua, referer, viewport) {
  try {
    const context = await browser.newContext({
      userAgent: ua, referer, viewport,
      bypassCSP: true, locale: 'en-US', timezoneId: 'America/New_York',
      proxy: { server: proxyObj.server, username: proxyObj.username, password: proxyObj.password }
    });
    const page = await context.newPage();
    await applyDataSaver(page);
    await page.goto('https://api.ipify.org?format=json', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const body = await page.textContent('body');
    console.log(`DIAG: proxy ${proxyObj.label} OK, exit IP =`, body.trim());
    return { context, page, label: proxyObj.label };
  } catch (e) {
    const msg = e.message.split('\n')[0];
    const hard = isHardProxyFailure(msg);
    console.log(`DIAG: proxy ${proxyObj.label} FAILED (${hard ? 'HARD/DEAD' : 'soft/timeout'}):`, msg);
    return { error: msg, hard };
  }
}

async function pickWorkingProxy(browser, ua, referer, viewport, targetUrl) {
  const shuffled = [...ALL_PROXIES].sort(() => Math.random() - 0.5);
  let tried = 0, lastError = '';
  for (const proxyObj of shuffled) {
    tried++;
    console.log(`DIAG: trying proxy ${proxyObj.label} (${tried}/${shuffled.length})`);
    const result = await tryProxy(browser, proxyObj, ua, referer, viewport);
    if (!result || result.error) { lastError = result && result.error ? result.error : 'proxy unreachable'; continue; }
    try {
      await result.page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      console.log('DIAG: home url =', result.page.url());
      if (result.page.url().includes('google.com/sorry')) {
        console.log('DIAG: CAPTCHA on this proxy, trying next');
        try { await result.context.close(); } catch (_) {}
        lastError = 'CAPTCHA'; continue;
      }
      return result;
    } catch (e) {
      const msg = e.message.split('\n')[0];
      console.log('DIAG: target unreachable with this proxy:', msg);
      lastError = msg;
      try { await result.page.goto('about:blank', { timeout: 5000 }).catch(() => {}); } catch (_) {}
      await sleep(500);
      try { await result.context.close(); } catch (_) {}
    }
  }
  console.log('\n======================================================================\n🚨🚨🚨  ALL SCRAPEPROXY PROXIES FAILED  🚨🚨🚨\n----------------------------------------------------------------------');
  console.log(`Tried all ${tried} proxies. Last error: ${lastError || 'unknown'}`);
  console.log('👉 ACTION: Update SCRAPEPROXY_PROXIES secret in repo settings.\n======================================================================\n');
  return null;
}

(async () => {
  if (!ALL_PROXIES.length) { console.log('🚨 NO PROXIES CONFIGURED — add SCRAPEPROXY_PROXIES secret.'); process.exit(1); }

  const randomReferer = REFERRERS[rand(0, REFERRERS.length - 1)];
  const randomUA = USER_AGENTS[rand(0, USER_AGENTS.length - 1)];
  console.log('Faking referer from:', randomReferer);
  console.log('Using UA:', randomUA);

  const viewport = { width: rand(1280, 1920), height: rand(720, 1080) };
  const articleUrls = await fetchArticleUrlsFromFeed(process.env.SITE_URL);
  if (!articleUrls.length) { console.log('No articles found, exiting'); process.exit(1); }

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-site-isolation-trials',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-dev-shm-usage', '--no-sandbox'
    ]
  });

  const result = await pickWorkingProxy(browser, randomUA, randomReferer, viewport, process.env.SITE_URL);
  if (!result) { await browser.close(); process.exit(1); }

  const { context, page } = result;

  const preSites = rand(2, 4);
  console.log(`--- STEP 1: ${preSites} external sites ---`);
  for (let i = 0; i < preSites; i++) {
    console.log(`--- pre-site ${i + 1}/${preSites} ---`);
    await visitExternalSite(page, `ext${i + 1}`);
  }

  console.log('--- STEP 2: target site ---');
  const targetAds = rand(2, 4);
  let adsClicked = 0;
  console.log(`DIAG: target ads to click this run = ${targetAds}`);

  async function tryReachAdQuota(label) {
    if (adsClicked >= targetAds) return;
    console.log(`--- ad attempt on ${label} (${adsClicked}/${targetAds} so far) ---`);
    const ok = await tryClickOneAd(page, label);
    if (ok) { adsClicked++; console.log(`DIAG: ad click counted (${adsClicked}/${targetAds})`); }
  }

  try {
    await page.goto(process.env.SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await readPage(page, 'target-home', 25, 40);
  } catch (e) {
    console.log('homepage goto failed:', e.message.split('\n')[0]);
    try { await page.goto('about:blank', { timeout: 5000 }).catch(() => {}); } catch (_) {}
    await sleep(500);
  }

  await tryReachAdQuota('home');

  const articlesToRead = rand(3, 6);
  console.log(`DIAG: articlesToRead = ${articlesToRead}`);
  const shuffledArticles = [...articleUrls].sort(() => Math.random() - 0.5);
  let captchaHit = false;

  for (let i = 0; i < Math.min(articlesToRead, shuffledArticles.length); i++) {
    if (captchaHit) break;
    const url = shuffledArticles[i];
    console.log(`--- article ${i + 1}/${articlesToRead} ---`);
    console.log('reading:', url);
    try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); }
    catch (e) {
      console.log('article goto failed:', e.message.split('\n')[0]);
      try { await page.goto('about:blank', { timeout: 5000 }).catch(() => {}); } catch (_) {}
      await sleep(500); captchaHit = true; break;
    }
    console.log('DIAG: article url after goto =', page.url());
    if (page.url().includes('google.com/sorry')) { console.log('CAPTCHA, stopping'); captchaHit = true; break; }
    await readPage(page, 'article', 20, 35);
    await tryReachAdQuota(`article-${i + 1}`);
    await sleep(rand(10000, 20000));
    try {
      await page.goto(process.env.SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await readPage(page, 'back-home', 20, 30);
      await tryReachAdQuota(`home-after-article-${i + 1}`);
    } catch (e) {
      console.log('back-home goto failed:', e.message.split('\n')[0]);
      try { await page.goto('about:blank', { timeout: 5000 }).catch(() => {}); } catch (_) {}
      await sleep(500);
    }
  }

  const postSites = rand(1, 3);
  console.log(`--- STEP 3: ${postSites} external sites ---`);
  for (let i = 0; i < postSites; i++) {
    console.log(`--- post-site ${i + 1}/${postSites} ---`);
    await visitExternalSite(page, `post${i + 1}`);
  }

  console.log(`DIAG: total ads clicked this run = ${adsClicked}/${targetAds}`);
  await context.close();
  await browser.close();
  console.log('session done');
})();
