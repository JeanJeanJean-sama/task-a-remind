const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => {
    const db = {}; let settings = { digestHour: '22', dayHour: '12', discordWebhookUrl: '' }; window.__calls = [];
    const api = {
      api_loadAll: () => JSON.parse(JSON.stringify(db)),
      api_putMany: (items) => { items.forEach(({ col, rec }) => { db[col] = db[col] || []; const i = db[col].findIndex(r => r.id === rec.id); if (i >= 0) db[col][i] = rec; else db[col].push(rec); }); return true; },
      api_getSettings: () => settings, api_saveSettings: (s) => (settings = { ...settings, ...s }),
      api_testDiscord: () => true, api_savePdf: (h, n) => ({ url: 'https://drive/x', name: n + '.pdf' }), api_saveFile: (n) => ({ url: 'https://drive/y', name: n })
    };
    const mk = () => { let ok, ng; const r = new Proxy({}, { get: (_, k) => k === 'withSuccessHandler' ? (f) => (ok = f, r) : k === 'withFailureHandler' ? (f) => (ng = f, r) : (...a) => { window.__calls.push(k); setTimeout(() => { try { ok(JSON.parse(JSON.stringify(api[k](...JSON.parse(JSON.stringify(a)))))); } catch (e) { ng(e); } }, 10); } }); return r; };
    window.google = { script: { get run() { return mk(); } } };
  });
  await p.goto('file://' + process.cwd() + '/gas/Index.html');
  await p.waitForSelector('text=はじめに');
  await p.click('text=サンプル（架空のデータ）で試す');
  await p.waitForSelector('text=今夜できること');
  await p.click('button[data-tab=settings]');
  await p.fill('input[name=discordWebhookUrl]', 'https://discord.com/api/webhooks/1/x');
  await p.click('form[data-form=settings] button[type=submit]');
  await p.waitForSelector('text=設定を保存しました');
  await p.click('text=サポートブック（支援者向け）');
  await p.click('text=PDFをドライブに保存');
  await p.waitForSelector('text=PDFを保存しました'); console.log('notice OK');
  await p.reload(); await p.waitForSelector('.store-badge');
  const badge = await p.textContent('.store-badge');
  const calls = await p.evaluate(() => window.__calls);
  console.log('badge', badge, 'calls', [...new Set(calls)].join(','), 'errors', errs.length ? errs : 'none');
  await b.close();
})();
