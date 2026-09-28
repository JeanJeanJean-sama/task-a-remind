/**
 * たすかReマインド GAS版（サーバー側）
 *
 * - スプレッドシートを「データベース」として使う（1シート＝1種類のデータ、1行＝1件）
 * - 1時間ごとの定時実行で、決めた時刻にDiscordへ通知する
 * - Webアプリとして、ブラウザ版と同じ画面（Index.html）を表示する
 *
 * データの形は Shared.gs の SCHEMA（＝データ定義書）に従う。ここに項目名を直接書かない。
 * 共通の処理（タスクの集計・通知の文面）は Shared.gs の Logic を使う。
 */

var APP_NAME = 'たすかReマインド';
var HEADER_ROWS = 2;            // 1行目：項目キー（プログラム用） 2行目：項目名（人が読む用）
var BASE_KEYS = ['id', 'createdAt', 'updatedAt', 'deleted'];
var BASE_LABELS = ['ID（変更しない）', '作成日時', '更新日時', '削除済み'];
var SETTINGS_SHEET = '_設定';
var OUTPUT_FOLDER_NAME = 'たすかReマインド';
var SETTINGS_DEF = [
  { key: 'discordWebhookUrl', label: 'DiscordのWebhook URL', def: '' },
  { key: 'digestHour', label: '夜のまとめ通知の時刻（0〜23時）', def: '22' },
  { key: 'dayHour', label: '昼タスクの通知時刻（0〜23時）', def: '12' },
  { key: 'certAlertDays', label: '受給者証の期限を何日前から知らせるか', def: '120' },
  { key: 'appUrl', label: '通知に載せるアプリのURL（空欄なら自動）', def: '' },
  { key: 'lastExportAt', label: '（自動）最後にデータを書き出した日時', def: '' },
  { key: 'lastDigestDate', label: '（自動）最後に夜のまとめを送った日', def: '' },
  { key: 'lastDayDate', label: '（自動）最後に昼の通知を送った日', def: '' },
  { key: 'outputFolderId', label: '（自動）PDFなどの保存先フォルダ', def: '' }
];
var CLIENT_SETTING_KEYS = ['discordWebhookUrl', 'digestHour', 'dayHour', 'certAlertDays', 'appUrl', 'lastExportAt'];

// =====================================================================
// メニュー
// =====================================================================
function onOpen() {
  SpreadsheetApp.getUi().createMenu(APP_NAME)
    .addItem('① 初期設定（最初に1回）', 'setup')
    .addItem('通知のテスト送信', 'menuTestDiscord')
    .addItem('今夜のまとめを今すぐ送る', 'menuSendDigest')
    .addSeparator()
    .addItem('Webアプリ（スマホ画面）の出し方', 'menuHelp')
    .addToUi();
}

/** 初期設定：シートを作り、1時間ごとの定時実行を登録する。何度実行しても大丈夫。 */
function setup() {
  var ss = ss_();
  Object.keys(SCHEMA.collections).forEach(function (col) {
    var sh = ss.getSheetByName(SCHEMA.collections[col].sheet) || ss.insertSheet(SCHEMA.collections[col].sheet);
    ensureHeaders_(sh, col);
  });
  ensureSettingsSheet_();
  // 最初からある空のシートを片付ける
  ['シート1', 'Sheet1'].forEach(function (n) {
    var s = ss.getSheetByName(n);
    if (s && s.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s);
  });
  // 定時実行（1時間ごと）を登録し直す
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'hourlyTick') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('hourlyTick').timeBased().everyHours(1).create();

  var msg = '初期設定が終わりました。\n\n次にやること：\n' +
    '1. シート「' + SETTINGS_SHEET + '」に、DiscordのWebhook URLを貼り付ける\n' +
    '2. メニュー「通知のテスト送信」で、Discordに届くか確かめる\n' +
    '3. スマホで使う場合は、メニュー「Webアプリ（スマホ画面）の出し方」を見る';
  try { SpreadsheetApp.getUi().alert(APP_NAME, msg, SpreadsheetApp.getUi().ButtonSet.OK); } catch (e) { Logger.log(msg); }
}

