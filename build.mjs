// たすかReマインド ビルドスクリプト
// 使い方：node build.mjs
//
// src/ の元ファイルから、次のファイルを作る。
//   docs/index.html      … GitHub Pages版（この1ファイルで動く）
//   gas/Index.html       … GAS版の画面（docs/index.html と同じ中身）
//   gas/Shared.gs        … GAS版で使うデータ定義と共通ロジック
//   guide/データ定義書.md … 人が読むためのデータ定義書（schema.json から自動生成）
//   sample/sample-data.json … 架空のサンプルデータ（読み込みの確認用）
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, s) => {
  fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true });
  fs.writeFileSync(path.join(root, p), s);
  console.log('  書き出し:', p, `(${Buffer.byteLength(s).toLocaleString()} bytes)`);
};

const pkg = JSON.parse(read('package.json'));
const schema = JSON.parse(read('src/schema.json'));
const templates = JSON.parse(read('src/templates.json'));
const logic = read('src/logic.js');
const app = read('src/app.js');
const sync = read('src/drive-sync.js');
// GoogleのクライアントID：環境変数 GOOGLE_CLIENT_ID があればそれを使う（GitHub Actions の変数から渡す）
const config = JSON.parse(read('src/config.json'));
if (process.env.GOOGLE_CLIENT_ID) config.googleClientId = process.env.GOOGLE_CLIENT_ID.trim();
const css = read('src/style.css');
const tpl = read('src/index.template.html');
const build = { version: pkg.version };

// </script> が中に入っていたら、HTMLが壊れるので止める
for (const [name, s] of [['logic.js', logic], ['app.js', app], ['drive-sync.js', sync]]) {
  if (/<\/script/i.test(s)) throw new Error(`${name} に </script> が含まれています`);
}
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const data = `window.__CONFIG__=${json(config)};\nwindow.__SCHEMA__=${json(schema)};\nwindow.__TEMPLATES__=${json(templates)};\nwindow.__BUILD__=${json(build)};`;

const PAGES_HEAD = [
  '<link rel="manifest" href="manifest.webmanifest">',
  '<link rel="icon" type="image/png" href="favicon.png">',
  '<link rel="apple-touch-icon" href="apple-touch-icon.png">'
].join('\n');
const page = (head) => tpl
  .replace('<!--HEAD-->', () => head)
  .replace('/*STYLE*/', () => css)
  .replace('/*DATA*/', () => data)
  .replace('/*LOGIC*/', () => logic)
  .replace('/*SYNC*/', () => sync)
  .replace('/*APP*/', () => app);

console.log('ビルド中… v' + build.version);
write('docs/index.html', page(PAGES_HEAD));
write('gas/Index.html', page(''));
write('docs/.nojekyll', '');
write('docs/manifest.webmanifest', read('src/manifest.webmanifest'));
write('docs/sw.js', read('src/sw.js').replace('__VERSION__', build.version));
for (const f of fs.readdirSync(path.join(root, 'src/assets'))) {
  fs.copyFileSync(path.join(root, 'src/assets', f), path.join(root, 'docs', f));
  console.log('  コピー:', 'docs/' + f);
}

write('gas/Shared.gs',
  '// このファイルは build.mjs が自動で作ります。直接編集せず、src/ を直して node build.mjs を実行してください。\n' +
  `var SCHEMA = ${JSON.stringify(schema, null, 2)};\n\n` +
  `var TEMPLATES = ${JSON.stringify(templates, null, 2)};\n\n` +
  logic);

