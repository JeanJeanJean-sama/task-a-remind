// 画面の動作確認（Playwright）：node test/smoke.cjs [出力先フォルダ]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const out = process.argv[2] || path.join(__dirname, 'screens');
fs.mkdirSync(out, { recursive: true });
const url = 'file://' + path.join(__dirname, '..', 'docs', 'index.html');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', (d) => d.accept());
  const shot = (n) => page.screenshot({ path: path.join(out, n + '.png'), fullPage: true });
  const ok = (cond, msg) => { if (!cond) throw new Error('確認失敗: ' + msg); console.log('  ✓', msg); };

  await page.goto(url);
  await page.waitForSelector('text=はじめに');
  ok(true, '初回は「はじめに」が出る');
  await shot('01_はじめに');

  // 子どもを登録
  await page.click('text=子どもを登録して始める');
  await page.fill('input[name=nickname]', 'テスト');
  await page.click('.sheet button[type=submit]');
  await page.waitForSelector('text=今夜できること');
  ok(await page.isVisible('.child-name >> text=テスト'), '子どもを登録できる');

  // サンプル追加
  await page.click('button[data-tab=settings]');
  await page.click('text=サンプル（架空のデータ）を追加する');
  await page.waitForSelector('text=今夜できること');
  ok(await page.isVisible('select.child-select'), '2人目（サンプル）が追加され、切り替えが出る');
  await shot('02_今日');

  // タスク完了 → 次の工程
  const before = await page.locator('.task').count();
  await page.locator('.task:has-text("主治医に意見書") >> text=明日の昼にやる').click();
  await page.waitForSelector('text=明日の昼にお知らせします');
  ok(await page.isVisible('text=の昼にやる'), '昼タスクを明日に予定できる');
  await page.locator('.task:has-text("保育園に来月") >> button:has-text("完了")').click();
  await page.waitForSelector('text=完了しました');
  ok((await page.locator('.task').count()) === before - 1, 'タスクを完了できる');

  // 手続きを始める
  await page.click('button[data-tab=process]');
  await page.click('text=＋ 手続きを始める');
  await page.selectOption('select[name=templateId]', 'ryouiku-renew');
  await page.fill('input[name=deadline]', '2027-01-15');
  await page.click('.sheet button[type=submit]');
  await page.waitForSelector('text=手続きを登録しました');
  ok(await page.isVisible('.proc-name >> text=療育手帳の更新'), '手続きの型から工程を作れる');
  await shot('03_手続き');
  const firstStep = page.locator('.step.now button:has-text("完了")').first();
  await firstStep.click();
  await page.waitForSelector('text=次は「判定（発達検査）の予約を電話でとる」');
  ok(true, '工程を完了すると次の工程を案内する');

  // 子どもの情報：履歴
  await page.click('button[data-tab=info]');
  await page.click('.kv:has-text("好きなこと")');
  await page.fill('textarea[name=value]', '音の出るおもちゃ、手遊び歌、水遊び');
  await page.click('.sheet button[type=submit]');
  await page.waitForSelector('text=保存しました');
  await page.locator('.card:has-text("性格・特性") >> .history-toggle').first().click();
  ok(await page.isVisible('.kv.past:has-text("手遊び歌")'), '内容を変えると前の内容が履歴に残る');
  await shot('04_子どもの情報');
  await page.click('button[data-tab=certificates]');
  ok(await page.isVisible('text=更新手続き中'), '受給者証の画面で手続き中が分かる');

  // 手順書
  await page.click('button[data-tab=care]');
  await page.click('text=経管栄養（注入）');
  await page.waitForSelector('text=判断の目安');
  await page.locator('.card:has-text("準備") >> button:has-text("↓")').first().click();
  ok(true, '手順を並べ替えできる');
  await shot('05_手順書');
  await page.click('text=印刷・PDF');
  await page.waitForSelector('.doc h1');
  ok((await page.textContent('.doc h1')).includes('手順書'), '手順書の印刷画面が出る');
  await shot('06_手順書_印刷');
  await page.click('text=‹ 戻る');

  // サポートブック（支援者向けは「家族のみ」を出さない）
  await page.click('button[data-tab=settings]');
  await page.click('text=サポートブック（支援者向け）');
  const book = await page.textContent('.doc');
  ok(!book.includes('症候群') && book.includes('好きなこと'), '支援者向けに「家族のみ」の情報が載らない');
  await shot('07_サポートブック');
  await page.click('text=‹ 戻る');
  await page.click('text=サポートブック（家族用・すべて）');
  ok((await page.textContent('.doc')).includes('症候群'), '家族用にはすべて載る');
  await page.click('text=‹ 戻る');

  // 書き出し → 消して → 読み込み
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('text=データを書き出す（バックアップ・移行用）')]);
  const file = path.join(out, 'export.json');
  await dl.saveAs(file);
  const exp = JSON.parse(fs.readFileSync(file, 'utf8'));
  ok(exp.format === 'tasuka-remind-export' && exp.collections.tasks.length > 5, 'データを書き出せる');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('text=はじめに');
  await page.setInputFiles('input[data-change=import]', file);
  await page.waitForSelector('text=件を読み込みました');
  ok(await page.isVisible('select.child-select'), '書き出したデータを読み込んで元に戻せる');

  // 再読み込みしても残る
  await page.reload();
  await page.waitForSelector('text=今夜できること');
  ok(true, '再読み込みしてもデータが残る');

  // PC幅・ダークモード
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.click('button[data-tab=today]');
  await shot('08_PC_ダーク');

  ok(errors.length === 0, 'JavaScriptのエラーなし' + (errors.length ? '：' + errors.join(' / ') : ''));
  await browser.close();
  console.log('画面の動作確認：すべて成功');
})().catch((e) => { console.error(e); process.exit(1); });