function menuTestDiscord() {
  var ui = SpreadsheetApp.getUi();
  try { api_testDiscord(); ui.alert('テスト通知を送りました。Discordを確認してください。'); }
  catch (e) { ui.alert('送れませんでした：' + e.message); }
}

function menuSendDigest() {
  var ui = SpreadsheetApp.getUi();
  try {
    var r = api_sendDigestNow();
    ui.alert(r.sent ? '今夜のまとめを送りました。' : '送る内容がありませんでした。');
  } catch (e) { ui.alert('送れませんでした：' + e.message); }
}

function menuHelp() {
  var msg = 'スマホで使う画面（Webアプリ）の出し方\n\n' +
    '1. メニュー「拡張機能」→「Apps Script」を開く\n' +
    '2. 右上の「デプロイ」→「新しいデプロイ」\n' +
    '3. 歯車アイコンで「ウェブアプリ」を選ぶ\n' +
    '4. 次のユーザーとして実行：「自分」／アクセスできるユーザー：「自分のみ」\n' +
    '5. 「デプロイ」を押し、表示されたURLをスマホで開く\n' +
    '6. スマホのブラウザで「ホーム画面に追加」する\n\n' +
    '家族も使う場合は、導入手順書の「家族と一緒に使う」を見てください。\n' +
    '※「アクセスできるユーザー：全員」と「実行：自分」を組み合わせると、URLを知った人が誰でもデータを見られてしまいます。この組み合わせにはしないでください。';
  SpreadsheetApp.getUi().alert(APP_NAME, msg, SpreadsheetApp.getUi().ButtonSet.OK);
}

// =====================================================================
// Webアプリ
// =====================================================================
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

// 画面（Index.html）から google.script.run で呼ばれる窓口。名前は api_ で始める。
function api_loadAll() { return loadAll_(); }
function api_putMany(items) { putMany_(items); return true; }
function api_getSettings() {
  var s = readSettings_();
  var out = {};
  CLIENT_SETTING_KEYS.forEach(function (k) { out[k] = s[k] || ''; });
  if (!out.appUrl) out.appUrl = serviceUrl_();
  return out;
}
function api_saveSettings(obj) {
  obj = obj || {};
  var clean = {};
  CLIENT_SETTING_KEYS.forEach(function (k) { if (obj[k] !== undefined) clean[k] = String(obj[k]).trim(); });
  if (clean.discordWebhookUrl && !/^https:\/\/(discord\.com|discordapp\.com|ptb\.discord\.com|canary\.discord\.com)\/api\/webhooks\//.test(clean.discordWebhookUrl)) {
    throw new Error('DiscordのWebhook URLの形ではありません（https://discord.com/api/webhooks/ で始まるURLです）');
  }
  ['digestHour', 'dayHour'].forEach(function (k) {
    if (clean[k] === undefined) return;
    var n = Number(clean[k]);
    if (!(n >= 0 && n <= 23 && Math.floor(n) === n)) throw new Error('時刻は0〜23の数字で入れてください');
  });
  if (clean.certAlertDays !== undefined && !(Number(clean.certAlertDays) > 0)) throw new Error('日数は1以上の数字で入れてください');
  writeSettings_(clean);
  return api_getSettings();
}
function api_testDiscord() {
  var s = readSettings_();
  postDiscord_(s.discordWebhookUrl, '✅ ' + APP_NAME + 'からのテスト通知です。この通知が見えていれば設定は完了です。');
  return true;
}
function api_sendDigestNow() {
  var today = todayStr_();
  var text = Logic.buildDigestText(loadAll_(), today, digestOpts_(readSettings_()));
  if (!text) return { sent: false };
  postDiscord_(readSettings_().discordWebhookUrl, text);
  return { sent: true };
}
function api_saveFile(name, content, mime) {
  var file = outputFolder_().createFile(Utilities.newBlob(content, mime || 'text/plain', name));
  return { url: file.getUrl(), name: file.getName() };
}
function api_savePdf(html, name) {
  var blob = Utilities.newBlob(html, 'text/html', name + '.html').getAs('application/pdf').setName(name + '.pdf');
  var file = outputFolder_().createFile(blob);
  return { url: file.getUrl(), name: file.getName() };
}

