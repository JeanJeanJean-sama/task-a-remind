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
  assert.throws(() => L.migrate({ format: 'tasuka-remind-export', schemaVersion: 99, collections: {} }));
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
    format: 'tasuka-remind-export', schemaVersion: 1,
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

console.log(`ロジックのテスト：${n}件すべて成功`);
