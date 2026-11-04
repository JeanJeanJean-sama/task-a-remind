const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => {
    const db = {}; window.__db = db; let settings = { digestHour: '22', dayHour: '12', discordWebhookUrl: '' }; window.__calls = [];
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

  // AIで読み取ったデータの取り込み（3-4）：GAS版の画面でも、指示書のコピー → 貼り付け → 確認 → 取り込み（api_putMany）ができる
  await p.click('.notice button:has-text("閉じる")');
  await p.click('text=‹ 戻る');
  await p.click('button[data-tab=settings]');
  // GAS版の枠の中では navigator.clipboard が使えないことがあるので、古いやり方（execCommand）でコピーできることを確かめる
  await p.evaluate(() => {
    window.__copied = null;
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('blocked')) }, configurable: true });
    document.execCommand = (cmd) => { if (cmd === 'copy') { window.__copied = document.activeElement && document.activeElement.value; return true; } return false; };
  });
  await p.click('.card .ai-guide >> text=AIへの指示書をコピーする');
  await p.waitForSelector('text=AIへの指示書をコピーしました');
  const guide = fs.readFileSync(path.join(__dirname, '..', 'guide', 'AI読み取りの指示書.md'), 'utf8');
  assert.equal(await p.evaluate(() => window.__copied), guide, 'GAS版：枠の中でも指示書をコピーできる');
  await p.click('text=読み取ったデータを取り込む（AIで作ったデータ）');
  await p.fill('.sheet textarea[name=importText]', fs.readFileSync(path.join(__dirname, '..', 'sample', 'sample-import.json'), 'utf8'));
  await p.click('.sheet button:has-text("読み取る")');
  await p.waitForSelector('text=読み取ったデータの確認');
  const rows = p.locator('.sheet .imp-item');
  assert.equal(await rows.count(), 7, 'GAS版：確認の画面に7件並ぶ');
  for (let i = 0; i < 7; i++) {
    const box = rows.nth(i).locator('input[data-change=importCheck]');
    if (!(await box.isChecked())) await box.check();
  }
  const before = (await p.evaluate(() => window.__calls)).filter((c) => c === 'api_putMany').length;
  const oldIds = new Set(await p.evaluate(() => Object.values(window.__db).flat().map((r) => r.id)));
  await p.click('.sheet [data-act=importApply]');
  await p.waitForSelector('text=7件を取り込みました');
  const saved = await p.evaluate(() => window.__db);
  const calls2 = (await p.evaluate(() => window.__calls)).filter((c) => c === 'api_putMany').length;
  assert.ok(calls2 > before, 'GAS版：取り込みは api_putMany で保存する');
  const fromImport = (col) => (saved[col] || []).filter((r) => !oldIds.has(r.id) && r.sourceFile && r.sourceFile.includes('_架空.pdf'));
  for (const col of ['visits', 'contacts', 'milestones', 'diagnoses', 'certificates', 'profile']) {
    assert.equal(fromImport(col).length, 1, 'GAS版：' + col + ' を1件取り込み、元の書類の名前が入る');
  }
  const cert = fromImport('certificates')[0];
  assert.ok(!('number' in cert) || cert.number === '', 'GAS版：番号の項目は入らない');
  const procTasks = saved.tasks.filter((t) => t.processName === '特別児童扶養手当の所得状況届（2026年）');
  assert.ok(procTasks.length > 0 && procTasks.every((t) => t.certificateId === cert.id), 'GAS版：手続きの工程ができ、一緒に取り込んだ受給者証につながる');
  console.log('import OK');

  await p.reload(); await p.waitForSelector('.store-badge');
  const badge = await p.textContent('.store-badge');
  const calls = await p.evaluate(() => window.__calls);
  assert.equal(errs.length, 0, 'GAS版：JavaScriptのエラーなし：' + errs.join(' / '));
  console.log('badge', badge, 'calls', [...new Set(calls)].join(','), 'errors', errs.length ? errs : 'none');
  await b.close();
})();
