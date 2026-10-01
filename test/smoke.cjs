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
  ok(await page.isVisible('.site-foot a[href="privacy.html"]'), '画面の下にプライバシーポリシーへのリンクがある');
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

  // 使えるかもしれない制度（目安）：サンプルは横浜市・身体障害者手帳3級（架空）
  const ben = page.locator('.card:has-text("使えるかもしれない制度（目安）")');
  ok(await ben.isVisible(), '手続きの画面に「使えるかもしれない制度（目安）」が出る');
  ok(await ben.locator('summary:has-text("福祉特別乗車券")').isVisible(), '等級に合う制度が出る');
  ok(!(await ben.locator('summary:has-text("福祉タクシー利用券")').count()), '等級に合わない制度は出ない');
  ok(!(await ben.locator('summary:has-text("鉄道・バスなどの運賃の割引")').count()), '確認ずみの制度は候補に出ない');
  await ben.locator('summary:has-text("福祉特別乗車券")').click();
  ok(await ben.locator('text=出典：障害福祉のあんない2026 59頁').isVisible(), '出典のページが出る');
  await shot('03b_制度の目安');
  await ben.locator('details[open] >> text=手続きにする').click();
  ok(await page.isVisible('.sheet .hint:has-text("福祉特別乗車券")'), '制度から申請の流れを作る画面が開く');
  ok((await page.inputValue('.sheet select[name=templateId]')) === 'apply-benefit', '申請の手続きの型が選ばれている');
  await page.click('.sheet button[type=submit]');
  await page.waitForSelector('text=手続きを登録しました');
  ok(await page.isVisible('.proc-name >> text=福祉特別乗車券の申請'), '制度の申請を手続きにできる');
  ok(!(await ben.locator('summary:has-text("福祉特別乗車券")').count()), '手続きにした制度は候補から外れる');
  await ben.locator('summary:has-text("所得税・住民税の障害者控除")').click();
  await ben.locator('details[open] >> button:has-text("使っている")').click();
  ok((await page.inputValue('.sheet select[name=status]')) === '利用している', '「使っている」を記録する画面が開く');
  await page.click('.sheet button[type=submit]');
  await page.waitForSelector('text=保存しました');
  await ben.locator('button:has-text("表示する")').click();
  ok(await ben.locator('.item:has-text("所得税・住民税の障害者控除")').isVisible() && await ben.locator('.item:has-text("福祉特別乗車券")').isVisible(), '確認ずみの一覧に入る');

  // 子どもの情報：履歴
  await page.click('button[data-tab=info]');
  ok(await page.isVisible('text=本人の情報'), '本人の基本情報（氏名・生年月日・年齢）が出る');
  await page.click('.kv:has-text("好きな音・音楽")');
  await page.fill('textarea[name=value]', '太鼓の音、ピアノ');
  await page.click('.sheet button[type=submit]');
  await page.waitForSelector('text=保存しました');
  await page.locator('.card:has-text("好きなこと・遊び") >> .history-toggle').first().click();
  ok(await page.isVisible('.kv.past:has-text("手遊び歌")'), '内容を変えると前の内容が履歴に残る');
  ok(await page.isVisible('.caution:has-text("首が弱い")'), '注意することが表示される');
  // 項目名の候補
  await page.click('text=＋ 項目を追加');
  await page.selectOption('.sheet select[name=category]', '食事');
  const sugg = await page.$$eval('#sugg-label option', (o) => o.map((x) => x.value));
  ok(sugg.includes('ミルクの種類'), '分類に合わせて項目名の候補が出る');
  ok((await page.inputValue('.sheet select[name=visibility]')) === 'supporter', '分類に合わせて見せる範囲の初期値が入る');
  await page.selectOption('.sheet select[name=category]', '出生時の様子');
  ok((await page.inputValue('.sheet select[name=visibility]')) === 'family', '出生時の様子は「家族のみ」が初期値');
  await page.click('.sheet button:has-text("やめる")');
  await shot('04_子どもの情報');

  await page.click('button[data-tab=family]');
  ok(await page.isVisible('text=緊急連絡 1'), '家族・緊急連絡先が順番つきで出る');
  await page.click('button[data-tab=schedule]');
  ok(await page.isVisible('.rhythm-time:has-text("06:00")'), '生活リズムが時刻順に出る');
  await page.click('text=＋ 予定を追加');
  await page.fill('.sheet input[name=time]', '05:30');
  await page.fill('.sheet input[name=activity]', 'テストの予定');
  await page.click('.sheet button[type=submit]');
  await page.waitForSelector('text=テストの予定');
  ok((await page.locator('.rhythm-time').first().textContent()) === '05:30', '時刻を入れると並び順に入る');
  await page.click('button[data-tab=medical]');
  ok(await page.isVisible('text=診断名') && await page.isVisible('.tl-date'), '診断名と医療機関の記録が出る');
  await page.locator('.tl-more').first().click();
  ok(await page.isVisible('.tl-detail'), '記録の詳しい内容（症状・治療・結果）を開ける');
  await shot('05_診断・医療歴');
  await page.click('button[data-tab=growth]');
  await page.click('button.chip:has-text("ハイハイ")');
  await page.fill('.sheet input[name=ageText]', '1歳8ヶ月');
  await page.click('.sheet button[type=submit]');
  await page.waitForSelector('.kv:has-text("ハイハイ")');
  ok(true, '成長の記録を候補から追加できる');
  await page.click('button[data-tab=contacts]');
  ok((await page.locator('.card:has-text("○○こども病院") .dept').count()) === 2, '同じ病院の診療科がまとめて出る');
  await page.click('button[data-tab=certificates]');
  ok(await page.isVisible('text=手続き中') && await page.isVisible('text=未取得・取得予定'), '受給者証の状態（手続き中・未取得）が分かる');
  await page.click('text=＋ 保険証・受給者証・手帳を追加');
  await page.selectOption('.sheet select[name=kind]', '健康保険証');
  ok(!(await page.isVisible('.sheet select[name=gradeCode]')), '保険証のときは手帳の等級の欄を出さない');
  await page.selectOption('.sheet select[name=kind]', '身体障害者手帳');
  ok(await page.isVisible('.sheet select[name=gradeCode]') && await page.isVisible('.sheet select[name=disabilityType]'), '身体障害者手帳のときは等級と障害の種類を選べる');
  await page.selectOption('.sheet select[name=kind]', '療育手帳');
  ok(await page.isVisible('.sheet select[name=gradeCode]') && !(await page.isVisible('.sheet select[name=disabilityType]')), '療育手帳のときは障害の種類の欄を出さない');
  await shot('05b_手帳の入力');
  await page.click('.sheet button:has-text("やめる")');

  // 手順書
  await page.click('button[data-tab=care]');
  await page.click('text=経管栄養（注入）');
  await page.waitForSelector('text=判断の目安');
  await page.locator('.card:has-text("準備") >> button:has-text("↓")').first().click();
  ok(true, '手順を並べ替えできる');
  await shot('06_手順書');
  await page.click('text=印刷・PDF');
  await page.waitForSelector('.doc h1');
  ok((await page.textContent('.doc h1')).includes('手順書'), '手順書の印刷画面が出る');
  await shot('07_手順書_印刷');
  await page.click('text=‹ 戻る');

  // サポートブック（支援者向けは「家族のみ」を出さない）
  await page.click('button[data-tab=settings]');
  await page.click('text=サポートブック（支援者向け）');
  const book = await page.textContent('.doc');
  ok(!book.includes('2,100g') && !book.includes('医療歴（詳細）') && !book.includes('保険証・医療証') && book.includes('好きな遊び'), '支援者向けに「家族のみ」の情報・番号・詳しい医療歴が載らない');
  ok(book.includes('症状について') && book.includes('緊急連絡先') && book.includes('生活リズム'), '支援者向けにも症状の説明・緊急連絡先・生活リズムは載る');
  await shot('08_サポートブック');
  await page.click('text=‹ 戻る');
  await page.click('text=サポートブック（家族用・すべて）');
  const full = await page.textContent('.doc');
  for (const ch of ['プロフィール', 'について', '睡眠・食事', '医療的ケア・服薬', '医療歴', '症状について', '医療歴（詳細）', '成育歴', '保険証・医療証など', '医療機関・関係機関']) ok(full.includes(ch), '家族用に章「' + ch + '」がある');
  ok(full.includes('2,100g') && full.includes('ハイハイ'), '家族用にはすべて載る');
  await shot('09_サポートブック_家族用');
  await page.click('text=‹ 戻る');

  // 書き出し → 消して → 読み込み
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('text=データを書き出す（バックアップ・移行用）')]);
  const file = path.join(out, 'export.json');
  await dl.saveAs(file);
  const exp = JSON.parse(fs.readFileSync(file, 'utf8'));
  ok(exp.format === 'task-a-remind-export' && exp.collections.tasks.length > 5, 'データを書き出せる');
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
  await shot('10_PC_ダーク');

  ok(errors.length === 0, 'JavaScriptのエラーなし' + (errors.length ? '：' + errors.join(' / ') : ''));
  // プライバシーポリシーのページが開ける
  const pp = await browser.newPage({ viewport: { width: 390, height: 844 } });
  pp.on('pageerror', (e) => errors.push(e.message));
  await pp.goto('file://' + path.join(__dirname, '..', 'docs', 'privacy.html'));
  ok((await pp.title()).startsWith('プライバシーポリシー'), 'プライバシーポリシーのページが開ける');
  ok(await pp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'スマホの幅で横にはみ出さない');
  await pp.screenshot({ path: path.join(out, '11_プライバシーポリシー.png'), fullPage: true });
  await pp.close();

  await browser.close();
  console.log('画面の動作確認：すべて成功');
})().catch((e) => { console.error(e); process.exit(1); });