// ---- 人が読むデータ定義書 ----
const typeLabel = {
  string: '文字', text: '文章', date: '日付（YYYY-MM-DD）', datetime: '日時', number: '数', bool: 'はい／いいえ',
  select: '選択', ref: '別のデータへのつながり', refs: '別のデータへのつながり（複数）', tel: '電話番号', url: 'リンク', template: '手続きの型'
};
const opts = (f) => {
  const src = f.optionsRef ? schema.options[f.optionsRef] : f.options;
  if (!src) return '';
  return src.map((o) => (typeof o === 'string' ? o : `${o.label}（${o.value}）`)).join('／');
};
let md = `# ${schema.title}\n\n` +
  `> このファイルは \`src/schema.json\` から自動で作られます（第${schema.schemaVersion}版）。直すときは schema.json を直してください。\n\n` +
  `${schema.description}\n\n` +
  '## 定義書とは\n\n' +
  '「どんな種類のデータがあり、それぞれにどんな項目があるか」を決めた表です。画面の入力欄、スプレッドシートの列、書き出しファイルの形は、すべてこの定義から作られます。' +
  '保存先がブラウザ・スプレッドシート・将来のデータベースと変わっても、この定義が同じなら、データはそのまま移せます。\n\n' +
  '## すべてのデータに共通の項目\n\n| キー | 項目名 | 種類 | 説明 |\n|---|---|---|---|\n' +
  schema.commonFields.map((f) => `| \`${f.key}\` | ${f.label} | ${typeLabel[f.type] || f.type} | ${f.help || ''} |`).join('\n') + '\n\n';
for (const [key, c] of Object.entries(schema.collections)) {
  md += `## ${c.label}（\`${key}\`）\n\nスプレッドシートのシート名：「${c.sheet}」\n\n` + (c.description ? c.description + '\n\n' : '') +
    '| キー | 項目名 | 種類 | 必須 | 選択肢・つながり | 説明 |\n|---|---|---|---|---|---|\n' +
    c.fields.map((f) => `| \`${f.key}\` | ${f.label} | ${typeLabel[f.type] || f.type} | ${f.required ? '○' : ''} | ${f.ref ? '→ ' + schema.collections[f.ref].label : opts(f)} | ${(f.help || '') + (f.hidden ? '（画面には出さず自動で入る）' : '')} |`).join('\n') + '\n\n';
}
md += '## 書き出しファイルの形\n\n```json\n{\n  "format": "task-a-remind-export",\n  "schemaVersion": ' + schema.schemaVersion +
  ',\n  "exportedAt": "2026-09-28T13:00:00.000Z",\n  "collections": {\n    "children": [ { "id": "…", "nickname": "…" } ],\n    "tasks": [ … ]\n  }\n}\n```\n\n' +
  '## 定義を変えるときの決まり\n\n' +
  '1. 項目を**足す**のは自由（スプレッドシートは次の保存時に右端へ列が足されます）。\n' +
  '2. 項目の**名前を変える・消す・意味を変える**ときは、`schemaVersion` を1つ上げ、`src/logic.js` の `migrate()` に古い形から新しい形への変換を書く。\n' +
  '3. `key`（英字）は一度決めたら変えない。画面に出る名前（`label`）は自由に変えてよい。\n';
write('guide/データ定義書.md', md);

// ---- サンプルデータ（毎回同じ内容になるよう、日付とIDを固定する） ----
let seq = 0;
const fixedUuid = () => '00000000-0000-4000-8000-' + String(++seq).padStart(12, '0');
const ctx = { crypto: { randomUUID: fixedUuid }, console };
vm.createContext(ctx);
vm.runInContext(logic + '\nthis.Logic = Logic;', ctx);
const SAMPLE_DATE = '2026-10-01';
const STAMP = '2026-10-01T00:00:00.000Z';
const sample = ctx.Logic.buildSample(SAMPLE_DATE, templates);
for (const list of Object.values(sample.collections)) for (const r of list) { r.createdAt = STAMP; r.updatedAt = STAMP; }
const exp = ctx.Logic.makeExport(sample.collections, { name: 'task-a-remind', version: build.version, from: 'sample', sampleDate: SAMPLE_DATE });
exp.exportedAt = STAMP;
write('sample/sample-data.json', JSON.stringify(exp, null, 1) + '\n');
console.log('完了');
