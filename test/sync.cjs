// Googleドライブ同期のテスト：node test/sync.cjs
// 本物のGoogleにはつながず、偽のログイン画面と偽のドライブを使って、
// 「パソコン」と「スマホ」（別々のブラウザ）の間でデータが行き来するかを確かめる。
const { chromium } = require('playwright');
const path = require('path');

const url = 'file://' + path.join(__dirname, '..', 'docs', 'index.html');

// ---- 偽のGoogleドライブ（appDataFolder） ----
const drive = { files: {}, seq: 0, requests: [] };
const GIS_MOCK = `
window.google = window.google || {};
google.accounts = { oauth2: {
  initTokenClient: function (cfg) {
    window.__gisScope = cfg.scope;
    return { callback: cfg.callback, requestAccessToken: function (o) {
      window.__gisPrompts = (window.__gisPrompts || []).concat([o && o.prompt]);
      var self = this; setTimeout(function () { self.callback({ access_token: 'token-' + Math.random(), expires_in: 3600 }); }, 20);
    } };
  },
  revoke: function (t, cb) { window.__revoked = true; cb && cb(); }
} };`;

async function mockGoogle(context) {
  await context.addInitScript(() => { window.__CONFIG_OVERRIDE__ = { googleClientId: 'test-client.apps.googleusercontent.com' }; });
  await context.route('https://accounts.google.com/gsi/client', (r) => r.fulfill({ contentType: 'text/javascript', body: GIS_MOCK }));
  await context.route('https://www.googleapis.com/**', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    const auth = req.headers()['authorization'] || '';
    drive.requests.push(req.method() + ' ' + u.pathname);
    if (drive.offline) return route.abort('internetdisconnected');
    if (!auth.startsWith('Bearer token-')) return route.fulfill({ status: 401, body: '' });
    if (u.pathname === '/oauth2/v3/userinfo') return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ email: 'family@example.com' }) });
    if (u.pathname === '/drive/v3/files' && req.method() === 'GET') {
      if (u.searchParams.get('spaces') !== 'appDataFolder') return route.fulfill({ status: 400, body: 'appDataFolder以外は見ない' });
      const files = Object.entries(drive.files).map(([id, f]) => ({ id, modifiedTime: f.t }));
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ files }) });
    }
    let m;
    if ((m = u.pathname.match(/^\/drive\/v3\/files\/(.+)$/))) {
      const f = drive.files[m[1]];
      if (req.method() === 'DELETE') { delete drive.files[m[1]]; return route.fulfill({ status: 204, body: '' }); }
      if (!f) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ contentType: 'application/json', body: f.body });
    }
    if (u.pathname === '/upload/drive/v3/files' && req.method() === 'POST') {
      const body = req.postData();
      const parts = body.split(/--tasuka\d+/);
      const metaJson = JSON.parse(parts[1].split('\r\n\r\n')[1]);
      if (JSON.stringify(metaJson.parents) !== '["appDataFolder"]') return route.fulfill({ status: 400, body: '' });
      const content = parts[2].split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/, '');
      const id = 'file' + (++drive.seq);
      drive.files[id] = { body: content, t: new Date().toISOString() };
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id }) });
    }
    if ((m = u.pathname.match(/^\/upload\/drive\/v3\/files\/(.+)$/)) && req.method() === 'PATCH') {
      if (!drive.files[m[1]]) return route.fulfill({ status: 404, body: '' });
      drive.files[m[1]] = { body: req.postData(), t: new Date().toISOString() };
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: m[1] }) });
    }
    return route.fulfill({ status: 400, body: 'unexpected ' + req.method() + ' ' + u.pathname });
  });
}
const driveData = () => { const f = Object.values(drive.files)[0]; return f ? JSON.parse(f.body) : null; };

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const ok = (cond, msg) => { if (!cond) throw new Error('確認失敗: ' + msg); console.log('  ✓', msg); };
  const device = async (name, viewport) => {
    const ctx = await browser.newContext({ viewport });
    await mockGoogle(ctx);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(name + ': ' + e.message));
    page.on('dialog', (d) => d.accept());
    await page.goto(url);
    return { ctx, page };
  };
  const waitSynced = (page) => page.waitForFunction(() => {
    const s = window.TasukaApp.state.sync; return s && s.state() === 'idle' && s.lastSyncAt();
  }, null, { timeout: 10000 });

  // ---- パソコン：サンプルを入れて同期を始める ----
  const pc = await device('PC', { width: 1100, height: 800 });
  await pc.page.waitForSelector('text=はじめに');
  await pc.page.click('text=サンプル（架空のデータ）で試す');
  await pc.page.waitForSelector('text=今夜できること');
  await pc.page.click('button[data-tab=settings]');
  ok(await pc.page.isVisible('text=Googleでログインして同期を始める'), '設定に「Googleでログインして同期を始める」が出る');
  await pc.page.click('text=Googleでログインして同期を始める');
  await waitSynced(pc.page);
  ok(await pc.page.evaluate(() => window.__gisScope) === 'https://www.googleapis.com/auth/drive.appdata email', '求める権限はアプリ専用フォルダとメールアドレスだけ');
  ok(await pc.page.isVisible('text=family@example.com'), '同期しているGoogleアカウントが表示される');
  ok(await pc.page.isVisible('.store-badge:has-text("同期済み")'), 'ヘッダーに「同期済み」が出る');
  const d1 = driveData();
  ok(d1 && d1.format === 'tasuka-remind-export' && d1.collections.children.length === 1, 'ドライブ（アプリ専用フォルダ）にデータが保存される');

  // ---- スマホ：まっさらな端末で同期を始めると、パソコンのデータが届く ----
  const phone = await device('スマホ', { width: 390, height: 844 });
  await phone.page.waitForSelector('text=はじめに');
  await phone.page.click('button[data-tab=settings]');
  await phone.page.click('text=Googleでログインして同期を始める');
  await waitSynced(phone.page);
  await phone.page.click('button[data-tab=today]');
  ok(await phone.page.isVisible('text=保育園に来月の注入時間の変更を伝える'), 'スマホで同期すると、パソコンのデータが届く');

  // ---- スマホで完了 → パソコンに届く ----
  await phone.page.locator('.task:has-text("保育園に来月") >> button:has-text("完了")').click();
  await phone.page.waitForSelector('text=完了しました');
  await waitSynced(phone.page);
  await phone.page.waitForTimeout(1800); // 自動同期（1.5秒待ってまとめて送る）
  await waitSynced(phone.page);
  const d2 = driveData();
  ok(d2.collections.tasks.find((t) => t.title.startsWith('保育園に来月')).status === 'done', 'スマホで完了にすると、自動でドライブに送られる');
  // パソコンで画面を開き直す（アプリに戻ってきた状態）
  await pc.page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await waitSynced(pc.page);
  await pc.page.click('button[data-tab=today]');
  await pc.page.waitForTimeout(200);
  ok(!(await pc.page.isVisible('text=保育園に来月の注入時間の変更を伝える')), 'パソコンに戻ると、スマホで完了にした結果が届く');

  // ---- パソコンで追加・削除 → スマホに届く ----
  await pc.page.click('button[data-tab=info]');
  await pc.page.click('button[data-tab=schedule]');
  await pc.page.click('text=＋ 予定を追加');
  await pc.page.fill('.sheet input[name=time]', '20:30');
  await pc.page.fill('.sheet input[name=activity]', 'パソコンで足した予定');
  await pc.page.click('.sheet button[type=submit]');
  await pc.page.click('.rhythm-row:has-text("お風呂")');
  await pc.page.click('.sheet button:has-text("削除")');
  await pc.page.waitForTimeout(1800);
  await waitSynced(pc.page);
  await phone.page.reload();
  await waitSynced(phone.page).catch(() => {});
  // 再読み込み後もタブの中ではログインが続いている
  await phone.page.click('button[data-tab=info]');
  await phone.page.click('button[data-tab=schedule]');
  ok(await phone.page.isVisible('text=パソコンで足した予定'), 'パソコンで足した記録がスマホに届く');
  ok(!(await phone.page.isVisible('.rhythm-row:has-text("お風呂")')), 'パソコンで消した記録はスマホでも消える');

  // ---- ログインが切れたとき ----
  await phone.page.evaluate(() => { sessionStorage.removeItem('tasuka-remind/v1/sync-token'); });
  await phone.page.reload();
  await phone.page.waitForSelector('.sync-banner');
  ok(await phone.page.isVisible('text=Googleにもう一度ログインしてください'), 'ログインが切れると、案内と「同期する」ボタンが出る');
  await phone.page.click('button[data-tab=info]');
  await phone.page.click('button[data-tab=schedule]');
  ok(await phone.page.isVisible('text=パソコンで足した予定'), 'ログインが切れても、端末のデータで使い続けられる');
  await phone.page.click('.sync-banner button:has-text("同期する")');
  await waitSynced(phone.page);
  ok(!(await phone.page.isVisible('.sync-banner')), 'もう一度ログインすると同期が再開する');
  ok((await phone.page.evaluate(() => window.__gisPrompts)).slice(-1)[0] === '', '2回目以降は同意画面を出さずにログインする');

  // ---- オフラインでも使える ----
  await phone.ctx.setOffline(true);
  drive.offline = true;
  await phone.page.click('button[data-tab=info]');
  await phone.page.click('button[data-tab=schedule]');
  await phone.page.click('text=＋ 予定を追加');
  await phone.page.fill('.sheet input[name=time]', '05:00');
  await phone.page.fill('.sheet input[name=activity]', '電波がないときの予定');
  await phone.page.click('.sheet button[type=submit]');
  await phone.page.waitForSelector('text=電波がないときの予定');
  await phone.page.waitForTimeout(1800);
  ok(await phone.page.isVisible('.store-badge.sync-error') || await phone.page.isVisible('.sync-banner-error'), '電波がないときは端末に保存し、同期できなかったことを表示する');
  ok(await phone.page.isVisible('text=ネットにつながっていないため同期できませんでした'), 'わかりやすい言葉で理由を表示する');
  drive.offline = false;
  await phone.ctx.setOffline(false);
  await phone.page.evaluate(() => window.dispatchEvent(new Event('online')));
  await waitSynced(phone.page);
  ok(!(await phone.page.isVisible('.sync-banner-error')), '電波が戻ると自動で同期し直す');
  ok(driveData().collections.schedule.some((r) => r.activity === '電波がないときの予定'), '電波が戻ってから同期すると、ドライブに送られる');

  // ---- 同期をやめる・ドライブのデータを消す ----
  await pc.page.click('button[data-tab=settings]');
  await pc.page.click('text=同期をやめて、ドライブのデータも消す');
  await pc.page.waitForSelector('text=Googleでログインして同期を始める');
  ok(Object.keys(drive.files).length === 0, '「ドライブのデータも消す」でドライブのファイルが消える');
  ok(await pc.page.evaluate(() => window.__revoked === true), '同期をやめるとログインの許可も取り消す');
  await pc.page.click('button[data-tab=today]');
  ok(await pc.page.isVisible('text=今夜できること'), '同期をやめても、この端末のデータは残る');

  ok(errors.length === 0, 'JavaScriptのエラーなし' + (errors.length ? '：' + errors.join(' / ') : ''));
  await browser.close();
  console.log('Googleドライブ同期のテスト：すべて成功');
})().catch((e) => { console.error(e); process.exit(1); });