// =====================================================================
// 定時実行と通知
// =====================================================================
/** 1時間ごとに動き、設定した時刻のときだけ通知する（同じ日に2回は送らない） */
function hourlyTick() {
  var s = readSettings_();
  if (!s.discordWebhookUrl) return;
  var now = new Date();
  var hour = Number(Utilities.formatDate(now, tz_(), 'H'));
  var today = todayStr_();
  var db = null;
  try {
    if (hour === Number(s.digestHour) && s.lastDigestDate !== today) {
      db = db || loadAll_();
      var text = Logic.buildDigestText(db, today, digestOpts_(s));
      if (text) postDiscord_(s.discordWebhookUrl, text);
      writeSettings_({ lastDigestDate: today });
    }
    if (hour === Number(s.dayHour) && s.lastDayDate !== today) {
      db = db || loadAll_();
      var dayText = Logic.buildDayText(db, today, digestOpts_(s));
      if (dayText) postDiscord_(s.discordWebhookUrl, dayText);
      writeSettings_({ lastDayDate: today });
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
}

function digestOpts_(s) {
  return { appUrl: s.appUrl || serviceUrl_(), certDays: Number(s.certAlertDays) || 120 };
}

function postDiscord_(url, text) {
  if (!url) throw new Error('DiscordのWebhook URLが設定されていません（シート「' + SETTINGS_SHEET + '」またはアプリの設定画面で入力してください）');
  // Discordの1通は2000文字まで。長いときは分けて送る
  var chunks = [];
  var rest = String(text);
  while (rest.length > 1900) {
    var cut = rest.lastIndexOf('\n', 1900);
    if (cut < 500) cut = 1900;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n/, '');
  }
  chunks.push(rest);
  chunks.forEach(function (c) {
    var res = UrlFetchApp.fetch(url, {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({ username: APP_NAME, content: c, allowed_mentions: { parse: [] } })
    });
    var code = res.getResponseCode();
    if (code < 200 || code >= 300) throw new Error('Discordへの送信に失敗しました（' + code + '）。Webhook URLを確認してください');
  });
}

// =====================================================================
// スプレッドシート＝データベース
// =====================================================================
var SS_CACHE_ = null;
var TZ_CACHE_ = null;
function ss_() {
  if (SS_CACHE_) return SS_CACHE_;
  var ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { ss = null; }
  var props = PropertiesService.getScriptProperties();
  if (ss) {
    try { if (props.getProperty('SPREADSHEET_ID') !== ss.getId()) props.setProperty('SPREADSHEET_ID', ss.getId()); } catch (e) { /* 無視 */ }
  } else {
    var id = props.getProperty('SPREADSHEET_ID');
    if (!id) throw new Error('スプレッドシートが見つかりません。スプレッドシートのメニューから「初期設定」を実行してください');
    ss = SpreadsheetApp.openById(id);
  }
  SS_CACHE_ = ss;
  return ss;
}
function tz_() {
  if (TZ_CACHE_) return TZ_CACHE_;
  try { TZ_CACHE_ = ss_().getSpreadsheetTimeZone() || Session.getScriptTimeZone(); } catch (e) { TZ_CACHE_ = 'Asia/Tokyo'; }
  return TZ_CACHE_;
}
function todayStr_() { return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'); }
function serviceUrl_() {
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}

function keysOf_(col) {
  return BASE_KEYS.concat(SCHEMA.collections[col].fields.map(function (f) { return f.key; }));
}
function labelsOf_(col) {
  return BASE_LABELS.concat(SCHEMA.collections[col].fields.map(function (f) { return f.label; }));
}
function fieldMap_(col) {
  var m = {};
  SCHEMA.collections[col].fields.forEach(function (f) { m[f.key] = f; });
  return m;
}
function readHeader_(sh) {
  var lc = sh.getLastColumn();
  if (lc < 1 || sh.getLastRow() < 1) return [];
  return sh.getRange(1, 1, 1, lc).getValues()[0].map(function (v) { return String(v || ''); });
}

/** 見出しを作る。定義に項目が増えていたら、右端に列を足す（既存のデータは消さない）。 */
function ensureHeaders_(sh, col) {
  var keys = keysOf_(col);
  var labels = labelsOf_(col);
  var header = readHeader_(sh);
  while (header.length && !header[header.length - 1]) header.pop();
  if (!header.length) {
    sh.getRange(1, 1, 2, keys.length).setValues([keys, labels]);
    header = keys.slice();
  } else {
    var missing = [];
    keys.forEach(function (k, i) { if (header.indexOf(k) < 0) missing.push(i); });
    if (missing.length) {
      var start = header.length + 1;
      sh.getRange(1, start, 2, missing.length).setValues([
        missing.map(function (i) { return keys[i]; }),
        missing.map(function (i) { return labels[i]; })
      ]);
      header = header.concat(missing.map(function (i) { return keys[i]; }));
    }
  }
  var n = header.length;
  if (sh.getMaxColumns() < n) sh.insertColumnsAfter(sh.getMaxColumns(), n - sh.getMaxColumns());
  sh.getRange(1, 1, sh.getMaxRows(), n).setNumberFormat('@'); // 日付などを勝手に変換させない
  sh.getRange(1, 1, 1, n).setFontColor('#999999').setFontSize(8);
  sh.getRange(2, 1, 1, n).setFontWeight('bold').setBackground('#e2f1ec');
  sh.setFrozenRows(HEADER_ROWS);
  return header;
}

function fromCell_(fd, key, v) {
  if (v instanceof Date) {
    v = Utilities.formatDate(v, tz_(), (fd && fd.type === 'date') ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm:ss");
  }
  var s = v == null ? '' : String(v);
  if (key === 'deleted') return s === 'TRUE' || s === 'true';
  if (!fd) return s;
  if (fd.type === 'number') return s === '' ? '' : Number(s);
  if (fd.type === 'refs') return s ? s.split(',').map(function (x) { return x.trim(); }).filter(String) : [];
  if (fd.type === 'bool') return s === 'TRUE' || s === 'true';
  return s;
}

function toCell_(fd, key, v) {
  if (v == null) return '';
  if (Array.isArray(v)) return v.join(',');
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  var s = String(v);
  if (/^[=+]/.test(s)) s = "'" + s; // 数式として実行されないようにする
  return s;
}

function loadAll_() {
  var ss = ss_();
  var out = {};
  Object.keys(SCHEMA.collections).forEach(function (col) {
    out[col] = [];
    var sh = ss.getSheetByName(SCHEMA.collections[col].sheet);
    if (!sh) return;
    var lr = sh.getLastRow(), lc = sh.getLastColumn();
    if (lr <= HEADER_ROWS || lc < 1) return;
    var vals = sh.getRange(1, 1, lr, lc).getValues();
    var header = vals[0].map(function (v) { return String(v || ''); });
    var fm = fieldMap_(col);
    for (var r = HEADER_ROWS; r < vals.length; r++) {
      var row = vals[r];
      var o = {};
      for (var i = 0; i < header.length; i++) {
        var k = header[i];
        if (!k) continue;
        o[k] = fromCell_(fm[k], k, row[i]);
      }
      if (o.id) out[col].push(o);
    }
  });
  return out;
}

/** items: [{col, rec}] を、IDが同じ行は上書き、なければ追加する */
function putMany_(items) {
  if (!items || !items.length) return;
  var lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    var ss = ss_();
    var byCol = {};
    items.forEach(function (it) {
      if (!it || !SCHEMA.collections[it.col]) throw new Error('不明なデータの種類です：' + (it && it.col));
      if (!it.rec || !it.rec.id) throw new Error('IDのない記録は保存できません');
      (byCol[it.col] = byCol[it.col] || []).push(it.rec);
    });
    Object.keys(byCol).forEach(function (col) {
      var def = SCHEMA.collections[col];
      var sh = ss.getSheetByName(def.sheet) || ss.insertSheet(def.sheet);
      var header = readHeader_(sh);
      var keys = keysOf_(col);
      if (!header.length || keys.some(function (k) { return header.indexOf(k) < 0; })) header = ensureHeaders_(sh, col);
      while (header.length && !header[header.length - 1]) header.pop();
      var fm = fieldMap_(col);
      var known = {};
      keys.forEach(function (k) { known[k] = true; });
      var hasExtra = header.some(function (k) { return k && !known[k]; });
      var idCol = header.indexOf('id') + 1;
      var lr = sh.getLastRow();
      var ids = lr > HEADER_ROWS ? sh.getRange(HEADER_ROWS + 1, idCol, lr - HEADER_ROWS, 1).getValues().map(function (r) { return String(r[0]); }) : [];
      var appendRows = [];
      var appendIndex = {};
      byCol[col].forEach(function (rec) {
        var idx = ids.indexOf(String(rec.id));
        var existing = null;
        if (idx >= 0 && hasExtra) existing = sh.getRange(HEADER_ROWS + 1 + idx, 1, 1, header.length).getValues()[0];
        var rowVals = header.map(function (k, i) {
          if (!k) return '';
          if (!known[k] && !(k in rec)) return existing ? existing[i] : ''; // シートに手で足した列は残す
          return toCell_(fm[k], k, rec[k]);
        });
        if (idx >= 0) {
          sh.getRange(HEADER_ROWS + 1 + idx, 1, 1, header.length).setNumberFormat('@').setValues([rowVals]);
        } else if (appendIndex[rec.id] !== undefined) {
          appendRows[appendIndex[rec.id]] = rowVals;
        } else {
          appendIndex[rec.id] = appendRows.length;
          appendRows.push(rowVals);
        }
      });
      if (appendRows.length) {
        var start = Math.max(sh.getLastRow(), HEADER_ROWS) + 1;
        sh.getRange(start, 1, appendRows.length, header.length).setNumberFormat('@').setValues(appendRows);
      }
    });
  } finally {
    lock.releaseLock();
  }
}

// =====================================================================
// 設定（シート「_設定」に保存。コピーした人ごとに別々になる）
// =====================================================================
function ensureSettingsSheet_() {
  var ss = ss_();
  var sh = ss.getSheetByName(SETTINGS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SETTINGS_SHEET);
    sh.getRange(1, 1, 1, 3).setValues([['key', '値', '説明']]).setFontWeight('bold').setBackground('#e2f1ec');
    sh.setFrozenRows(1);
    sh.setColumnWidth(2, 360);
    sh.setColumnWidth(3, 320);
  }
  var existing = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
  var add = SETTINGS_DEF.filter(function (d) { return existing.indexOf(d.key) < 0; }).map(function (d) { return [d.key, d.def, d.label]; });
  if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, 3).setNumberFormat('@').setValues(add);
  return sh;
}
function readSettings_() {
  var out = {};
  SETTINGS_DEF.forEach(function (d) { out[d.key] = d.def; });
  var sh = ss_().getSheetByName(SETTINGS_SHEET);
  if (!sh || sh.getLastRow() < 2) return out;
  sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) {
    var k = String(r[0]);
    if (k) out[k] = r[1] instanceof Date ? Utilities.formatDate(r[1], tz_(), 'yyyy-MM-dd') : String(r[1] == null ? '' : r[1]).trim();
  });
  return out;
}
function writeSettings_(obj) {
  var sh = ensureSettingsSheet_();
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]); });
  Object.keys(obj).forEach(function (k) {
    var i = rows.indexOf(k);
    if (i >= 0) sh.getRange(i + 2, 2).setNumberFormat('@').setValue(toCell_(null, k, obj[k]));
  });
}

function outputFolder_() {
  var s = readSettings_();
  if (s.outputFolderId) {
    try { return DriveApp.getFolderById(s.outputFolderId); } catch (e) { /* 消されていたら作り直す */ }
  }
  var folder = DriveApp.createFolder(OUTPUT_FOLDER_NAME);
  writeSettings_({ outputFolderId: folder.getId() });
  return folder;
}
