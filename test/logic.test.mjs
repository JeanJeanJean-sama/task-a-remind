// 共通ロジックのテスト：node test/logic.test.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url).pathname;
const ctx = { crypto: globalThis.crypto, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(root + 'src/logic.js', 'utf8') + '\nthis.Logic = Logic;', ctx);
const L = ctx.Logic;
const T = JSON.parse(fs.readFileSync(root + 'src/templates.json', 'utf8'));
let n = 0;
const test = (name, fn) => { fn(); n++; console.log('  ✓', name); };

test('日付の計算', () => {
  assert.equal(L.addDays('2026-09-28', 5), '2026-10-03');
  assert.equal(L.addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(L.diffDays('2026-09-28', '2026-12-27'), 90);
  assert.equal(L.fmtMD('2026-09-08'), '9/8');
});

test('手続きの型から工程を作る（逆算・連鎖・今日より前は詰める）', () => {
  const tpl = L.findTemplate(T, 'ryouiku-renew');
  const tasks = L.planProcess(tpl, '2026-12-27', { childId: 'c1', today: '2026-09-28', contactIdsByKind: { '療育': 'k1' } });
  assert.equal(tasks.length, tpl.steps.length);
  assert.equal(tasks[0].dueDate, '2026-09-28');       // 90日前＝9/28
  assert.equal(tasks[1].dueDate, '2026-10-03');       // 85日前
  assert.equal(tasks[1].contactId, 'k1');
  assert.deepEqual([...tasks[1].dependsOn], [tasks[0].id]);
  assert.equal(new Set(tasks.map((t) => t.processId)).size, 1);
  const late = L.planProcess(tpl, '2026-10-10', { today: '2026-09-28' });
  assert.ok(late.every((t) => t.dueDate >= '2026-09-28'));
});

test('前の工程が終わるまで次は出てこない', () => {
  const tasks = L.planProcess(L.findTemplate(T, 'generic'), '2026-12-01', { childId: 'c1', today: '2026-09-28' });
  const db = { tasks, certificates: [], children: [{ id: 'c1', nickname: 'A' }], contacts: [] };
  let s = L.summarize(db, '2026-09-28', { childId: 'c1' });
  assert.equal(s.night.length, 1);
  assert.equal(s.dayUnscheduled.length, 0);
  tasks[0].status = 'done';
  s = L.summarize(db, '2026-09-28', { childId: 'c1' });
  assert.equal(s.night.length, 0);
  assert.equal(s.dayUnscheduled.length, 1);           // 次は「昼しかできない」工程
  tasks[1].scheduledDate = '2026-09-29';
  s = L.summarize(db, '2026-09-28', {});
  assert.equal(s.dayTomorrow.length, 1);
  s = L.summarize(db, '2026-09-29', {});
  assert.equal(s.dayToday.length, 1);
});

test('期限が近い受給者証を知らせる／手続き中なら知らせない', () => {
  const cert = { id: 'x', childId: 'c1', kind: '療育手帳', validUntil: '2026-11-01' };
  const db = { tasks: [], certificates: [cert], children: [], contacts: [] };
  assert.equal(L.certificateAlerts(db, '2026-09-28', 'c1', 120).length, 1);
  assert.equal(L.certificateAlerts(db, '2026-09-28', 'c1', 20).length, 0);
  db.tasks.push({ id: 't', certificateId: 'x', status: 'todo' });
  assert.equal(L.certificateAlerts(db, '2026-09-28', 'c1', 120).length, 0);
});

test('通知の文面に医療の情報が入らない', () => {
  const s = L.buildSample('2026-09-28', T);
  const db = s.collections;
  const text = L.buildDigestText(db, '2026-09-28', { appUrl: 'https://example.com/app' });
  assert.ok(text.includes('今夜のまとめ'));
  assert.ok(text.includes('保育園に来月の注入時間の変更を伝える'));
  assert.ok(text.includes('https://example.com/app'));
  for (const word of ['症候群', 'お薬', '経管', 'アレルギー', '心臓', '見本']) assert.ok(!text.includes(word), word + ' が含まれている');
  const t = db.tasks.find((x) => x.window === 'day' && x.status === 'todo');
  t.scheduledDate = '2026-09-28';
  const day = L.buildDayText(db, '2026-09-28', {});
  assert.ok(day.includes(t.title));
  assert.ok(day.includes('03-0000-0000'));
  assert.equal(L.buildDigestText({ tasks: [], certificates: [], children: [], contacts: [] }, '2026-09-28', {}), '');
});

test('カレンダー（.ics）', () => {
  const ics = L.toIcs([{ id: 'a', title: '書類, 記入;する', dueDate: '2026-10-01', status: 'todo', window: 'night' },
    { id: 'b', title: '完了済み', dueDate: '2026-10-01', status: 'done' }]);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20261001'));
  assert.ok(ics.includes('SUMMARY:書類\\, 記入\\;する'));
  assert.ok(!ics.includes('完了済み'));
});

test('書き出し→読み込み（新しい方を残す）', () => {
  const cur = { tasks: [{ id: '1', title: '古い', updatedAt: '2026-01-01T00:00:00Z' }, { id: '2', title: '新しい', updatedAt: '2026-05-01T00:00:00Z' }], children: [] };
  const data = L.migrate(JSON.parse(JSON.stringify(L.makeExport({
    tasks: [{ id: '1', title: '更新', updatedAt: '2026-02-01T00:00:00Z' }, { id: '2', title: '古い版', updatedAt: '2026-04-01T00:00:00Z' }, { id: '3', title: '追加', updatedAt: '2026-01-01T00:00:00Z' }],
    unknown: [{ id: 'z' }]
  }))));
  const changed = L.mergeImport(cur, data.collections);
  assert.deepEqual([...changed.map((c) => c.rec.id)].sort(), ['1', '3']);
  assert.throws(() => L.migrate({ format: 'other' }));
  assert.equal(L.migrate({ format: 'tasuka-remind-export', schemaVersion: 2, collections: {} }).format, 'task-a-remind-export', '旧名の書き出しファイルも読める');
  assert.throws(() => L.migrate({ format: 'task-a-remind-export', schemaVersion: 99, collections: {} }));
});

test('サンプルデータがデータ定義に合っている', () => {
  const schema = JSON.parse(fs.readFileSync(root + 'src/schema.json', 'utf8'));
  const s = L.buildSample('2026-09-28', T);
  for (const [col, list] of Object.entries(s.collections)) {
    const def = schema.collections[col];
    assert.ok(def, col + ' が定義にない');
    const keys = new Set(['id', 'createdAt', 'updatedAt', 'deleted', ...def.fields.map((f) => f.key)]);
    for (const rec of list) {
      for (const k of Object.keys(rec)) assert.ok(keys.has(k), `${col}.${k} が定義にない`);
      for (const f of def.fields) if (f.required) assert.ok(rec[f.key] !== '' && rec[f.key] != null, `${col}.${f.key} が必須なのに空`);
    }
  }
});


test('年齢の表示（○歳○ヶ月）', () => {
  assert.equal(L.ageText('2022-01-26', '2022-02-05'), '10日');
  assert.equal(L.ageText('2022-01-26', '2022-07-20'), '5ヶ月');
  assert.equal(L.ageText('2022-01-26', '2023-01-25'), '11ヶ月');
  assert.equal(L.ageText('2022-01-26', '2023-01-26'), '1歳');
  assert.equal(L.ageText('2022-01-26', '2023-10-17'), '1歳8ヶ月');
  assert.equal(L.ageText('2022-01-26', '2021-12-01'), '');
  assert.equal(L.fmtYm('2022-03'), '2022年3月');
});

test('第1版のデータを第2版に直す（何度やっても同じ）', () => {
  const v1 = {
    format: 'task-a-remind-export', schemaVersion: 1,
    collections: {
      profile: [{ id: 'a', category: '性格・特性・関わり方', label: '好き', value: 'x' }, { id: 'b', category: '生活リズム・食事', label: '食事', value: 'y' }, { id: 'c', category: '基本情報', label: 'z', value: 'z' }],
      certificates: [{ id: 'k', kind: '療育手帳' }]
    }
  };
  const d = L.migrate(JSON.parse(JSON.stringify(v1)));
  assert.equal(d.schemaVersion, 2);
  assert.equal(d.collections.profile[0].category, '特徴と関わり方');
  assert.equal(d.collections.profile[1].category, '食事');
  assert.equal(d.collections.profile[2].category, '基本情報');
  assert.equal(d.collections.certificates[0].status, '取得済み');
  assert.equal(L.upgradeCollections(d.collections).length, 0, '2回目は何も変わらない');
});

test('プライバシーポリシーのページ（Google Cloud の同意画面に登録する）', () => {
  const pp = fs.readFileSync(root + 'docs/privacy.html', 'utf8');
  assert.ok(!pp.includes('<!--CONTACT-->'), '問い合わせ先の置き場所が残っていない');
  assert.ok(pp.includes('auth/drive.appdata'), '使う権限（drive.appdata）を説明している');
  assert.ok(pp.includes('api-services-user-data-policy'), 'Googleのユーザーデータのポリシー（限定使用）に触れている');
  assert.ok(pp.includes('task-a-remind') && !pp.includes('tasuka-remind'), '英字表記は task-a-remind');
  const ai = pp.slice(pp.indexOf('id="ai"'), pp.indexOf('<h2>5.'));
  assert.ok(pp.includes('id="ai"'), '外のAIを使うときの注意の節がある（アプリから #ai でつなぐ）');
  for (const w of ['AIに送りません', '番号', '住所', '隠す', '学習に使わせない']) assert.ok(ai.includes(w), '外のAIを使うときの注意に「' + w + '」がある');
  const index = fs.readFileSync(root + 'docs/index.html', 'utf8');
  assert.match(index, /<footer class="site-foot[^>]*>[\s\S]*href="privacy\.html"/, 'Web版のHTMLに、JavaScriptなしでも読めるポリシーへのリンクがある');
  const gas = fs.readFileSync(root + 'gas/Index.html', 'utf8');
  assert.ok(!gas.includes('<footer class="site-foot'), 'GAS版の画面には下の説明を入れない');
  // drive-sync.js の SCOPE を実際に組み立てて、使う権限をすべて取り出す
  const syncSrc = fs.readFileSync(root + 'src/drive-sync.js', 'utf8');
  const decl = syncSrc.match(/var DRIVE_SCOPE = [^;]+;\s*var SCOPE = [^;]+;/)[0];
  const scope = vm.runInNewContext(decl + ' SCOPE').split(' ');
  assert.ok(scope.length >= 2);
  for (const sc of scope) assert.ok(pp.includes(sc.replace('https://www.googleapis.com/', '')), '同期で使う権限はすべてポリシーに書いてある：' + sc);
});

// ---------- 使えるかもしれない制度（目安） ----------
const B = JSON.parse(fs.readFileSync(root + 'src/benefits.json', 'utf8'));
// 架空の子どもと証明書から db を作る
const mkDb = (certs, child = {}, checks = []) => ({
  children: [Object.assign({ id: 'c1', nickname: '架空', birthDate: '2020-04-01', prefecture: '神奈川県', municipality: '横浜市○○区', deleted: false }, child)],
  certificates: certs.map((c, i) => Object.assign({ id: 'k' + i, childId: 'c1', status: '取得済み', deleted: false }, c)),
  benefitChecks: checks.map((c, i) => Object.assign({ id: 'b' + i, childId: 'c1', deleted: false }, c)),
  tasks: []
});
const ids = (r) => r.items.map((x) => x.benefit.id);
const lv = (r, id) => (r.items.find((x) => x.benefit.id === id) || {}).level;

test('手帳の等級を読む（選ぶ欄が優先、書いてある欄は1つだけ読めるときだけ）', () => {
  assert.equal(L.certGrade({ kind: '身体障害者手帳', gradeCode: '2級', grade: '1級' }), '2級');
  assert.equal(L.certGrade({ kind: '身体障害者手帳', grade: '（架空）１級' }), '1級');
  assert.equal(L.certGrade({ kind: '療育手帳', grade: 'Ａ２' }), 'A2');
  assert.equal(L.certGrade({ kind: '身体障害者手帳', grade: '下肢4級・体幹3級' }), '', '2つ読めたら使わない');
  assert.equal(L.certGrade({ kind: '小児慢性特定疾病医療受給者証', grade: '1級' }), '', '手帳以外は読まない');
});

test('等級で制度の目安が変わる', () => {
  const r1 = L.suggestBenefits(mkDb([{ kind: '身体障害者手帳', gradeCode: '1級', disabilityType: '肢体不自由（下肢）', fareClass: '第1種' }]), B, 'c1', '2026-10-01');
  for (const id of ['tokuji', 'shojifukushi', 'judo-iryo', 'fukushi-taxi', 'nenryo', 'tokubetsu-josha', 'yuryo-doro', 'suido']) assert.ok(ids(r1).includes(id), id + ' が出る');
  assert.equal(lv(r1, 'judo-iryo'), 'likely');
  assert.equal(lv(r1, 'tokuji'), 'maybe', '手当は「条件しだい」までしか言わない');
  const r5 = L.suggestBenefits(mkDb([{ kind: '身体障害者手帳', gradeCode: '5級' }]), B, 'c1', '2026-10-01');
  for (const id of ['tokuji', 'judo-iryo', 'fukushi-taxi', 'tokubetsu-josha', 'suido']) assert.ok(!ids(r5).includes(id), id + ' は5級では出ない');
  assert.ok(ids(r5).includes('tetsudo') && ids(r5).includes('zei-kojo'), '手帳があれば出るものは出る');
});

test('障害の種類・第1種が足りないときは「条件しだい」にする', () => {
  const r = L.suggestBenefits(mkDb([{ kind: '身体障害者手帳', gradeCode: '2級' }]), B, 'c1', '2026-10-01');
  assert.equal(lv(r, 'fukushi-taxi'), 'maybe');
  assert.match(r.items.find((x) => x.benefit.id === 'fukushi-taxi').why.join(), /障害の種類が入っていません/);
  assert.equal(lv(r, 'yuryo-doro'), 'maybe');
  const hearing = L.suggestBenefits(mkDb([{ kind: '身体障害者手帳', gradeCode: '2級', disabilityType: '聴覚・平衡機能障害', fareClass: '第2種' }]), B, 'c1', '2026-10-01');
  assert.ok(!ids(hearing).includes('fukushi-taxi'), '対象外の種類なら出さない');
  assert.ok(!ids(hearing).includes('yuryo-doro'), '第2種なら介護運転の割引は出さない');
  const two = L.suggestBenefits(mkDb([{ kind: '身体障害者手帳', gradeCode: '2級', disabilityType: '聴覚・平衡機能障害', disabilityType2: '肢体不自由（体幹）' }]), B, 'c1', '2026-10-01');
  assert.equal(lv(two, 'fukushi-taxi'), 'likely', '2つ目の種類も見る');
});

test('手帳の組み合わせ（かつ・2つ以上）', () => {
  const both = L.suggestBenefits(mkDb([{ kind: '身体障害者手帳', gradeCode: '3級' }, { kind: '療育手帳', gradeCode: 'B1' }]), B, 'c1', '2026-10-01');
  assert.equal(lv(both, 'judo-iryo'), 'likely', '身体3級かつ療育B1');
  assert.equal(lv(both, 'suido'), 'likely', '身体3級と療育手帳の2つ');
  const one = L.suggestBenefits(mkDb([{ kind: '身体障害者手帳', gradeCode: '3級' }]), B, 'c1', '2026-10-01');
  assert.ok(!ids(one).includes('judo-iryo') && !ids(one).includes('suido'));
  const ken = L.suggestBenefits(mkDb([{ kind: '身体障害者手帳', gradeCode: '1級' }, { kind: '療育手帳', gradeCode: 'A1' }]), B, 'c1', '2026-10-01');
  assert.equal(lv(ken, 'kanagawa-zaitaku'), 'likely');
});

test('登録ずみ・確認ずみ・年齢・地域・取得前の手帳', () => {
  const base = [{ kind: '身体障害者手帳', gradeCode: '1級' }];
  const held = L.suggestBenefits(mkDb(base.concat([{ kind: '特別児童扶養手当' }])), B, 'c1', '2026-10-01');
  assert.ok(!ids(held).includes('tokuji'), '受給者証を登録ずみなら出さない');
  assert.equal(lv(held, 'suido'), 'likely', '特別児童扶養手当の受給で水道の減免');
  const checked = L.suggestBenefits(mkDb(base, {}, [{ benefitId: 'judo-iryo', benefitName: 'x', status: '対象外だった' }]), B, 'c1', '2026-10-01');
  assert.ok(!ids(checked).includes('judo-iryo'));
  assert.equal(checked.checked.length, 1);
  const adult = L.suggestBenefits(mkDb(base, { birthDate: '2005-01-01' }), B, 'c1', '2026-10-01');
  assert.ok(!ids(adult).includes('tokuji') && !ids(adult).includes('ikusei'), '20歳以上には子どもの手当を出さない');
  const tokyo = L.suggestBenefits(mkDb(base, { prefecture: '東京都', municipality: '○○市' }), B, 'c1', '2026-10-01');
  assert.equal(tokyo.area, 'other');
  assert.equal(tokyo.items.length, 0, '横浜市以外では出さない');
  const unset = L.suggestBenefits(mkDb(base, { prefecture: '', municipality: '' }), B, 'c1', '2026-10-01');
  assert.equal(unset.area, 'unset');
  assert.ok(unset.items.length > 0, '市区町村が空なら目安として出す');
  const plan = L.suggestBenefits(mkDb([{ kind: '身体障害者手帳', gradeCode: '1級', status: '未取得・取得予定' }]), B, 'c1', '2026-10-01');
  assert.equal(plan.items.length, 0, '取得前の手帳では出さない');
  assert.equal(L.suggestBenefits(mkDb(base), B, 'c1', '2027-08-01').stale, true, '見直しの期限を過ぎたら知らせる');
});

test('サンプル（架空）でも目安が出て、通知には制度の名前が出ない', () => {
  const s = L.buildSample('2026-10-01', T);
  const r = L.suggestBenefits(s.collections, B, s.childId, '2026-10-01');
  assert.ok(r.items.length > 0);
  assert.ok(r.checked.some((x) => x.benefit.id === 'tetsudo'));
  const text = L.buildDigestText(s.collections, '2026-10-01', { appUrl: 'https://example.com/app' });
  for (const b of B.benefits) assert.ok(!text.includes(b.name), b.name + ' が通知に入っている');
  for (const w of ['3級', '内部障害', '第2種']) assert.ok(!text.includes(w), w + ' が通知に入っている');
});

test('手続きの型が決まりに合っている（選択肢・工程の日数・group・repeat・checkedOn）', () => {
  const S = JSON.parse(fs.readFileSync(root + 'src/schema.json', 'utf8'));
  const opts = (col, key) => S.collections[col].fields.find((f) => f.key === key).options;
  const contactKinds = opts('contacts', 'kind');
  const certKinds = opts('certificates', 'kind');
  const groups = ['毎年の届出', '期限のあるもの', '年齢の節目', '災害の備え'];
  const ids = new Set();
  for (const t of T.templates) {
    assert.ok(!ids.has(t.id), t.id + ' が2つある');
    ids.add(t.id);
    assert.ok(t.name && t.steps.length > 0, t.id);
    for (const k of t.certificateKinds || []) assert.ok(certKinds.includes(k), `${t.id} の certificateKinds「${k}」が選択肢にない`);
    if (t.group !== undefined) assert.ok(groups.includes(t.group), `${t.id} の group「${t.group}」`);
    if (t.repeat !== undefined) assert.equal(t.repeat, 'yearly', t.id);
    if (t.checkedOn !== undefined) assert.match(t.checkedOn, /^\d{4}-\d{2}-\d{2}$/, t.id);
    if (t.deadlineFromBirth !== undefined) {
      const r = t.deadlineFromBirth;
      assert.ok(r.kind === 'schoolEntry' || (r.kind === 'birthday' && Number.isInteger(r.age) && r.age > 0), `${t.id} の deadlineFromBirth`);
    }
    let prev = Infinity;
    for (const st of t.steps) {
      assert.ok(st.title, t.id);
      assert.ok(['day', 'night'].includes(st.window), `${t.id}「${st.title}」の window`);
      assert.ok(Number.isInteger(st.daysBefore) && st.daysBefore >= 0, `${t.id}「${st.title}」の daysBefore`);
      assert.ok(st.daysBefore <= prev, `${t.id}「${st.title}」の日数が前の工程より大きい`);
      prev = st.daysBefore;
      if (st.contactKind) assert.ok(contactKinds.includes(st.contactKind), `${t.id} の contactKind「${st.contactKind}」が選択肢にない`);
    }
  }
  assert.equal(T.templates[T.templates.length - 1].id, 'generic', '汎用の型は最後');
});

test('手続きの型を group ごとに分ける（group なしは「更新・申請」、汎用は「その他」で最後）', () => {
  const gs = L.groupTemplates(T);
  const labels = gs.map((g) => g.label);
  assert.equal(labels[0], '更新・申請');
  assert.equal(labels[labels.length - 1], 'その他');
  assert.deepEqual([...gs[gs.length - 1].templates.map((t) => t.id)], ['generic']);
  assert.equal(gs.reduce((a, g) => a + g.templates.length, 0), T.templates.length, 'すべての型がどこかの組に入る');
  for (const g of gs) for (const t of g.templates) if (t.group) assert.equal(t.group, g.label, t.id);
  assert.ok(gs[0].templates.some((t) => t.id === 'ryouiku-renew'));
});

test('毎年くり返す型の最後の工程で、有効期限に毎年の締め切りを入れさせない', () => {
  for (const t of T.templates.filter((x) => x.repeat === 'yearly')) {
    const last = t.steps[t.steps.length - 1];
    assert.ok(!/期限をアプリに入れる|期限を入れる/.test(last.title + (last.script || '')), t.id + ' の最後の工程');
  }
});

test('新しい手続きの型（所得状況届）から工程を作る', () => {
  const tpl = L.findTemplate(T, 'tokuji-shotoku');
  const tasks = L.planProcess(tpl, '2027-09-11', { childId: 'c1', today: '2027-07-01', contactIdsByKind: { '役所': 'k9' } });
  assert.equal(tasks.length, 4);
  assert.equal(tasks[0].dueDate, '2027-08-12');
  assert.equal(tasks[2].contactId, 'k9');
  assert.ok(tasks[0].script.includes('9月11日'));
});

test('生年月日から期限を出す（就学：入学する年の4月1日、18歳・20歳：誕生日）', () => {
  // 4月2日生まれ〜翌年4月1日生まれが同じ学年（4月1日生まれは早生まれ）
  assert.equal(L.schoolEntryDate('2020-04-02'), '2027-04-01');
  assert.equal(L.schoolEntryDate('2020-04-01'), '2026-04-01');
  assert.equal(L.schoolEntryDate('2021-03-31'), '2027-04-01');
  assert.equal(L.schoolEntryDate('2020-12-25'), '2027-04-01');
  assert.equal(L.schoolEntryDate('2021-01-01'), '2027-04-01');
  assert.equal(L.schoolEntryDate(''), '');
  const sh = L.birthDeadline(L.findTemplate(T, 'shugaku-sodan'), '2021-06-10');
  assert.equal(sh.date, '2028-04-01');
  assert.equal(sh.label, '小学校に入学する日');
  const b18 = L.birthDeadline(L.findTemplate(T, 'iko-18'), '2010-07-20');
  assert.equal(b18.date, '2028-07-20');
  assert.equal(b18.label, '18歳の誕生日');
  assert.ok(b18.note.includes('高校を卒業する日'));
  assert.equal(L.birthDeadline(L.findTemplate(T, 'nenkin-20'), '2008-02-29').date, '2028-02-29', 'うるう年の20歳の誕生日');
  assert.equal(L.birthDeadline(L.findTemplate(T, 'iko-18'), '2008-02-29').date, '2026-02-28', 'うるう年でなければ2/28');
  assert.equal(L.birthDeadline(L.findTemplate(T, 'nenkin-20'), ''), null, '生年月日がなければ出さない');
  assert.equal(L.birthDeadline(L.findTemplate(T, 'ryouiku-renew'), '2020-04-02'), null, '決まりのない型は出さない');
  assert.deepEqual(T.templates.filter((t) => t.deadlineFromBirth).map((t) => t.id).sort(), ['iko-18', 'nenkin-20', 'shugaku-sodan']);
  // 出した期限から工程を作れる（就学相談の最初の工程は420日前）
  const tasks = L.planProcess(L.findTemplate(T, 'shugaku-sodan'), sh.date, { childId: 'c1', today: '2026-11-04' });
  assert.equal(tasks[0].dueDate, '2027-02-06');
});

test('毎年くり返す型：最後の工程が終わったら、期限を1年先にした来年の分の案を出す', () => {
  assert.equal(L.addYears('2026-09-11', 1), '2027-09-11');
  assert.equal(L.addYears('2028-02-29', 1), '2029-02-28');
  assert.equal(L.nextYearName('特別児童扶養手当の所得状況届（2026年）'), '特別児童扶養手当の所得状況届（2027年）');
  assert.equal(L.nextYearName('就学奨励（2026年度）'), '就学奨励（2027年度）');
  const tpl = L.findTemplate(T, 'tokuji-shotoku');
  // 案内が遅れて届き、最初の工程が今日に詰められても、期限は正しく推し量れる
  const tasks = L.planProcess(tpl, '2026-09-11', { childId: 'c1', certificateId: 'cert1', today: '2026-08-20', processName: '特別児童扶養手当の所得状況届（2026年）' });
  assert.equal(tasks[0].dueDate, '2026-08-20');
  assert.equal(L.processDeadline(tasks, tpl), '2026-09-11');
  const db = { tasks };
  const pid = tasks[0].processId;
  assert.equal(L.nextRepeat(db, pid, T), null, 'まだ終わっていない工程があるときは出さない');
  tasks.forEach((t) => { t.status = 'done'; });
  const rep = L.nextRepeat(db, pid, T);
  assert.equal(rep.templateId, 'tokuji-shotoku');
  assert.equal(rep.deadline, '2027-09-11');
  assert.equal(rep.lastDeadline, '2026-09-11');
  assert.equal(rep.name, '特別児童扶養手当の所得状況届（2027年）');
  assert.equal(rep.childId, 'c1');
  assert.equal(rep.certificateId, 'cert1');
  // 飛ばした工程（skipped）があっても、終わったものとして扱う
  tasks[1].status = 'skipped';
  assert.ok(L.nextRepeat(db, pid, T));
  // 来年の分をもう始めていれば出さない（ほかの子どもの分は関係しない）
  const other = L.planProcess(tpl, '2027-09-11', { childId: 'c2', today: '2026-09-12' });
  db.tasks = tasks.concat(other);
  assert.ok(L.nextRepeat(db, pid, T), 'ほかの子どもの分は関係しない');
  const next = L.planProcess(tpl, rep.deadline, { childId: 'c1', today: '2026-09-12' });
  db.tasks = tasks.concat(other, next);
  assert.equal(L.nextRepeat(db, pid, T), null, '来年の分を始めたら出さない');
  // 来年の分を削除したら、また出す
  next.forEach((t) => { t.deleted = true; });
  assert.ok(L.nextRepeat(db, pid, T));
  // くり返さない型では出さない
  const once = L.planProcess(L.findTemplate(T, 'ryouiku-renew'), '2026-12-27', { childId: 'c1', today: '2026-09-28' });
  once.forEach((t) => { t.status = 'done'; });
  assert.equal(L.nextRepeat({ tasks: once }, once[0].processId, T), null);
  assert.equal(L.nextRepeat({ tasks: [] }, '', T), null);
});

// ---------- AIで読み取った書類のデータの取り込み（提案書A 3-1） ----------
const S = JSON.parse(fs.readFileSync(root + 'src/schema.json', 'utf8'));
const imp = (records) => ({ format: 'task-a-remind-import', formatVersion: 1, schemaVersion: 2, records });
// vm の中で作った配列は assert.deepEqual で比べられないので、ふつうの値に直す
const plain = (x) => JSON.parse(JSON.stringify(x));
const codes = (it) => plain(it.problems.map((p) => p.code)).sort();
const TODAY = '2026-11-04';
const DB = () => ({
  children: [{ id: 'c1', nickname: 'A', birthDate: '2024-04-10' }, { id: 'c2', nickname: 'B' }],
  visits: [{ id: 'v1', childId: 'c1', date: '2025-05-01', facility: '〇〇病院（架空）', summary: '受診' }],
  contacts: [{ id: 'k1', childId: 'c1', kind: '病院', name: '〇〇病院（架空）', department: '小児科' }],
  milestones: [], diagnoses: [], profile: [{ id: 'p1', childId: 'c1', order: 3 }],
  certificates: [{ id: 'z1', childId: 'c1', kind: '特別児童扶養手当' }, { id: 'z2', childId: 'c1', kind: '療育手帳' }],
  tasks: []
});
const check = (records, opts) => plain(L.checkImport(imp(records), S, (opts && opts.db) || DB(), T, Object.assign({ childId: 'c1', today: TODAY }, opts)));

test('取り込み：データ定義に「元の書類」と「過去の日付だけ」の印がある', () => {
  for (const c of ['visits', 'milestones', 'diagnoses', 'certificates', 'contacts', 'profile']) {
    const f = S.collections[c].fields.find((x) => x.key === 'sourceFile');
    assert.ok(f && f.notPrinted && !f.hidden, c + ' に sourceFile がある');
  }
  for (const c of ['children', 'family', 'tasks', 'careProcedures', 'careSteps', 'schedule', 'benefitChecks']) {
    assert.ok(!S.collections[c].fields.some((x) => x.key === 'sourceFile'), c + ' には sourceFile を足さない');
  }
  assert.equal(S.schemaVersion, 2, '項目を足すだけなので schemaVersion は上げない');
  const past = (c, k) => !!S.collections[c].fields.find((x) => x.key === k).pastOnly;
  assert.ok(past('visits', 'date') && past('milestones', 'achievedOn') && past('diagnoses', 'diagnosedOn') && past('certificates', 'issuedOn'));
  assert.ok(!past('certificates', 'validUntil') && !past('tasks', 'dueDate') && !past('visits', 'endDate'), '未来が正しい欄には付けない');
});

test('取り込み：貼り付けた文からJSONを取り出す', () => {
  const json = JSON.stringify(imp([]));
  assert.equal(L.parseImportText(json).format, 'task-a-remind-import');
  assert.equal(L.parseImportText('\uFEFF' + json).records.length, 0);
  const answer = '読み取りました。\n\n```json\n' + JSON.stringify(imp([{ type: 'milestones', data: { item: '首すわり' } }]), null, 2) + '\n```\n\n日付は書類に書いてありませんでした。';
  assert.equal(L.parseImportText(answer).records[0].data.item, '首すわり', 'コードブロックの中を読む');
  assert.equal(L.parseImportText('はい、どうぞ ' + json + ' 以上です').records.length, 0, '前後の説明を飛ばす');
  assert.throws(() => L.parseImportText(''), /空です/);
  assert.throws(() => L.parseImportText('{ "format": "task-a-remind-import", '), /読み取れませんでした/, '途中で切れている');
  assert.throws(() => L.parseImportText(JSON.stringify({ format: 'task-a-remind-export', collections: {} })), /書き出したデータ/);
  assert.throws(() => L.parseImportText(JSON.stringify({ format: 'other', records: [] })), /取り込み用ファイルではありません/);
  assert.throws(() => L.parseImportText(JSON.stringify(Object.assign(imp([]), { formatVersion: 2 }))), /アプリを更新/);
  assert.throws(() => L.parseImportText(JSON.stringify({ format: 'task-a-remind-import' })), /records/);
});

test('取り込み：番号・定義にない項目・自動で入る項目は捨てる', () => {
  const [it] = check([{ type: 'certificates', from: 'C:\\Users\\someone\\保管箱\\2026-04-01_受給者証_〇〇市.pdf',
    data: { kind: '身体障害者手帳', number: '000000', issuerNumber: '000000', childId: 'x', id: 'y', sourceFile: 'z', foo: 'bar', validUntil: '2028-03-31' } }]);
  assert.equal(it.rec.number, undefined);
  assert.equal(it.rec.issuerNumber, undefined);
  assert.equal(it.rec.childId, undefined);
  assert.equal(it.rec.foo, undefined);
  assert.deepEqual(it.dropped.map((d) => d.key + ':' + d.reason).sort(), ['childId:auto', 'foo:unknown', 'id:unknown', 'issuerNumber:number', 'number:number', 'sourceFile:auto']);
  assert.ok(codes(it).includes('numberDropped'));
  assert.equal(it.rec.sourceFile, '2026-04-01_受給者証_〇〇市.pdf', 'フォルダの名前は残さない');
  assert.equal(it.rec.validUntil, '2028-03-31', '有効期限は未来でよい');
  assert.ok(it.checked, '番号を捨てただけならチェックは外さない');
});

test('取り込み：日付の形が壊れているものは取り込めない', () => {
  const items = check([
    { type: 'visits', data: { date: '令和3年2月28日', summary: 'a' } },
    { type: 'visits', data: { date: 'R3.2.28', summary: 'a' } },
    { type: 'visits', data: { date: '2021/02/28', summary: 'a' } },
    { type: 'visits', data: { date: '2021-02-30', summary: 'a' } },
    { type: 'diagnoses', data: { name: 'a', diagnosedOn: '2021-02-01' } },
    { type: 'visits', data: { date: '２０２１-０２-２８', summary: 'a' } },
    { type: 'diagnoses', data: { name: 'b', diagnosedOn: '2025-02' } }
  ]);
  assert.deepEqual(items.map((x) => x.canImport), [false, false, false, false, false, true, true]);
  assert.deepEqual(codes(items[0]), ['wareki']);
  assert.deepEqual(codes(items[1]), ['wareki']);
  assert.deepEqual(codes(items[2]), ['badDate']);
  assert.ok(items.slice(0, 5).every((x) => !x.checked));
  assert.equal(items[5].rec.date, '2021-02-28', '全角の数字は半角にする');
});

test('取り込み：未来の日付・生まれる前の日付', () => {
  const items = check([
    { type: 'visits', data: { date: '2026-11-05', summary: 'a' } },
    { type: 'milestones', data: { item: 'a', achievedOn: '2024-04-01' } },
    { type: 'visits', data: { date: '2024-04-10', summary: 'a' } },
    { type: 'diagnoses', data: { name: 'a', diagnosedOn: '2024-03' } },
    { type: 'diagnoses', data: { name: 'b', diagnosedOn: '2026-12' } },
    { type: 'certificates', data: { kind: '身体障害者手帳', validUntil: '2030-01-01', issuedOn: '2024-05-01' } }
  ]);
  assert.deepEqual(codes(items[0]), ['future']);
  assert.deepEqual(codes(items[1]), ['beforeBirth']);
  assert.match(items[1].problems[0].message, /生まれる前の日付です。妊娠中の記録ならこのままで大丈夫です/);
  assert.deepEqual(codes(items[2]), [], '生まれた日は大丈夫');
  assert.deepEqual(codes(items[3]), ['beforeBirth'], '月の欄も調べる');
  assert.deepEqual(codes(items[4]), ['future']);
  assert.deepEqual(codes(items[5]), [], '有効期限は調べない');
  assert.ok(items[0].canImport && !items[0].checked, '印を付けて、最初はチェックを外す');
  const noBirth = check([{ type: 'milestones', data: { item: 'a', achievedOn: '2000-01-01' } }], { childId: 'c2' });
  assert.deepEqual(codes(noBirth[0]), [], '生年月日がなければ調べない');
});

test('取り込み：自信がない・選択肢にない・必須がない・種類が使えない', () => {
  const items = check([
    { type: 'visits', data: { kind: '通院', date: '2025-06-01', summary: 'a' }, unclear: ['summary', 'doctor', 'nope'] },
    { type: 'contacts', data: { kind: '病院' } },
    { type: 'children', data: { nickname: 'x' } },
    { type: 'milestones' },
    { type: 'visits', data: { date: '2025-06-02', summary: 'b' } }
  ]);
  assert.deepEqual(codes(items[0]), ['notInOptions', 'unclear']);
  assert.deepEqual(items[0].unclear, ['summary'], '取り込む項目にあるものだけ');
  assert.deepEqual(codes(items[1]), ['required']);
  assert.ok(items[1].canImport && !items[1].checked);
  assert.ok(!items[2].canImport && codes(items[2])[0] === 'badType');
  assert.ok(!items[3].canImport && codes(items[3])[0] === 'noData');
  assert.equal(items[4].rec.kind, '受診', '必須でない項目は、ふだんの入力と同じ初めの値');
  assert.deepEqual(items[4].defaulted, ['kind']);
  assert.ok(items[4].checked);
});

test('取り込み：すでに同じものがありそう（今のデータ・ファイルの中）', () => {
  const items = check([
    { type: 'visits', data: { date: '2025-05-01', facility: '〇〇病院 （架空）', summary: 'x' } },
    { type: 'visits', data: { date: '2025-05-01', facility: '△△医院（架空）', summary: 'x' } },
    { type: 'contacts', data: { kind: '病院', name: '〇〇病院（架空）' } },
    { type: 'contacts', data: { kind: '病院', name: '〇〇病院（架空）', department: '眼科' } },
    { type: 'contacts', data: { kind: '病院', name: '□□クリニック（架空）' } },
    { type: 'contacts', data: { kind: '病院', name: '□□クリニック（架空）' } }
  ]);
  assert.equal(items[0].duplicateOf.id, 'v1', '日付と病院が同じ（空白のちがいは見ない）');
  assert.equal(items[1].duplicateOf, null, '病院がちがう');
  assert.equal(items[2].duplicateOf.id, 'k1', '診療科が書いていなければ名前だけで見る');
  assert.equal(items[3].duplicateOf.index, 2, '今のデータの小児科とは別。ファイルの中の、診療科のない同じ名前とは重なる');
  const dept = check([{ type: 'contacts', data: { kind: '病院', name: '〇〇病院（架空）', department: '眼科' } }]);
  assert.equal(dept[0].duplicateOf, null, '診療科がちがえば別');
  assert.equal(items[4].duplicateOf, null);
  assert.equal(items[5].duplicateOf.index, 4, 'ファイルの中の前の記録');
  assert.ok(codes(items[0]).includes('duplicate') && !items[0].checked);
  const other = check([{ type: 'visits', data: { date: '2025-05-01', facility: '〇〇病院（架空）', summary: 'x' } }], { childId: 'c2' });
  assert.equal(other[0].duplicateOf, null, 'ほかの子どもの記録とは比べない');
});

test('取り込み：手続きを始める', () => {
  const db = DB();
  db.tasks = L.planProcess(L.findTemplate(T, 'ryouiku-renew'), '2027-03-01', { childId: 'c1', today: TODAY });
  const items = check([
    { type: 'process', data: { templateId: 'tokuji-shotoku', deadline: '2027-08-31', name: '所得状況届（2027年）' } },
    { type: 'process', data: { templateId: 'nai-kata', deadline: '2027-08-31' } },
    { type: 'process', data: { templateId: 'generic' } },
    { type: 'process', data: { templateId: 'shugaku-sodan' } },
    { type: 'process', data: { templateId: 'ryouiku-renew', deadline: '2027-03-01' } },
    { type: 'process', data: { templateId: 'tokuji-shotoku', deadline: '2028-08-31' } }
  ], { db });
  assert.ok(items[0].checked);
  assert.equal(items[0].certificateId, 'z1', '型に合う受給者証が1つなら選んでおく');
  assert.equal(items[0].rec.sourceFile, undefined, '手続きには元の書類の欄がない');
  assert.ok(!items[1].canImport && codes(items[1]).includes('noTemplate'));
  assert.ok(!items[2].canImport && codes(items[2]).includes('required'), '締め切りがなければ工程を作れない');
  assert.equal(items[3].rec.deadline, '2031-04-01', '生年月日から入学する日を入れる');
  assert.ok(items[3].checked && codes(items[3]).includes('deadlineFromBirth'));
  assert.equal(items[4].duplicateOf.col, 'tasks', 'もう始まっている手続き');
  assert.equal(items[5].duplicateOf.index, 0, 'ファイルの中に同じ型');
  assert.ok(!items[4].checked && !items[5].checked);
});

test('取り込み：チェックしたものだけ保存の形にする', () => {
  const db = DB();
  const items = check([
    { type: 'contacts', from: 'a.pdf', data: { kind: '役所', name: '〇〇区役所（架空）' } },
    { type: 'profile', from: 'b.pdf', data: { category: '医療・服薬', label: '服薬', value: '（架空）' } },
    { type: 'visits', data: { date: '2099-01-01', summary: 'x' } },
    { type: 'visits', data: { date: '令和3年', summary: 'x' } },
    { type: 'process', data: { templateId: 'tokuji-shotoku', deadline: '2027-08-31', name: '所得状況届（2027年）' } }
  ], { db });
  items[3].checked = true; // 画面で無理にチェックしても、取り込めないものは入らない
  const out = L.applyImport(items, 'c1', T, TODAY, { db });
  assert.deepEqual(plain(out.map((x) => x.col)), ['contacts', 'profile', 'tasks', 'tasks', 'tasks', 'tasks']);
  const [c, p] = out.map((x) => x.rec);
  assert.ok(c.id && c.createdAt && c.updatedAt && c.deleted === false);
  assert.equal(c.childId, 'c1');
  assert.equal(c.sourceFile, 'a.pdf');
  assert.equal(p.order, 4, '子どもの情報は今のいちばん下に足す');
  assert.equal(p.visibility, 'supporter', '分類ごとの見せてよい範囲');
  const tasks = out.filter((x) => x.col === 'tasks').map((x) => x.rec);
  assert.ok(tasks.every((t) => t.childId === 'c1' && t.certificateId === 'z1' && t.processName === '所得状況届（2027年）'));
  assert.equal(tasks.find((t) => t.stepNo === 3).contactId, c.id, '同じファイルの役所を工程の連絡先にする');
  items[2].checked = true; // 未来の日付でも、利用者がチェックすれば取り込む
  assert.equal(L.applyImport(items, 'c1', T, TODAY, { db }).filter((x) => x.col === 'visits').length, 1);
});

// ---------- 3-4：診断名・受給者証・子どもの情報 ----------
test('取り込み：種類に合わない項目（手帳の等級など）は捨てる', () => {
  const [a, b] = check([
    { type: 'certificates', data: { kind: '健康保険証', gradeCode: 'x', disabilityType: 'y', fareClass: '第1種', issuerName: '〇〇（架空）' } },
    { type: 'certificates', data: { kind: '身体障害者手帳', fareClass: '第1種', grade: '（架空）' } }
  ], { childId: 'c2' });
  assert.deepEqual(a.dropped.map((d) => d.key + ':' + d.reason).sort(), ['disabilityType:showIf', 'fareClass:showIf', 'gradeCode:showIf']);
  assert.equal(a.rec.gradeCode, undefined);
  assert.equal(a.rec.issuerName, '〇〇（架空）');
  assert.ok(a.checked, '捨てただけならチェックは外さない');
  assert.equal(b.rec.fareClass, '第1種', '種類に合う項目は取り込む');
  assert.deepEqual(b.dropped, []);
});

test('取り込み：同じ種類の受給者証・手帳がある（新しい証かもしれない）', () => {
  const db = DB();
  db.certificates.push({ id: 'z3', childId: 'c1', kind: '身体障害者手帳', validUntil: '2027-03-31' });
  const items = check([
    { type: 'certificates', data: { kind: '身体障害者手帳', validUntil: '2031-03-31' } },
    { type: 'certificates', data: { kind: '身体障害者手帳', validUntil: '2027-03-31' } },
    { type: 'certificates', data: { kind: '障害児通所受給者証', validUntil: '2027-06-30' } },
    { type: 'certificates', data: { kind: '障害児通所受給者証', validUntil: '2028-06-30' } }
  ], { db });
  assert.deepEqual(codes(items[0]), ['sameKind']);
  assert.match(items[0].problems[0].message, /すでに同じ種類（身体障害者手帳 有効期限 2027-03-31）があります。新しい証なら、取り込んだあとに古いほうを消すか直してください/);
  assert.equal(items[0].problems[0].key, 'kind');
  assert.ok(items[0].canImport && !items[0].checked, '印を付けて、最初はチェックを外す');
  assert.deepEqual(codes(items[1]), ['duplicate'], '有効期限も同じなら「同じものがありそう」だけ');
  assert.deepEqual(codes(items[2]), [], '初めての種類は印なし');
  assert.deepEqual(codes(items[3]), ['sameKind'], 'ファイルの中の同じ種類');
  assert.match(items[3].problems[0].message, /このファイルの中に、同じ種類/);
  const other = check([{ type: 'certificates', data: { kind: '身体障害者手帳', validUntil: '2031-03-31' } }], { db, childId: 'c2' });
  assert.deepEqual(codes(other[0]), [], 'ほかの子どもの受給者証とは比べない');
});

test('取り込み：同じ項目の子どもの情報があり、内容がちがう', () => {
  const db = DB();
  db.profile.push(
    { id: 'p2', childId: 'c1', category: '食事', label: 'ミルクの量', value: '120ml', validTo: '' },
    { id: 'p3', childId: 'c1', category: '食事', label: '食べ方', value: 'スプーン', validTo: '2025-01-01' }
  );
  const items = check([
    { type: 'profile', data: { category: '食事', label: 'ミルクの量', value: '160ml' } },
    { type: 'profile', data: { category: '食事', label: 'ミルクの量', value: '120 ml' } },
    { type: 'profile', data: { category: '食事', label: '食べ方', value: '手づかみ' } },
    { type: 'profile', data: { category: '食事', label: 'ミルクの量', value: '100ml', validTo: '2024-12-31' } },
    { type: 'profile', data: { category: '睡眠', label: '寝る時間', value: '20時' } },
    { type: 'profile', data: { category: '睡眠', label: '寝る時間', value: '21時' } },
    { type: 'profile', data: { category: '医療・服薬', label: 'ミルクの量', value: '160ml' } }
  ], { db });
  assert.deepEqual(codes(items[0]), ['sameLabel']);
  assert.match(items[0].problems[0].message, /同じ項目（食事／ミルクの量）の今の情報があります（120ml）。内容が変わったなら、取り込んだあとに古いほうの「いつまで」を入れてください/);
  assert.ok(items[0].canImport && !items[0].checked);
  assert.deepEqual(codes(items[1]), ['duplicate'], '内容も同じなら「同じものがありそう」');
  assert.deepEqual(codes(items[2]), [], '「いつまで」が入った過去の情報とは比べない');
  assert.deepEqual(codes(items[3]), [], '取り込むほうが過去の情報（いつまでが入っている）なら比べない');
  assert.deepEqual(codes(items[4]), []);
  assert.deepEqual(codes(items[5]), ['sameLabel'], 'ファイルの中の同じ項目');
  assert.deepEqual(codes(items[6]), [], '分類がちがえば別');
});

test('取り込み：手続きを、同じファイルで取り込む受給者証につなぐ', () => {
  const db = DB();
  db.certificates = db.certificates.filter((c) => c.kind !== '特別児童扶養手当');
  const recs = [
    { type: 'process', data: { templateId: 'tokuji-shotoku', deadline: '2027-08-31' } },
    { type: 'certificates', data: { kind: '特別児童扶養手当', issuerName: '〇〇市（架空）' } }
  ];
  const items = check(recs, { db });
  assert.equal(items[0].certificateId, 'import:1', '型に合う受給者証がファイルの中に1つだけなら、選んでおく（後ろにあってもよい）');
  const choices = plain(L.importCertificateChoices(items, db, 'c1', T, items[0]));
  assert.deepEqual(choices.map((c) => c.id + ':' + c.fromFile), ['import:1:true']);
  const out = L.applyImport(items, 'c1', T, TODAY, { db });
  const cert = out.find((x) => x.col === 'certificates').rec;
  const tasks = out.filter((x) => x.col === 'tasks').map((x) => x.rec);
  assert.ok(tasks.length && tasks.every((t) => t.certificateId === cert.id), '取り込んだ受給者証のIDにつなぐ');
  items[1].checked = false;
  const out2 = L.applyImport(items, 'c1', T, TODAY, { db });
  assert.ok(out2.filter((x) => x.col === 'tasks').every((t) => t.rec.certificateId === ''), '受給者証を取り込まないなら、つながない');
  // 今のデータにもあるとき（更新された証など）は、どちらか決められないので選ばない
  const both = check(recs, { db: DB() });
  assert.equal(both[0].certificateId, '');
  assert.deepEqual(plain(L.importCertificateChoices(both, DB(), 'c1', T, both[0])).map((c) => c.id), ['z1', 'import:1']);
  const onlyDb = check([recs[0]], { db: DB() });
  assert.equal(onlyDb[0].certificateId, 'z1', '今のデータに1つだけなら、それを選ぶ');
});

test('取り込み：sample/ の架空の取り込み用ファイルは、すべて取り込める', () => {
  const data = L.parseImportText(fs.readFileSync(root + 'sample/sample-import.json', 'utf8'));
  const items = L.checkImport(data, S, {}, T, { today: TODAY });
  assert.ok(items.length >= 5);
  assert.ok(items.every((x) => x.canImport));
  assert.deepEqual([...new Set(items.map((x) => x.type))].sort(), [...L.IMPORT_TYPES].sort(), 'すべての種類の例がある');
  assert.ok(!/"(number|issuerNumber)"/.test(JSON.stringify(data)), '例に番号の項目を入れない（AIへの例になるため）');
});

// ---- AIへの指示書（3-3）：定義から作られていて、古くなっていないこと ----
test('AIへの指示書：guide/ のファイルと、アプリに入れた中身が、今の定義から作ったものと同じ', () => {
  const sampleText = fs.readFileSync(root + 'src/sample-import.json', 'utf8');
  const guide = L.buildAiGuide(S, T, sampleText);
  assert.equal(fs.readFileSync(root + 'guide/AI読み取りの指示書.md', 'utf8'), guide, 'guide/AI読み取りの指示書.md が古い（npm run build をしてコミットする）');
  const embedded = 'window.__AI_GUIDE__=' + JSON.stringify(guide).replace(/</g, '\\u003c') + ';';
  for (const f of ['docs/index.html', 'gas/Index.html']) {
    assert.ok(fs.readFileSync(root + f, 'utf8').includes(embedded), f + ' の指示書が古い（npm run build をしてコミットする）');
  }
});

test('AIへの指示書：取り込める種類・項目・選択肢・過去の日付の印が、定義どおりに書いてある', () => {
  const guide = L.buildAiGuide(S, T, fs.readFileSync(root + 'src/sample-import.json', 'utf8'));
  const section = (type) => {
    const a = guide.indexOf('### `' + type + '`');
    assert.ok(a >= 0, '種類 ' + type + ' の節がある');
    const b = guide.indexOf('\n### ', a + 1);
    return guide.slice(a, b < 0 ? undefined : b);
  };
  const rows = (sec) => Object.fromEntries([...sec.matchAll(/^\| `([A-Za-z0-9]+)` \| (.*)$/gm)].map((m) => [m[1], m[2]]));
  const skip = ['visibility', 'note'];
  for (const type of L.IMPORT_TYPES) {
    const r = rows(section(type));
    const fields = type === 'process'
      ? [{ key: 'templateId', required: true }, { key: 'deadline', type: 'date', required: true }, { key: 'name' }]
      : S.collections[type].fields;
    const want = fields.filter((f) => !f.hidden && f.type !== 'ref' && f.key !== 'sourceFile' && !['number', 'issuerNumber'].includes(f.key) && !skip.includes(f.key));
    assert.deepEqual(Object.keys(r), want.map((f) => f.key), type + '：取り込める項目がすべて、定義の順に並ぶ');
    for (const f of want) {
      const row = r[f.key];
      assert.equal(row.includes('**過去の日付**'), !!f.pastOnly, `${type}.${f.key}：「過去の日付だけ」の印のある欄にだけ「過去の日付」と書く`);
      assert.equal(/\| ○ \|/.test(row), !!f.required, `${type}.${f.key}：必須の印`);
      const src = f.optionsRef ? S.options[f.optionsRef] : f.options;
      for (const o of src || []) assert.ok(row.includes(typeof o === 'string' ? o : o.value), `${type}.${f.key}：選択肢「${typeof o === 'string' ? o : o.value}」がある`);
    }
    // 指示書に書いた項目は、取り込みで捨てられない
    if (type !== 'process') {
      const data = {};
      for (const f of want) data[f.key] = f.type === 'date' ? '2020-01-01' : f.type === 'month' ? '2020-01' : 'x';
      // 「種類が…のときだけ」の欄（showIf）がすべて出る値にする（例：身体障害者手帳）
      const conds = want.filter((f) => f.showIf).sort((a, b) => a.showIf.in.length - b.showIf.in.length);
      for (const f of conds) if (!f.showIf.in.includes(data[f.showIf.key])) data[f.showIf.key] = f.showIf.in[0];
      const [it] = L.checkImport({ records: [{ type, data }] }, S, {}, T, { today: '2026-11-04' });
      assert.deepEqual(plain(it.dropped), [], type + '：指示書の項目は、取り込みで捨てられない');
    }
  }
  assert.ok(!/^\| `(number|issuerNumber|sourceFile|childId|visibility|note)` \|/m.test(guide), '番号・自動で入る項目・利用者が決める欄は、項目の表に書かない');
  for (const f of S.collections.certificates.fields.filter((x) => ['number', 'issuerNumber'].includes(x.key))) {
    assert.ok(guide.includes('**番号は書かない**') && guide.includes(f.label), '「番号は書かない」に「' + f.label + '」がある');
  }
});

test('AIへの指示書：使える templateId と例が、templates.json と sample-import.json から入っている', () => {
  const sampleText = fs.readFileSync(root + 'src/sample-import.json', 'utf8');
  const guide = L.buildAiGuide(S, T, sampleText);
  const ids = [...guide.slice(guide.indexOf('### 使える手続きの型')).matchAll(/^\| `([a-z0-9-]+)` \|/gm)].map((m) => m[1]);
  assert.deepEqual(ids.slice().sort(), T.templates.map((t) => t.id).sort(), 'templates.json の型がすべて、1回ずつ並ぶ');
  const ex = guide.slice(guide.indexOf('## 例'));
  assert.ok(ex.includes(sampleText.trim()), '例は src/sample-import.json のまま');
  const items = L.checkImport(L.parseImportText(ex), S, {}, T, { today: '2026-11-04' });
  assert.ok(items.length && items.every((x) => x.canImport), '指示書の例をそのまま貼っても取り込める');
  assert.ok(guide.includes('"format": "' + L.IMPORT_FORMAT + '"') && guide.includes('"schemaVersion": ' + S.schemaVersion), 'ファイルの形に、今の format と schemaVersion');
  assert.ok(guide.includes('AIに送りません') && guide.includes('学習に使わせない'), '使う人への注意がある');
});

console.log(`ロジックのテスト：${n}件すべて成功`);
