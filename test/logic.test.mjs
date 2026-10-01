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

console.log(`ロジックのテスト：${n}件すべて成功`);
