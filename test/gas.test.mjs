// GAS版のテスト（Googleのサービスを模擬して動かす）：node test/gas.test.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url).pathname;

// ---- スプレッドシートの模擬 ----
class Range {
  constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr, nc }); }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) {
      const row = [];
      for (let j = 0; j < this.nc; j++) row.push((this.sh.cells[this.r - 1 + i] || [])[this.c - 1 + j] ?? '');
      out.push(row);
    }
    return out;
  }
  setValues(v) {
    assert.equal(v.length, this.nr); assert.equal(v[0].length, this.nc);
    for (let i = 0; i < this.nr; i++) {
      const rr = this.r - 1 + i;
      this.sh.cells[rr] = this.sh.cells[rr] || [];
      for (let j = 0; j < this.nc; j++) {
        let x = v[i][j];
        if (typeof x === 'string' && x.startsWith("'")) x = x.slice(1); // 先頭の ' は表示されない
        this.sh.cells[rr][this.c - 1 + j] = x;
      }
    }
    return this;
  }
  setValue(x) { return this.setValues([[x]]); }
  setNumberFormat() { return this; } setFontColor() { return this; } setFontSize() { return this; }
  setFontWeight() { return this; } setBackground() { return this; }
}
class Sheet {
  constructor(name) { this.name = name; this.cells = []; }
  getLastRow() { let n = 0; this.cells.forEach((r, i) => { if (r && r.some((x) => x !== '' && x != null)) n = i + 1; }); return n; }
  getLastColumn() { let n = 0; this.cells.forEach((r) => { if (r) r.forEach((x, j) => { if (x !== '' && x != null) n = Math.max(n, j + 1); }); }); return n; }
  getMaxRows() { return Math.max(1000, this.cells.length); } getMaxColumns() { return 26; }
  insertColumnsAfter() {}
  getRange(r, c, nr = 1, nc = 1) { return new Range(this, r, c, nr, nc); }
  setFrozenRows() {} setColumnWidth() {}
}
class Spreadsheet {
  constructor() { this.sheets = [new Sheet('シート1')]; }
  getSheetByName(n) { return this.sheets.find((s) => s.name === n) || null; }
  insertSheet(n) { const s = new Sheet(n); this.sheets.push(s); return s; }
  getSheets() { return this.sheets; }
  deleteSheet(s) { this.sheets = this.sheets.filter((x) => x !== s); }
  getId() { return 'SSID'; }
  getSpreadsheetTimeZone() { return 'Asia/Tokyo'; }
}
const ss = new Spreadsheet();
const posts = [];
const triggers = [];
const files = [];
const pad = (n) => String(n).padStart(2, '0');
const ctx = {
  console, Logger: { log() {} },
  SpreadsheetApp: { getActiveSpreadsheet: () => ss, openById: () => ss, getUi: () => { throw new Error('no ui'); } },
  PropertiesService: { getScriptProperties: () => ({ _p: {}, getProperty(k) { return this._p[k]; }, setProperty(k, v) { this._p[k] = v; } }) },
  LockService: { getDocumentLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Session: { getScriptTimeZone: () => 'Asia/Tokyo' },
  Utilities: {
    getUuid: () => globalThis.crypto.randomUUID(),
    formatDate: (d, tz, f) => {
      const map = { yyyy: d.getFullYear(), MM: pad(d.getMonth() + 1), dd: pad(d.getDate()), HH: pad(d.getHours()), mm: pad(d.getMinutes()), ss: pad(d.getSeconds()) };
      if (f === 'H') return String(ctx.__hour ?? d.getHours());
      return f.replace(/'T'/, 'T').replace(/yyyy|MM|dd|HH|mm|ss/g, (m) => map[m]);
    },
    newBlob: (content, mime, name) => ({ content, mime, name, getAs() { return this; }, setName(n) { this.name = n; return this; } })
  },
  UrlFetchApp: { fetch: (url, opt) => { posts.push({ url, body: JSON.parse(opt.payload) }); return { getResponseCode: () => 204 }; } },
  ScriptApp: {
    getProjectTriggers: () => triggers.map((h) => ({ getHandlerFunction: () => h })),
    deleteTrigger: () => { triggers.splice(0, 1); },
    newTrigger: (h) => ({ timeBased: () => ({ everyHours: () => ({ create: () => triggers.push(h) }) }) }),
    getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/TEST/exec' })
  },
  DriveApp: {
    createFolder: (name) => ({ id: 'F1', getId: () => 'F1', createFile: (b) => { files.push(b); return { getUrl: () => 'https://drive/' + b.name, getName: () => b.name }; } }),
    getFolderById: () => ({ createFile: (b) => { files.push(b); return { getUrl: () => 'https://drive/' + b.name, getName: () => b.name }; } })
  },
  HtmlService: {}
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(root + 'gas/Shared.gs', 'utf8') + '\n' + fs.readFileSync(root + 'gas/Code.gs', 'utf8'), ctx);

let n = 0;
const test = (name, fn) => { fn(); n++; console.log('  ✓', name); };
const T = JSON.parse(fs.readFileSync(root + 'src/templates.json', 'utf8'));
const today = ctx.Logic.ymd();

test('初期設定でシートと定時実行ができる', () => {
  ctx.setup();
  const names = ss.sheets.map((s) => s.name);
  for (const c of Object.values(ctx.SCHEMA.collections)) assert.ok(names.includes(c.sheet), c.sheet);
  assert.ok(names.includes('_設定'));
  assert.ok(!names.includes('シート1'));
  assert.equal(triggers.join(), 'hourlyTick');
  ctx.setup(); // 2回目でも増えない
  assert.equal(triggers.join(), 'hourlyTick');
  const task = ss.getSheetByName('タスク');
  assert.equal(task.cells[0][0], 'id');
  assert.equal(task.cells[1][0], 'ID（変更しない）');
});

test('保存して読み込むと同じデータに戻る', () => {
  const sample = ctx.Logic.buildSample(today, T);
  const items = [];
  for (const [col, list] of Object.entries(sample.collections)) for (const rec of list) items.push({ col, rec });
  ctx.api_putMany(items);
  const db = ctx.api_loadAll();
  for (const [col, list] of Object.entries(sample.collections)) {
    assert.equal(db[col].length, list.length, col);
    for (const rec of list) {
      const got = db[col].find((r) => r.id === rec.id);
      for (const [k, v] of Object.entries(rec)) {
        const g = got[k];
        if (Array.isArray(v)) assert.equal(JSON.stringify(g), JSON.stringify(v), `${col}.${k}`);
        else if (v === '' && g === '') continue;
        else assert.equal(String(g), String(v), `${col}.${k}`);
      }
    }
  }
  // 配列・数・真偽値の型が戻っている
  const t = db.tasks.find((x) => x.stepNo === 2);
  assert.equal(typeof t.stepNo, 'number');
  assert.ok(Array.isArray(t.dependsOn) && t.dependsOn.length === 1);
  assert.equal(t.deleted, false);
});

test('同じIDは上書き、数式は実行されない', () => {
  const db = ctx.api_loadAll();
  const rec = { ...db.contacts[0], name: '=HYPERLINK("x")', updatedAt: new Date().toISOString() };
  ctx.api_putMany([{ col: 'contacts', rec }, { col: 'contacts', rec: { ...rec, phone: '0120' } }]);
  const db2 = ctx.api_loadAll();
  assert.equal(db2.contacts.length, db.contacts.length);
  const got = db2.contacts.find((c) => c.id === rec.id);
  assert.equal(got.name, '=HYPERLINK("x")');
  assert.equal(got.phone, '0120');
});

test('シートに手で足した列は消えない', () => {
  const sh = ss.getSheetByName('関係機関');
  const lc = sh.getLastColumn();
  sh.cells[0][lc] = 'myMemo'; sh.cells[1][lc] = '自分用メモ'; sh.cells[2][lc] = '大事';
  const db = ctx.api_loadAll();
  const id = sh.cells[2][0];
  const rec = db.contacts.find((c) => c.id === id);
  delete rec.myMemo;
  ctx.api_putMany([{ col: 'contacts', rec: { ...rec, hours: '変更' } }]);
  assert.equal(sh.cells[2][lc], '大事');
});

test('設定の保存と入力チェック', () => {
  assert.throws(() => ctx.api_saveSettings({ discordWebhookUrl: 'https://example.com/x' }));
  assert.throws(() => ctx.api_saveSettings({ digestHour: '25' }));
  const s = ctx.api_saveSettings({ discordWebhookUrl: 'https://discord.com/api/webhooks/1/abc', digestHour: '22', dayHour: '12' });
  assert.equal(s.discordWebhookUrl, 'https://discord.com/api/webhooks/1/abc');
  assert.equal(s.appUrl, 'https://script.google.com/macros/s/TEST/exec');
});

test('決めた時刻だけ、1日1回だけDiscordに送る', () => {
  posts.length = 0;
  ctx.__hour = 21; ctx.hourlyTick();
  assert.equal(posts.length, 0);
  ctx.__hour = 22; ctx.hourlyTick();
  assert.equal(posts.length, 1);
  assert.ok(posts[0].body.content.includes('今夜のまとめ'));
  assert.equal(JSON.stringify(posts[0].body.allowed_mentions), '{"parse":[]}');
  ctx.hourlyTick();
  assert.equal(posts.length, 1, '同じ日に2回送らない');
  // 昼の通知：昼タスクを今日に予定して12時
  const db = ctx.api_loadAll();
  const byId = ctx.Logic.indexById(db.tasks);
  const t = db.tasks.find((x) => x.window === 'day' && ctx.Logic.isActionable(x, byId));
  ctx.api_putMany([{ col: 'tasks', rec: { ...t, scheduledDate: today } }]);
  ctx.__hour = 12; ctx.hourlyTick();
  assert.equal(posts.length, 2);
  assert.ok(posts[1].body.content.includes(t.title));
});

test('長い通知は分けて送る', () => {
  posts.length = 0;
  ctx.postDiscord_('https://discord.com/api/webhooks/1/abc', Array.from({ length: 200 }, (_, i) => '・とても長い行その' + i).join('\n'));
  assert.ok(posts.length >= 2);
  assert.ok(posts.every((p) => p.body.content.length <= 2000));
});

test('ファイル・PDFをドライブに保存', () => {
  const r = ctx.api_saveFile('a.json', '{}', 'application/json');
  assert.equal(r.name, 'a.json');
  const p = ctx.api_savePdf('<p>x</p>', '手順書');
  assert.equal(p.name, '手順書.pdf');
});

console.log(`GAS版のテスト：${n}件すべて成功`);
