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
  const groupLabels = await page.$$eval('.sheet select[name=templateId] optgroup', (o) => o.map((x) => x.label));
  ok(groupLabels[0] === '更新・申請' && groupLabels.includes('毎年の届出') && groupLabels[groupLabels.length - 1] === 'その他', '手続きの型が組ごとに分かれている');
  await page.selectOption('select[name=templateId]', 'tokuji-shotoku');
  await page.waitForSelector('.sheet .tpl-source summary:has-text("に確認")');
  ok(true, '型を選ぶと出典と確かめた日が出る');
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

  // 毎年くり返す型：最後の工程を終えると「来年の分も始めますか」と聞く
  const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const due = new Date(); due.setDate(due.getDate() + 60);
  const dueNext = new Date(due); dueNext.setFullYear(due.getFullYear() + 1);
  await page.click('text=＋ 手続きを始める');
  await page.selectOption('select[name=templateId]', 'tokuji-shotoku');
  await page.fill('input[name=deadline]', ymd(due));
  await page.fill('input[name=name]', 'テストの所得状況届（2026年）');
  await page.click('.sheet button[type=submit]');
  await page.waitForSelector('text=手続きを登録しました');
  const yearly = page.locator('.proc:has(.proc-name:text-is("テストの所得状況届（2026年）"))');
  for (let i = 1; i <= 4; i++) {
    await yearly.locator('.step.now button:has-text("完了")').click();
    if (i < 4) await yearly.locator('.step.done').nth(i - 1).waitFor();
  }
  await page.waitForSelector('.sheet h2:has-text("来年の分も始めますか")');
  ok((await page.inputValue('.sheet select[name=templateId]')) === 'tokuji-shotoku', '最後の工程を終えると「来年の分も始めますか」と聞く');
  ok((await page.inputValue('.sheet input[name=deadline]')) === ymd(dueNext), '期限が1年先になっている');
  ok((await page.inputValue('.sheet input[name=name]')) === 'テストの所得状況届（2027年）', '名前の年も1年先になる');
  ok(!(await page.isVisible('.sheet[aria-label="保険証・受給者証・手帳を編集"]')), '毎年の届出では、有効期限の見直しの画面は出さない');
  await shot('03a_来年の分');
  await page.click('.sheet button:has-text("今はしない")');
  const doneCard = page.locator('.card:has-text("終わった手続き")');
  await doneCard.locator('button:has-text("表示する")').click();
  await doneCard.locator('button:has-text("来年の分を始める")').click();
  await page.waitForSelector('.sheet h2:has-text("来年の分も始めますか")');
  ok(true, '「今はしない」を選んでも、終わった手続きからあとで始められる');
  await page.click('.sheet button[type=submit]');
  await page.waitForSelector('text=来年の分を登録しました');
  ok(await page.isVisible('.proc-name >> text=テストの所得状況届（2027年）'), '来年の分の工程ができる');
  ok(!(await doneCard.locator('button:has-text("来年の分を始める")').count()), '来年の分を始めたら、ボタンは消える');
  await doneCard.locator('button:has-text("閉じる")').click();

  // 年齢の節目の型：生年月日から期限を自動で入れる（サンプルの子どもは今日の640日前に生まれた架空の子）
  const birth = new Date(); birth.setHours(0, 0, 0, 0); birth.setDate(birth.getDate() - 640);
  const early = birth.getMonth() + 1 < 4 || (birth.getMonth() + 1 === 4 && birth.getDate() === 1);
  const entry = (birth.getFullYear() + (early ? 6 : 7)) + '-04-01';
  const bday = (n) => { const d = new Date(birth); d.setFullYear(birth.getFullYear() + n); if (d.getDate() !== birth.getDate()) d.setDate(0); return ymd(d); };
  await page.click('text=＋ 手続きを始める');
  await page.selectOption('select[name=templateId]', 'shugaku-sodan');
  await page.waitForSelector('.sheet .birth-deadline:has-text("小学校に入学する日")');
  ok((await page.inputValue('.sheet input[name=deadline]')) === entry, '就学相談の型を選ぶと、期限に入学する年の4月1日が入る');
  await shot('03c_生年月日から期限');
  await page.selectOption('select[name=templateId]', 'iko-18');
  await page.waitForSelector('.sheet .birth-deadline:has-text("18歳の誕生日")');
  ok((await page.inputValue('.sheet input[name=deadline]')) === bday(18), '18歳の切り替えの型では、18歳の誕生日が入る');
  ok(await page.isVisible('.sheet .birth-deadline:has-text("高校を卒業する日")'), '18歳の型では、卒業の日に直せることを案内する');
  await page.fill('input[name=deadline]', '2040-03-01');
  await page.selectOption('select[name=templateId]', 'nenkin-20');
  await page.waitForSelector('.sheet .birth-deadline:has-text("20歳の誕生日")');
  ok((await page.inputValue('.sheet input[name=deadline]')) === '2040-03-01', '自分で直した期限は、型を変えても上書きしない');
  await page.fill('input[name=deadline]', '');
  await page.selectOption('select[name=templateId]', 'shugaku-sodan');
  await page.selectOption('select[name=templateId]', 'nenkin-20');
  await page.waitForSelector('.sheet .birth-deadline:has-text("を入れました")');
  ok((await page.inputValue('.sheet input[name=deadline]')) === bday(20), '期限が空なら、20歳の誕生日が入る');
  await page.selectOption('select[name=templateId]', 'ryouiku-renew');
  ok((await page.inputValue('.sheet input[name=deadline]')) === '', '年齢の節目でない型に変えると、自動で入れた期限は消える');
  await page.selectOption('select[name=templateId]', 'nenkin-20');
  await page.click('.sheet button[type=submit]');
  await page.waitForSelector('text=手続きを登録しました');
  ok(await page.isVisible('.proc-name >> text=20歳の切り替え'), '生年月日から入れた期限で手続きを作れる');
  // 生年月日のない子ども（最初に登録した「テスト」）では入れずに、生年月日を入れるよう案内する
  const sampleChild = await page.inputValue('select.child-select');
  await page.selectOption('select.child-select', { label: 'テスト' });
  await page.click('button[data-tab=process]');
  await page.click('text=＋ 手続きを始める');
  await page.selectOption('select[name=templateId]', 'shugaku-sodan');
  await page.waitForSelector('.sheet .birth-deadline:has-text("生年月日を入れると")');
  ok((await page.inputValue('.sheet input[name=deadline]')) === '', '生年月日がなければ、期限は入れずに案内だけ出す');
  await page.click('.sheet button:has-text("やめる")');
  await page.selectOption('select.child-select', sampleChild);
  await page.click('button[data-tab=process]');

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
  ok(![book, full].some((t) => t.includes('退院療養計画書_架空') || t.includes('健診結果_架空')), '元の書類（sourceFile）は、支援者向けにも家族用にも印刷しない');
  await shot('09_サポートブック_家族用');
  await page.click('text=‹ 戻る');

  // AIで読み取ったデータの取り込み（確認の画面）：架空の取り込み用ファイル sample/sample-import.json を使う
  const aiText = fs.readFileSync(path.join(__dirname, '..', 'sample', 'sample-import.json'), 'utf8');
  await page.click('button[data-tab=settings]');
  await page.click('text=読み取ったデータを取り込む（AIで作ったデータ）');
  await page.fill('.sheet textarea[name=importText]', 'こんにちは。うまく読めませんでした。');
  await page.click('.sheet button:has-text("読み取る")');
  await page.waitForSelector('.sheet .import-error');
  ok((await page.textContent('.sheet .import-error')).includes('JSON'), '取り込み用のデータがない文を貼ると、理由を出して貼り付けの画面に残る');
  await page.fill('.sheet textarea[name=importText]', 'できました。\n```json\n' + aiText + '\n```\n日付は書類と見くらべてください。');
  await page.click('.sheet button:has-text("読み取る")');
  await page.waitForSelector('text=読み取ったデータの確認');
  ok(true, 'AIの答え（説明やコードブロックがまじった文）をそのまま貼って読み取れる');
  await page.selectOption('.sheet select[data-change=importChild]', { label: 'さくら（サンプル）' });
  const impItems = page.locator('.sheet .imp-item');
  ok((await impItems.count()) === 7, '取り込み用データの記録が1件ずつ並ぶ');
  const impRow = (type) => page.locator('.sheet .imp-item:has(.imp-type:text-is("' + type + '"))').first();
  const visitBox = impRow('受診・入院の記録').locator('input[data-change=importCheck]');
  ok(!(await visitBox.isChecked()) && (await visitBox.isEnabled()) && (await impRow('受診・入院の記録').textContent()).includes('AIが自信がない'), 'AIが自信がない項目のある記録は、印が付き最初はチェックが外れている');
  ok(await impRow('医療機関・関係機関').locator('input[data-change=importCheck]').isChecked(), '問題のない記録は、最初からチェックが付いている');
  const diagRow = impRow('診断名');
  ok((await diagRow.locator('input[data-change=importCheck]').isDisabled()) && (await diagRow.textContent()).includes('まだ取り込めません'), '診断名などは、まだ取り込めない（3-4 で対応）');
  ok((await impRow('手続きを始める').textContent()).includes('特別児童扶養手当の所得状況届') && (await impRow('手続きを始める').locator('select[data-change=importCert]').count()) === 1, '手続きは、型の受給者証を選べる');
  ok((await impRow('受診・入院の記録').textContent()).includes('元の書類：2026-03-10_退院療養計画書'), '元の書類の名前とAIのひとことを見られる');
  await shot('12_取り込みの確認');
  // 上の「毎年くり返す型」のテストで同じ型の手続きが始まっているので、重なりの印が付く
  const procBox = impRow('手続きを始める').locator('input[data-change=importCheck]');
  ok(!(await procBox.isChecked()) && (await impRow('手続きを始める').textContent()).includes('もう始まっています'), '同じ型の手続きがもう始まっていれば、印が付き最初はチェックが外れている');
  await visitBox.check();
  ok((await page.textContent('.sheet [data-act=importApply]')).includes('3件'), 'チェックを付けると、取り込む件数が変わる');
  await procBox.check();
  await page.click('.sheet [data-act=importApply]');
  await page.waitForSelector('text=4件を取り込みました');
  ok(true, 'チェックしたものだけを取り込める');
  await page.click('button[data-tab=info]');
  await page.click('.seg button:has-text("医療機関・関係機関")');
  ok(await page.isVisible('text=〇〇こども病院（架空）'), '取り込んだ医療機関が出る');
  await page.click('.seg button:has-text("診断・医療歴")');
  await page.click('text=肺炎で入院（架空の例）');
  ok((await page.inputValue('.sheet [name=sourceFile]')).startsWith('2026-03-10_退院療養計画書'), '取り込んだ記録の「元の書類」に、読み取った書類の名前が入る');
  await page.click('.sheet button:has-text("やめる")');
  await page.click('button[data-tab=process]');
  ok(await page.isVisible('.proc-name >> text=特別児童扶養手当の所得状況届（2026年）'), '取り込んだ手続きの工程ができる');
  // 同じものをもう一度取り込もうとすると、重なりの印が付く
  await page.click('button[data-tab=settings]');
  await page.click('text=読み取ったデータを取り込む（AIで作ったデータ）');
  await page.fill('.sheet textarea[name=importText]', aiText);
  await page.click('.sheet button:has-text("読み取る")');
  await page.waitForSelector('text=読み取ったデータの確認');
  await page.selectOption('.sheet select[data-change=importChild]', { label: 'さくら（サンプル）' });
  ok(!(await impRow('医療機関・関係機関').locator('input[data-change=importCheck]').isChecked()) && (await impRow('医療機関・関係機関').textContent()).includes('すでに同じものがありそう'), '2回目は、すでにある記録と重なる印が付き、チェックが外れる');
  await page.click('.sheet button:has-text("やめる")');

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
