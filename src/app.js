/*
 * たすかReマインド 画面
 * 同じこのファイルが、GitHub Pages版（端末に保存）とGAS版（スプレッドシートに保存）の両方で動く。
 * 保存先の違いは「保存アダプタ」（createLocalStore / createGasStore）だけに閉じ込めている。
 * 将来は createApiStore（独自サーバー用）を足せば、画面はそのまま使える。
 */
(function () {
  'use strict';

  var SCHEMA = window.__SCHEMA__;
  var TEMPLATES = window.__TEMPLATES__;
  var BUILD = window.__BUILD__ || {};
  var COLS = Object.keys(SCHEMA.collections);
  var L = Logic;
  var IS_GAS = typeof google !== 'undefined' && google && google.script && google.script.run;

  // =====================================================================
  // 保存アダプタ（ここだけが保存先を知っている）
  //   loadAll()            -> { collectionName: [records] }
  //   putMany([{col,rec}]) -> 保存
  //   getSettings() / saveSettings(obj)
  //   任意: saveFile(name, content, mime), savePdf(html, name), testNotify()
  // =====================================================================
  function createLocalStore() {
    var KEY = 'tasuka-remind/v1/data';
    var mem = null;
    function load() {
      if (mem) return mem;
      var raw = null;
      try { raw = window.localStorage.getItem(KEY); } catch (e) { raw = null; }
      try { mem = raw ? JSON.parse(raw) : null; } catch (e) { mem = null; }
      if (!mem || typeof mem !== 'object') mem = {};
      mem.collections = mem.collections || {};
      mem.settings = mem.settings || {};
      COLS.forEach(function (c) { if (!Array.isArray(mem.collections[c])) mem.collections[c] = []; });
      return mem;
    }
    function persist() {
      try { window.localStorage.setItem(KEY, JSON.stringify(mem)); }
      catch (e) { throw new Error('この端末に保存できませんでした。ブラウザの設定（プライベートモードなど）や空き容量を確認してください'); }
    }
    return {
      kind: 'local',
      label: 'この端末に保存',
      loadAll: function () { return Promise.resolve(JSON.parse(JSON.stringify(load().collections))); },
      putMany: function (items) {
        return new Promise(function (resolve) {
          var d = load();
          items.forEach(function (it) {
            var list = d.collections[it.col];
            var i = list.findIndex(function (r) { return r.id === it.rec.id; });
            if (i >= 0) list[i] = it.rec; else list.push(it.rec);
          });
          persist();
          resolve(true);
        });
      },
      getSettings: function () { return Promise.resolve(Object.assign({}, load().settings)); },
      saveSettings: function (s) {
        return new Promise(function (resolve) {
          var d = load();
          d.settings = Object.assign(d.settings, s);
          persist();
          resolve(d.settings);
        });
      }
    };
  }

  function gasCall(name) {
    var args = Array.prototype.slice.call(arguments, 1);
    return new Promise(function (resolve, reject) {
      var runner = google.script.run.withSuccessHandler(resolve).withFailureHandler(function (e) {
        reject(e instanceof Error ? e : new Error(String((e && e.message) || e)));
      });
      runner[name].apply(runner, args);
    });
  }

  function createGasStore() {
    return {
      kind: 'gas',
      label: 'スプレッドシートに保存',
      loadAll: function () { return gasCall('api_loadAll'); },
      putMany: function (items) { return gasCall('api_putMany', items); },
      getSettings: function () { return gasCall('api_getSettings'); },
      saveSettings: function (s) { return gasCall('api_saveSettings', s); },
      saveFile: function (name, content, mime) { return gasCall('api_saveFile', name, content, mime); },
      savePdf: function (html, name) { return gasCall('api_savePdf', html, name); },
      testNotify: function () { return gasCall('api_testDiscord'); },
      sendDigestNow: function () { return gasCall('api_sendDigestNow'); }
    };
  }

  // =====================================================================
  // 状態
  // =====================================================================
  var S = {
    store: null, db: {}, settings: {}, ready: false, error: '',
    childId: null, tab: 'today', infoTab: 'profile', careId: null,
    openProcess: {}, showHistory: {}, showDone: false,
    form: null, print: null, toast: '', notice: null, busy: false
  };
  var UI_KEY = 'tasuka-remind/v1/ui';
  function loadUi() { try { return JSON.parse(window.localStorage.getItem(UI_KEY)) || {}; } catch (e) { return {}; } }
  function saveUi() { try { window.localStorage.setItem(UI_KEY, JSON.stringify({ childId: S.childId, tab: S.tab })); } catch (e) { /* 保存できなくても動く */ } }

  // =====================================================================
  // データ操作
  // =====================================================================
  function all(col) { return L.alive(S.db[col]); }
  function mine(col) { return all(col).filter(function (r) { return r.childId === S.childId; }); }
  function get(col, id) { return (S.db[col] || []).find(function (r) { return r.id === id; }); }
  function today() { return L.ymd(); }
  function stamp(rec) {
    var now = L.nowIso();
    if (!rec.id) { rec.id = L.uuid(); rec.createdAt = now; }
    rec.updatedAt = now;
    if (rec.deleted === undefined) rec.deleted = false;
    return rec;
  }
  function saveMany(items, opts) {
    opts = opts || {};
    items.forEach(function (it) {
      if (!opts.keepStamp) stamp(it.rec);
      var list = S.db[it.col];
      var i = list.findIndex(function (r) { return r.id === it.rec.id; });
      if (i >= 0) list[i] = it.rec; else list.push(it.rec);
    });
    render();
    return S.store.putMany(items.map(function (it) { return { col: it.col, rec: it.rec }; }))
      .catch(function (e) { showNotice('保存に失敗しました', errMsg(e) + '\n画面を再読み込みして、もう一度お試しください。'); throw e; });
  }
  function save(col, rec) { return saveMany([{ col: col, rec: rec }]); }
  function softDelete(col, rec) { return save(col, Object.assign({}, rec, { deleted: true })); }
  function errMsg(e) { return (e && e.message) || String(e); }

  // =====================================================================
  // 表示の部品
  // =====================================================================
  function h(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function br(s) { return h(s).replace(/\n/g, '<br>'); }
  function btn(label, act, data, cls, aria) {
    var attrs = aria ? ' aria-label="' + h(aria) + '"' : '';
    Object.keys(data || {}).forEach(function (k) { attrs += ' data-' + k + '="' + h(data[k]) + '"'; });
    return '<button type="button" class="btn ' + (cls || '') + '" data-act="' + act + '"' + attrs + '>' + label + '</button>';
  }
  function optLabel(field, value) {
    var opts = fieldOptions(field);
    for (var i = 0; i < opts.length; i++) if (opts[i].value === value) return opts[i].label;
    return value || '';
  }
  function fieldOptions(field) {
    var src = field.optionsRef ? SCHEMA.options[field.optionsRef] : (field.options || []);
    return src.map(function (o) { return typeof o === 'string' ? { value: o, label: o } : o; });
  }
  function fieldDef(col, key) {
    return SCHEMA.collections[col].fields.find(function (f) { return f.key === key; });
  }
  function visBadge(v) {
    if (!v) return '';
    var cls = v === 'family' ? 'vis-family' : v === 'all' ? 'vis-all' : 'vis-supporter';
    return '<span class="pill ' + cls + '">' + h(optLabel(fieldDef('profile', 'visibility'), v)) + '</span>';
  }
  function duePill(t) {
    var label = L.dueLabel(t, today());
    if (!label) return '';
    var d = L.diffDays(today(), t.dueDate);
    var cls = d < 0 ? 'pill-late' : d <= 7 ? 'pill-soon' : '';
    return '<span class="pill ' + cls + '">' + h(label) + '</span>';
  }
  function empty(text) { return '<p class="empty">' + text + '</p>'; }
  function card(title, body, extra) {
    return '<section class="card">' + (title ? '<div class="card-head"><h2>' + title + '</h2>' + (extra || '') + '</div>' : '') + body + '</section>';
  }

  // =====================================================================
  // 画面の組み立て
  // =====================================================================
  var TABS = [
    { id: 'today', label: '今日', icon: '☀' },
    { id: 'process', label: '手続き', icon: '✓' },
    { id: 'info', label: '子どもの情報', icon: '♡' },
    { id: 'care', label: '手順書', icon: '✎' },
    { id: 'settings', label: '設定', icon: '⚙' }
  ];

  function render() {
    var root = document.getElementById('app');
    if (!root) return;
    if (!S.ready) {
      root.innerHTML = S.error
        ? '<div class="boot"><h1>読み込めませんでした</h1><p>' + br(S.error) + '</p>' + btn('もう一度読み込む', 'reload', {}, 'primary') + '</div>'
        : '<div class="boot"><div class="spinner"></div><p>読み込み中…</p></div>';
      return;
    }
    var overlays = (S.notice ? noticeView() : '') + (S.toast ? '<div class="toast" role="status">' + h(S.toast) + '</div>' : '');
    if (S.print) { root.innerHTML = printView() + overlays; return; }

    var children = all('children');
    var main;
    if (!children.length && S.tab !== 'settings') {
      main = onboardingView();
    } else {
      if (children.length && !children.some(function (c) { return c.id === S.childId; })) S.childId = children[0].id;
      main = ({ today: viewToday, process: viewProcess, info: viewInfo, care: viewCare, settings: viewSettings })[S.tab]();
    }
    root.innerHTML = headerView(children) + '<main class="main">' + main + '</main>' + navView() +
      (S.form ? formView() : '') + overlays;
  }

  function headerView(children) {
    var who = '';
    if (children.length > 1) {
      who = '<select class="child-select" data-change="child" aria-label="子どもを切り替え">' +
        children.map(function (c) { return '<option value="' + h(c.id) + '"' + (c.id === S.childId ? ' selected' : '') + '>' + h(c.nickname) + '</option>'; }).join('') + '</select>';
    } else if (children.length === 1) {
      who = '<span class="child-name">' + h(children[0].nickname) + '</span>';
    }
    return '<header class="top"><div class="brand">たすか<span>Re</span>マインド</div><div class="top-right">' + who +
      '<span class="store-badge" title="データの保存先">' + (S.store.kind === 'gas' ? 'Google' : 'この端末') + '</span></div></header>';
  }

  function navView() {
    return '<nav class="tabs" aria-label="メニュー">' + TABS.map(function (t) {
      return '<button type="button" data-act="tab" data-tab="' + t.id + '" class="' + (S.tab === t.id ? 'on' : '') + '"' +
        (S.tab === t.id ? ' aria-current="page"' : '') + '><span class="ico" aria-hidden="true">' + t.icon + '</span>' + t.label + '</button>';
    }).join('') + '</nav>';
  }

  function onboardingView() {
    return card('はじめに',
      '<p>「たすかReマインド」は、子どもの情報を1か所にまとめて、<b>手順書・サポートブック</b>と<b>手続きのToDo</b>を作るアプリです。</p>' +
      '<p class="muted">データの保存先：' + h(S.store.label) + (S.store.kind === 'local' ? '（外部には送信されません）' : '') + '</p>' +
      '<div class="stack">' +
      btn('子どもを登録して始める', 'newRec', { col: 'children' }, 'primary block') +
      btn('サンプル（架空のデータ）で試す', 'loadSample', {}, 'block') +
      '<label class="btn block file-btn">書き出したデータを読み込む<input type="file" accept=".json,application/json" data-change="import" hidden></label>' +
      '</div>');
  }

  // ---------------------------------------------------------------- 今日
  function viewToday() {
    var t0 = today();
    var s = L.summarize(S.db, t0, { childId: S.childId, certDays: Number(S.settings.certAlertDays) || 120 });
    var html = '<p class="date-line">' + h(L.fmtDate(t0)) + '</p>';

    html += card('今夜できること',
      s.night.length ? s.night.map(taskItem).join('') : empty('いまは、夜にやることはありません。'));

    var day = s.dayToday.concat(s.dayTomorrow, s.dayLater);
    var dayBody = '';
    if (s.dayUnscheduled.length) {
      dayBody += '<p class="sub-head">昼にやる日を決めましょう</p>' + s.dayUnscheduled.map(taskItem).join('');
    }
    if (day.length) dayBody += '<p class="sub-head">予定</p>' + day.map(taskItem).join('');
    html += card('昼にやること（電話・窓口）', dayBody || empty('いまは、昼にやることはありません。'));

    if (s.certs.length) {
      html += card('期限が近い受給者証・手帳', s.certs.map(function (a) {
        var c = a.cert;
        return '<div class="item"><div class="item-main"><div class="item-title">' + h(c.name || c.kind) + '</div>' +
          '<div class="item-sub">有効期限 ' + h(L.fmtDate(c.validUntil)) + '　' +
          '<span class="pill ' + (a.daysLeft < 30 ? 'pill-late' : 'pill-soon') + '">' + (a.daysLeft < 0 ? (-a.daysLeft) + '日過ぎています' : 'あと' + a.daysLeft + '日') + '</span></div></div>' +
          '<div class="item-actions">' + btn('更新の手続きを始める', 'startProcess', { cert: c.id }, 'primary sm') + '</div></div>';
      }).join(''));
    }
    return html;
  }

  function processSteps(t) {
    if (!t.processId) return [];
    return all('tasks').filter(function (x) { return x.processId === t.processId; });
  }

  function taskItem(t) {
    var t0 = today();
    var steps = processSteps(t);
    var sub = [];
    if (t.processName) sub.push(h(t.processName) + (steps.length ? '（' + t.stepNo + '/' + steps.length + '）' : ''));
    if (t.assignee) sub.push('担当：' + h(t.assignee));
    var c = t.contactId && get('contacts', t.contactId);
    var contact = '';
    if (c && !c.deleted) {
      contact = '<div class="item-contact">' + h(c.name) +
        (c.phone ? ' <a href="tel:' + h(c.phone.replace(/[^0-9+]/g, '')) + '">☎ ' + h(c.phone) + '</a>' : '') +
        (c.hours ? ' <span class="muted">（' + h(c.hours) + '）</span>' : '') + '</div>';
    }
    var actions = '';
    if (t.window === 'day') {
      if (!t.scheduledDate) {
        actions += btn('明日の昼にやる', 'schedule', { id: t.id }, 'sm');
      } else {
        var when = t.scheduledDate <= t0 ? '今日の昼' : L.fmtMD(t.scheduledDate) + 'の昼';
        sub.push('<b>' + when + 'にやる</b>');
        actions += btn('日を変える', 'editRec', { col: 'tasks', id: t.id }, 'sm ghost');
      }
    }
    actions += btn('完了', 'done', { id: t.id }, 'primary sm');
    return '<div class="item task">' +
      '<div class="item-main"><button type="button" class="linklike item-title" data-act="editRec" data-col="tasks" data-id="' + h(t.id) + '">' + h(t.title) + '</button>' +
      '<div class="item-sub">' + sub.join('　') + ' ' + duePill(t) + '</div>' + contact +
      (t.script ? '<div class="item-note">' + br(t.script) + '</div>' : '') + '</div>' +
      '<div class="item-actions">' + actions + '</div></div>';
  }

  function completeTask(id) {
    var t = get('tasks', id);
    if (!t) return;
    var rec = Object.assign({}, t, { status: 'done', doneAt: today() });
    saveMany([{ col: 'tasks', rec: rec }]).then(function () {
      var byId = L.indexById(S.db.tasks);
      var next = all('tasks').find(function (x) { return (x.dependsOn || []).indexOf(id) >= 0 && L.isActionable(x, byId); });
      toast(next ? '完了！次は「' + next.title + '」です' : '完了しました');
      var restTodo = t.processId && all('tasks').some(function (x) { return x.processId === t.processId && x.status === 'todo'; });
      if (t.certificateId && t.processId && !restTodo) {
        var c = get('certificates', t.certificateId);
        if (c && !c.deleted) openForm('certificates', c, { hint: '手続きが終わりました。新しい有効期限に直しておくと、次の更新もお知らせできます。' });
      }
    });
  }

  // ---------------------------------------------------------------- 手続き
  function processGroups() {
    var groups = {};
    var order = [];
    mine('tasks').forEach(function (t) {
      var k = t.processId || ('single:' + t.id);
      if (!groups[k]) { groups[k] = { key: k, name: t.processName || t.title, single: !t.processId, tasks: [] }; order.push(k); }
      groups[k].tasks.push(t);
    });
    return order.map(function (k) {
      var g = groups[k];
      g.tasks.sort(function (a, b) { return (Number(a.stepNo) || 0) - (Number(b.stepNo) || 0); });
      g.done = g.tasks.filter(function (t) { return t.status !== 'todo'; }).length;
      g.active = g.done < g.tasks.length;
      g.due = g.tasks.reduce(function (m, t) { return t.dueDate && t.dueDate > m ? t.dueDate : m; }, '');
      return g;
    });
  }

  function viewProcess() {
    var groups = processGroups();
    var active = groups.filter(function (g) { return g.active; }).sort(function (a, b) { return (a.due || '9').localeCompare(b.due || '9'); });
    var done = groups.filter(function (g) { return !g.active; });
    var byId = L.indexById(S.db.tasks);
    var html = '<div class="toolbar">' + btn('＋ 手続きを始める', 'startProcess', {}, 'primary') + btn('＋ タスクを1つ追加', 'newRec', { col: 'tasks' }) + '</div>';
    html += card('進行中の手続き', active.length ? active.map(function (g) { return processCard(g, byId); }).join('') :
      empty('進行中の手続きはありません。受給者証・手帳を登録すると、期限が近づいたときに「今日」の画面でお知らせします。'));
    if (done.length) {
      html += card('終わった手続き（' + done.length + '）', S.showDone ? done.map(function (g) { return processCard(g, byId); }).join('') : '',
        btn(S.showDone ? '閉じる' : '表示する', 'toggleDone', {}, 'sm ghost'));
    }
    html += '<p class="muted small">' + h(TEMPLATES.caution) + '</p>';
    return html;
  }

  function processCard(g, byId) {
    var open = !!S.openProcess[g.key];
    var pct = Math.round(g.done / g.tasks.length * 100);
    var next = g.tasks.find(function (t) { return L.isActionable(t, byId); });
    var html = '<div class="proc">' +
      '<button type="button" class="proc-head" data-act="toggleProcess" data-key="' + h(g.key) + '" aria-expanded="' + open + '">' +
      '<span class="proc-name">' + h(g.name) + '</span><span class="muted">' + g.done + '/' + g.tasks.length + '</span></button>' +
      '<div class="bar"><span style="width:' + pct + '%"></span></div>' +
      (next && !open ? '<div class="item-sub">次：' + h(next.title) + ' ' + duePill(next) + '</div>' : '');
    if (open) {
      html += '<ol class="steps">' + g.tasks.map(function (t) {
        var st = t.status === 'done' ? 'done' : t.status === 'skipped' ? 'skip' : L.isActionable(t, byId) ? 'now' : 'wait';
        var mark = { done: '✓', skip: '－', now: '●', wait: '○' }[st];
        return '<li class="step ' + st + '"><span class="mark" aria-hidden="true">' + mark + '</span>' +
          '<button type="button" class="linklike" data-act="editRec" data-col="tasks" data-id="' + h(t.id) + '">' + h(t.title) + '</button>' +
          '<span class="step-meta">' + (t.window === 'day' ? '<span class="pill">昼</span>' : '') +
          (t.status === 'done' ? '<span class="muted small">' + h(L.fmtMD(t.doneAt)) + ' 完了</span>' : (t.dueDate ? '<span class="muted small">目安 ' + h(L.fmtMD(t.dueDate)) + '</span>' : '')) +
          '</span>' + (st === 'now' ? btn('完了', 'done', { id: t.id }, 'primary sm') : '') + '</li>';
      }).join('') + '</ol>';
      html += '<div class="row-end">' + btn('この手続きを削除', 'deleteProcess', { key: g.key }, 'sm ghost danger') + '</div>';
    }
    return html + '</div>';
  }

  function startProcessForm(f) {
    var certs = mine('certificates');
    var tplOpts = TEMPLATES.templates.map(function (t) {
      return '<option value="' + h(t.id) + '"' + (t.id === f.templateId ? ' selected' : '') + '>' + h(t.name) + '</option>';
    }).join('');
    var certOpts = '<option value="">（なし）</option>' + certs.map(function (c) {
      return '<option value="' + h(c.id) + '"' + (c.id === f.certificateId ? ' selected' : '') + '>' + h((c.name || c.kind) + (c.validUntil ? '（期限 ' + L.fmtMD(c.validUntil) + '）' : '')) + '</option>';
    }).join('');
    var tpl = L.findTemplate(TEMPLATES, f.templateId) || TEMPLATES.templates[0];
    return sheet('手続きを始める',
      '<form data-form="startProcess" class="fields">' +
      '<label class="field"><span class="lbl">手続きの型 <b class="req">必須</b></span><select name="templateId" data-change="tplPreview">' + tplOpts + '</select></label>' +
      '<div class="preview"><p class="small muted">この型の工程：</p><ol class="small">' + tpl.steps.map(function (s) {
        return '<li>' + h(s.title) + (s.window === 'day' ? ' <span class="pill">昼</span>' : '') + '</li>';
      }).join('') + '</ol></div>' +
      '<label class="field"><span class="lbl">関係する受給者証・手帳</span><select name="certificateId">' + certOpts + '</select></label>' +
      '<label class="field"><span class="lbl">期限（有効期限など） <b class="req">必須</b></span><input type="date" name="deadline" required value="' + h(f.deadline || '') + '">' +
      '<span class="help">この日から逆算して、工程ごとの目安日を決めます。</span></label>' +
      '<label class="field"><span class="lbl">手続きの名前</span><input type="text" name="name" placeholder="' + h(tpl.name) + '" value="' + h(f.name || '') + '"></label>' +
      '<p class="small muted">' + h(TEMPLATES.caution) + '</p>' +
      '<div class="sheet-actions"><span class="spacer"></span>' + btn('やめる', 'closeForm', {}, 'ghost') + '<button type="submit" class="btn primary">始める</button></div>' +
      '</form>');
  }

  function submitStartProcess(form) {
    var fd = new FormData(form);
    var tpl = L.findTemplate(TEMPLATES, fd.get('templateId'));
    var deadline = fd.get('deadline');
    if (!tpl || !deadline) return;
    var certId = fd.get('certificateId') || '';
    var cert = certId && get('certificates', certId);
    var byKind = {};
    mine('contacts').forEach(function (c) { if (!byKind[c.kind]) byKind[c.kind] = c.id; });
    var tasks = L.planProcess(tpl, deadline, {
      childId: S.childId, certificateId: certId, today: today(), contactIdsByKind: byKind,
      processName: String(fd.get('name') || '').trim() || (cert ? (cert.name || cert.kind) + 'の更新' : tpl.name)
    });
    S.form = null;
    S.tab = 'process';
    S.openProcess[tasks[0].processId] = true;
    saveMany(tasks.map(function (t) { return { col: 'tasks', rec: t }; })).then(function () { toast('手続きを登録しました。今やれる工程は「今日」に出ます'); });
  }

  // ---------------------------------------------------------------- 子どもの情報
  var INFO_TABS = [
    { id: 'profile', label: '基本情報' }, { id: 'contacts', label: '関係機関' },
    { id: 'certificates', label: '受給者証・手帳' }, { id: 'visits', label: '受診・入院' }
  ];
  function viewInfo() {
    var seg = '<div class="seg" role="tablist">' + INFO_TABS.map(function (t) {
      return '<button type="button" role="tab" data-act="infoTab" data-tab="' + t.id + '" class="' + (S.infoTab === t.id ? 'on' : '') + '" aria-selected="' + (S.infoTab === t.id) + '">' + t.label + '</button>';
    }).join('') + '</div>';
    var body = ({ profile: infoProfile, contacts: infoContacts, certificates: infoCerts, visits: infoVisits })[S.infoTab]();
    return seg + body;
  }

  function infoProfile() {
    var items = mine('profile');
    var cats = fieldOptions(fieldDef('profile', 'category')).map(function (o) { return o.value; });
    var html = '<div class="toolbar">' + btn('＋ 項目を追加', 'newRec', { col: 'profile' }, 'primary') + btn('サポートブックを印刷', 'print', { type: 'book', audience: 'supporter' }) + '</div>';
    var any = false;
    cats.forEach(function (cat) {
      var inCat = items.filter(function (p) { return p.category === cat; });
      if (!inCat.length) return;
      any = true;
      var current = inCat.filter(function (p) { return !p.validTo; });
      var labels = [];
      inCat.forEach(function (p) { if (labels.indexOf(p.label) < 0) labels.push(p.label); });
      var body = labels.map(function (lb) {
        var cur = current.filter(function (p) { return p.label === lb; });
        var past = inCat.filter(function (p) { return p.label === lb && p.validTo; }).sort(function (a, b) { return String(b.validTo).localeCompare(String(a.validTo)); });
        var key = cat + '/' + lb;
        var html2 = cur.map(function (p) {
          return '<button type="button" class="kv" data-act="editRec" data-col="profile" data-id="' + h(p.id) + '"><span class="k">' + h(p.label) + '</span><span class="v">' + br(p.value) + '</span>' + visBadge(p.visibility) + '</button>';
        }).join('');
        if (!cur.length) html2 += '<div class="kv past-only"><span class="k">' + h(lb) + '</span><span class="v muted">（今の情報はありません）</span></div>';
        if (past.length) {
          html2 += '<button type="button" class="history-toggle" data-act="toggleHistory" data-key="' + h(key) + '">' + (S.showHistory[key] ? '履歴を閉じる' : '履歴 ' + past.length + '件') + '</button>';
          if (S.showHistory[key]) {
            html2 += past.map(function (p) {
              return '<button type="button" class="kv past" data-act="editRec" data-col="profile" data-id="' + h(p.id) + '"><span class="k">' + h((p.validFrom ? L.fmtMD(p.validFrom) : '') + '〜' + L.fmtMD(p.validTo)) + '</span><span class="v">' + br(p.value) + '</span></button>';
            }).join('');
          }
        }
        return html2;
      }).join('');
      html += card(h(cat), body, btn('＋', 'newRec', { col: 'profile', category: cat }, 'sm ghost icon-btn'));
    });
    if (!any) html += card('', empty('まだ項目がありません。「＋ 項目を追加」から、アレルギー・好きなこと・落ち着く方法などを登録しましょう。'));
    return html;
  }

  function infoContacts() {
    var list = mine('contacts');
    var kinds = fieldOptions(fieldDef('contacts', 'kind')).map(function (o) { return o.value; });
    list.sort(function (a, b) { return kinds.indexOf(a.kind) - kinds.indexOf(b.kind); });
    return '<div class="toolbar">' + btn('＋ 関係機関を追加', 'newRec', { col: 'contacts' }, 'primary') + '</div>' +
      card('', list.length ? list.map(function (c) {
        return '<div class="item"><div class="item-main"><button type="button" class="linklike item-title" data-act="editRec" data-col="contacts" data-id="' + h(c.id) + '">' + h(c.name) + '</button>' +
          '<div class="item-sub"><span class="pill">' + h(c.kind) + '</span> ' + (c.person ? h(c.person) + '　' : '') + (c.hours ? '<span class="muted">' + h(c.hours) + '</span>' : '') + '</div></div>' +
          (c.phone ? '<div class="item-actions"><a class="btn sm" href="tel:' + h(c.phone.replace(/[^0-9+]/g, '')) + '">☎ ' + h(c.phone) + '</a></div>' : '') + '</div>';
      }).join('') : empty('病院・療育・相談支援・役所などを登録すると、手続きのタスクに電話番号が表示されます。'));
  }

  function infoCerts() {
    var list = mine('certificates').sort(function (a, b) { return (a.validUntil || '9').localeCompare(b.validUntil || '9'); });
    var t0 = today();
    return '<div class="toolbar">' + btn('＋ 受給者証・手帳を追加', 'newRec', { col: 'certificates' }, 'primary') + '</div>' +
      card('', list.length ? list.map(function (c) {
        var d = c.validUntil ? L.diffDays(t0, c.validUntil) : null;
        var pill = d === null ? '' : '<span class="pill ' + (d < 30 ? 'pill-late' : d < 120 ? 'pill-soon' : '') + '">' + (d < 0 ? (-d) + '日過ぎ' : 'あと' + d + '日') + '</span>';
        var running = all('tasks').some(function (t) { return t.certificateId === c.id && t.status === 'todo'; });
        return '<div class="item"><div class="item-main"><button type="button" class="linklike item-title" data-act="editRec" data-col="certificates" data-id="' + h(c.id) + '">' + h(c.name || c.kind) + '</button>' +
          '<div class="item-sub">' + (c.name ? h(c.kind) + '　' : '') + (c.grade ? h(c.grade) + '　' : '') + (c.validUntil ? '有効期限 ' + h(L.fmtDate(c.validUntil)) + ' ' + pill : '有効期限：未入力') + '</div></div>' +
          '<div class="item-actions">' + (running ? '<span class="pill">更新手続き中</span>' : btn('更新の手続き', 'startProcess', { cert: c.id }, 'sm')) + '</div></div>';
      }).join('') : empty('受給者証・手帳・医療証と有効期限を登録すると、期限が近づいたときにお知らせします。'));
  }

  function infoVisits() {
    var list = mine('visits').sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    return '<div class="toolbar">' + btn('＋ 記録を追加', 'newRec', { col: 'visits' }, 'primary') + '</div>' +
      card('', list.length ? '<ol class="timeline">' + list.map(function (v) {
        var days = v.endDate ? L.diffDays(v.date, v.endDate) + 1 : 0;
        return '<li><button type="button" class="tl" data-act="editRec" data-col="visits" data-id="' + h(v.id) + '">' +
          '<span class="tl-date">' + h(L.fmtDate(v.date)) + (v.endDate ? '〜' + h(L.fmtMD(v.endDate)) + '（' + days + '日間）' : '') + '</span>' +
          '<span class="tl-body"><span class="pill">' + h(v.kind) + '</span> ' + h([v.facility, v.department].filter(Boolean).join(' ')) + '<br>' + br(v.summary) + '</span></button></li>';
      }).join('') + '</ol>' : empty('受診のあとに、スマホの音声入力で「今日どうだったか」を話して記録できます。'));
  }

  // ---------------------------------------------------------------- 手順書
  var SECTION_GUIDE = {
    'いつ・どれだけ': '実施する時間、1回の量、食事が取れなかった時の追加のルールは？',
    '準備': '手洗い、使う物、先にしておくことは？',
    '実施前の確認': '正しくできる状態かを、どう確かめますか？ 確かめられない時は？',
    '実施': '速さ・間隔・分け方は？',
    '中断の判断': 'どんな時に止めますか？ 再開の目安は？',
    '実施後': '片付け・洗浄と、その理由は？',
    'いつもと違う時': '体調が悪い時、吐いた時、抜けた時はどうしていますか？',
    '緊急時と連絡先': '家族に連絡する目安、救急車を呼ぶ目安、搬送先の希望、業者の連絡先は？'
  };
  function sections() { return fieldOptions(fieldDef('careSteps', 'section')).map(function (o) { return o.value; }); }
  function stepsOf(pid) {
    return all('careSteps').filter(function (s) { return s.procedureId === pid; }).sort(function (a, b) { return (Number(a.order) || 0) - (Number(b.order) || 0); });
  }

  function viewCare() {
    if (S.careId) {
      var p = get('careProcedures', S.careId);
      if (p && !p.deleted) return careDetail(p);
      S.careId = null;
    }
    var list = mine('careProcedures').sort(function (a, b) { return (a.status === '終了') - (b.status === '終了'); });
    var html = '<div class="toolbar">' + btn('＋ 手順書を作る', 'newRec', { col: 'careProcedures' }, 'primary') + '</div>';
    html += card('医療的ケア手順書', list.length ? list.map(function (p) {
      var steps = stepsOf(p.id);
      var filled = sections().filter(function (sec) { return steps.some(function (s) { return s.section === sec; }); }).length;
      return '<button type="button" class="item item-btn" data-act="openCare" data-id="' + h(p.id) + '"><div class="item-main"><div class="item-title">' + h(p.title) + '</div>' +
        '<div class="item-sub"><span class="pill ' + (p.status === '終了' ? '' : 'pill-ok') + '">' + h(p.status || '実施中') + '</span> 手順 ' + steps.length + '件・項目 ' + filled + '/' + sections().length + '</div></div><span class="chev" aria-hidden="true">›</span></button>';
    }).join('') : empty('保育園・祖父母・ヘルパーさんに渡す「ケアのやり方」を、決まった型に沿って作れます。'));
    return html;
  }

  function careDetail(p) {
    var steps = stepsOf(p.id);
    var html = '<div class="toolbar">' + btn('‹ 一覧へ', 'closeCare', {}, 'ghost') + '<span class="spacer"></span>' + btn('印刷・PDF', 'print', { type: 'care', id: p.id }) + '</div>';
    html += card(h(p.title),
      '<dl class="dl">' +
      '<dt>状態</dt><dd>' + h(p.status || '実施中') + (p.endedOn ? '（' + h(L.fmtDate(p.endedOn)) + ' 終了）' : '') + '</dd>' +
      (p.startedOn ? '<dt>開始日</dt><dd>' + h(L.fmtDate(p.startedOn)) + '</dd>' : '') +
      (p.reason ? '<dt>開始の理由</dt><dd>' + br(p.reason) + '</dd>' : '') +
      (p.equipment ? '<dt>使う器具</dt><dd>' + br(p.equipment) + '</dd>' : '') +
      '<dt>見せてよい範囲</dt><dd>' + visBadge(p.visibility) + '</dd></dl>',
      btn('編集', 'editRec', { col: 'careProcedures', id: p.id }, 'sm ghost'));
    sections().forEach(function (sec) {
      var list = steps.filter(function (s) { return s.section === sec; });
      var body = list.length ? '<ol class="care-steps">' + list.map(function (s, i) {
        return '<li><button type="button" class="care-step" data-act="editRec" data-col="careSteps" data-id="' + h(s.id) + '">' +
          '<span class="care-text">' + br(s.text) + '</span>' +
          (s.criteria ? '<span class="care-criteria">判断の目安：' + br(s.criteria) + '</span>' : '') + '</button>' +
          (s.photoUrl ? '<a class="small" href="' + h(s.photoUrl) + '" target="_blank" rel="noopener">写真・動画を見る</a>' : '') +
          '<span class="mover">' + (i > 0 ? btn('↑', 'moveStep', { id: s.id, dir: -1 }, 'sm ghost', '上へ') : '') + (i < list.length - 1 ? btn('↓', 'moveStep', { id: s.id, dir: 1 }, 'sm ghost', '下へ') : '') + '</span></li>';
      }).join('') + '</ol>' : '<div class="guide-q">まだありません。<br><b>' + h(SECTION_GUIDE[sec] || '') + '</b></div>';
      html += card(h(sec), body, btn('＋ 追加', 'newStep', { pid: p.id, section: sec }, 'sm ghost'));
    });
    html += '<p class="muted small">手順書は、主治医の指示にもとづいて家族が書いた内容を整理して表示するものです。アプリが医療的な判断をすることはありません。</p>';
    return html;
  }

  function moveStep(id, dir) {
    var s = get('careSteps', id);
    if (!s) return;
    var list = stepsOf(s.procedureId).filter(function (x) { return x.section === s.section; });
    var i = list.findIndex(function (x) { return x.id === id; });
    var j = i + dir;
    if (j < 0 || j >= list.length) return;
    // 並び順を振り直してから入れ替える（順番の重複を防ぐ）
    var base = Math.min.apply(null, list.map(function (x) { return Number(x.order) || 0; }));
    var arr = list.slice();
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    var items = [];
    arr.forEach(function (x, k) {
      var o = base + k;
      if (Number(x.order) !== o) items.push({ col: 'careSteps', rec: Object.assign({}, x, { order: o }) });
    });
    if (items.length) saveMany(items);
  }

  function nextStepOrder(pid, section) {
    var secIdx = sections().indexOf(section);
    var list = stepsOf(pid).filter(function (s) { return s.section === section; });
    var max = list.reduce(function (m, s) { return Math.max(m, Number(s.order) || 0); }, (secIdx + 1) * 100);
    return max + 1;
  }

  // ---------------------------------------------------------------- 設定・データ
  function viewSettings() {
    var html = '';
    var children = all('children');
    html += card('子ども', (children.length ? children.map(function (c) {
      return '<div class="item"><div class="item-main"><div class="item-title">' + h(c.nickname) + (c.id === S.childId ? ' <span class="pill pill-ok">表示中</span>' : '') + '</div>' +
        '<div class="item-sub">' + h([c.prefecture, c.municipality].filter(Boolean).join(' ')) + '</div></div><div class="item-actions">' +
        (c.id !== S.childId ? btn('切り替え', 'switchChild', { id: c.id }, 'sm') : '') + btn('編集', 'editRec', { col: 'children', id: c.id }, 'sm ghost') + '</div></div>';
    }).join('') : empty('まだ登録されていません。')) + '<div class="row-end">' + btn('＋ 子どもを追加', 'newRec', { col: 'children' }, 'sm') + '</div>');

    if (S.store.kind === 'gas') {
      var st = S.settings;
      var hours = function (name, v) {
        var o = '';
        for (var i = 0; i < 24; i++) o += '<option value="' + i + '"' + (String(v) === String(i) ? ' selected' : '') + '>' + i + '時</option>';
        return '<select name="' + name + '">' + o + '</select>';
      };
      html += card('Discordへの通知',
        '<form data-form="settings" class="fields">' +
        '<label class="field"><span class="lbl">DiscordのWebhook URL</span><input type="url" name="discordWebhookUrl" value="' + h(st.discordWebhookUrl || '') + '" placeholder="https://discord.com/api/webhooks/..." autocomplete="off">' +
        '<span class="help">Discordのチャンネル設定 →「連携サービス」→「ウェブフック」で作ったURLを貼り付けます。</span></label>' +
        '<div class="field-row"><label class="field"><span class="lbl">夜のまとめ</span>' + hours('digestHour', st.digestHour) + '</label>' +
        '<label class="field"><span class="lbl">昼タスクの通知</span>' + hours('dayHour', st.dayHour) + '</label></div>' +
        '<label class="field"><span class="lbl">期限を何日前から知らせるか</span><input type="number" name="certAlertDays" min="7" max="365" value="' + h(st.certAlertDays || 120) + '"></label>' +
        '<label class="field"><span class="lbl">通知に載せるアプリのURL</span><input type="url" name="appUrl" value="' + h(st.appUrl || '') + '"><span class="help">空欄なら、このWebアプリのURLを自動で使います。</span></label>' +
        '<p class="small muted">通知には、手続き名・期限・連絡先だけを載せ、病名や医療の内容は載せません。</p>' +
        '<div class="sheet-actions">' + btn('テスト送信', 'testNotify', {}, 'ghost') + btn('今夜のまとめを今すぐ送る', 'sendDigestNow', {}, 'ghost') + '<span class="spacer"></span><button type="submit" class="btn primary">保存</button></div></form>');
    } else {
      html += card('通知（この端末版）',
        '<p>この版には通知を送るしくみがありません。代わりに、ToDoを<b>カレンダー用ファイル</b>で書き出せます。iPhoneやGoogleのカレンダーに取り込むと、前日の22時に通知されます。</p>' +
        '<p class="small muted">Discordへの毎晩の通知や家族との共有を使うには、Googleスプレッドシート版に移ります（データを書き出して読み込むだけで移れます）。</p>' +
        btn('カレンダー用ファイル（.ics）を書き出す', 'exportIcs', {}, 'block'));
    }

    html += card('印刷・PDF',
      '<div class="stack">' + btn('サポートブック（支援者向け）', 'print', { type: 'book', audience: 'supporter' }, 'block') +
      btn('サポートブック（家族用・すべて）', 'print', { type: 'book', audience: 'family' }, 'block') + '</div>' +
      '<p class="small muted">支援者向けには、「家族のみ」にした情報と、受給者証の番号・受診の記録は載りません。</p>');

    var last = S.settings.lastExportAt;
    html += card('データ',
      (S.store.kind === 'local' ? '<p class="warn">データはこの端末のブラウザの中だけにあります。iPhoneでは「ホーム画面に追加」して使い、<b>ときどき書き出してバックアップ</b>してください。</p>' : '') +
      '<p class="small muted">最後に書き出した日時：' + (last ? h(new Date(last).toLocaleString('ja-JP')) : 'まだありません') + '</p>' +
      '<div class="stack">' + btn('データを書き出す（バックアップ・移行用）', 'exportJson', {}, 'block') +
      '<label class="btn block file-btn">書き出したデータを読み込む<input type="file" accept=".json,application/json" data-change="import" hidden></label>' +
      btn('サンプル（架空のデータ）を追加する', 'loadSample', {}, 'block ghost') + '</div>');

    html += card('このアプリについて',
      '<dl class="dl"><dt>保存先</dt><dd>' + h(S.store.label) + '</dd><dt>アプリ</dt><dd>' + h(BUILD.version || '') + '</dd><dt>データ定義</dt><dd>第' + h(SCHEMA.schemaVersion) + '版</dd></dl>' +
      '<p class="small muted">手続きの型はサンプルです。実際の手順は自治体の案内で確認してください。このアプリは医療的な判断や助言を行いません。</p>');
    return html;
  }

  // =====================================================================
  // 入力フォーム（データ定義から自動で作る）
  // =====================================================================
  function openForm(col, rec, opts) {
    opts = opts || {};
    S.form = { kind: 'record', col: col, rec: Object.assign({}, rec || {}), isNew: !(rec && rec.id), hint: opts.hint || '', title: opts.title };
    render();
    var first = document.querySelector('.sheet input:not([type=hidden]), .sheet textarea, .sheet select');
    if (first && S.form.isNew) { try { first.focus({ preventScroll: true }); } catch (e) { /* 無視 */ } }
  }
  function newRecord(col, extra) {
    var rec = {};
    SCHEMA.collections[col].fields.forEach(function (f) { if (f.default !== undefined) rec[f.key] = f.default; });
    if (col !== 'children' && col !== 'careSteps') rec.childId = S.childId;
    return Object.assign(rec, extra || {});
  }

  function sheet(title, inner) {
    return '<div class="backdrop" data-act="closeForm"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="' + h(title) + '">' +
      '<div class="sheet-head"><h2>' + h(title) + '</h2>' + btn('×', 'closeForm', {}, 'ghost icon-btn', '閉じる') + '</div>' + inner + '</div>';
  }

  function formView() {
    var f = S.form;
    if (f.kind === 'startProcess') return startProcessForm(f);
    var def = SCHEMA.collections[f.col];
    var rec = f.rec;
    var title = f.title || (def.label + (f.isNew ? 'を追加' : 'を編集'));
    var fields = def.fields.filter(function (fd) { return !fd.hidden; });
    var inner = '<form data-form="record" class="fields">' + (f.hint ? '<p class="hint">' + h(f.hint) + '</p>' : '') +
      fields.map(function (fd) { return fieldInput(fd, rec[fd.key], f.col); }).join('');
    if (f.col === 'profile' && !f.isNew && !rec.validTo) {
      inner += '<label class="check"><input type="checkbox" name="__asHistory" checked> 内容を変えたときは、前の内容を履歴として残す</label>';
    }
    inner += '<div class="sheet-actions">' + (!f.isNew ? btn('削除', 'deleteRec', {}, 'ghost danger') : '') +
      '<span class="spacer"></span>' + btn('やめる', 'closeForm', {}, 'ghost') + '<button type="submit" class="btn primary">保存</button></div></form>';
    return sheet(title, inner);
  }

  function fieldInput(fd, v, col) {
    var val = v == null ? '' : v;
    var req = fd.required ? ' required' : '';
    var name = ' name="' + h(fd.key) + '"';
    var input;
    switch (fd.type) {
      case 'text':
        input = '<textarea' + name + req + ' rows="3">' + h(val) + '</textarea>';
        break;
      case 'date':
        input = '<input type="date"' + name + req + ' value="' + h(val) + '">';
        break;
      case 'number':
        input = '<input type="number" inputmode="numeric"' + name + req + ' value="' + h(val) + '">';
        break;
      case 'tel':
        input = '<input type="tel"' + name + req + ' value="' + h(val) + '">';
        break;
      case 'url':
        input = '<input type="url"' + name + req + ' value="' + h(val) + '" placeholder="https://">';
        break;
      case 'select':
        input = '<select' + name + req + '>' + (fd.required ? '' : '<option value="">（未選択）</option>') +
          fieldOptions(fd).map(function (o) { return '<option value="' + h(o.value) + '"' + (o.value === val ? ' selected' : '') + '>' + h(o.label) + '</option>'; }).join('') + '</select>';
        break;
      case 'ref':
        var target = SCHEMA.collections[fd.ref];
        var list = fd.ref === 'children' ? all('children') : mine(fd.ref);
        input = '<select' + name + '><option value="">（なし）</option>' + list.map(function (r) {
          return '<option value="' + h(r.id) + '"' + (r.id === val ? ' selected' : '') + '>' + h(r[target.display] || r.kind || r.id) + '</option>';
        }).join('') + '</select>';
        break;
      case 'template':
        input = '<select' + name + '><option value="">（なし）</option>' + TEMPLATES.templates.map(function (t) {
          return '<option value="' + h(t.id) + '"' + (t.id === val ? ' selected' : '') + '>' + h(t.name) + '</option>';
        }).join('') + '</select>';
        break;
      default:
        input = '<input type="text"' + name + req + ' value="' + h(val) + '">';
    }
    return '<label class="field"><span class="lbl">' + h(fd.label) + (fd.required ? ' <b class="req">必須</b>' : '') + '</span>' + input +
      (fd.help ? '<span class="help">' + h(fd.help) + '</span>' : '') + '</label>';
  }

  function submitRecord(form) {
    var f = S.form;
    var def = SCHEMA.collections[f.col];
    var fd = new FormData(form);
    var rec = Object.assign({}, f.rec);
    def.fields.forEach(function (field) {
      if (field.hidden || !fd.has(field.key)) return;
      var v = String(fd.get(field.key) || '').trim();
      rec[field.key] = field.type === 'number' ? (v === '' ? '' : Number(v)) : v;
    });
    var items = [];
    if (f.col === 'profile' && !f.isNew && fd.get('__asHistory') && rec.value !== f.rec.value && !f.rec.validTo) {
      // 前の内容は「いつまで」を入れて残し、新しい行を作る（1つの事実の履歴）
      var t0 = today();
      var old = Object.assign({}, f.rec, { validTo: t0 });
      var fresh = Object.assign({}, rec, { validFrom: (rec.validFrom && rec.validFrom !== f.rec.validFrom) ? rec.validFrom : t0, validTo: '' });
      delete fresh.id; delete fresh.createdAt;
      items.push({ col: 'profile', rec: old }, { col: 'profile', rec: fresh });
    } else {
      items.push({ col: f.col, rec: rec });
    }
    if (f.col === 'tasks' && rec.status === 'done' && !rec.doneAt) rec.doneAt = today();
    if (f.col === 'tasks' && rec.status === 'todo') rec.doneAt = '';
    S.form = null;
    saveMany(items).then(function () {
      toast('保存しました');
    });
    var saved = items[items.length - 1].rec;
    if (f.isNew && f.col === 'children') { S.childId = saved.id; saveUi(); }
    if (f.isNew && f.col === 'careProcedures') { S.careId = saved.id; S.tab = 'care'; }
    render();
  }

  function deleteCurrent() {
    var f = S.form;
    if (!f || f.isNew) return;
    var def = SCHEMA.collections[f.col];
    if (!window.confirm('この' + def.label + 'を削除しますか？')) return;
    var items = [{ col: f.col, rec: Object.assign({}, f.rec, { deleted: true }) }];
    if (f.col === 'careProcedures') {
      stepsOf(f.rec.id).forEach(function (s) { items.push({ col: 'careSteps', rec: Object.assign({}, s, { deleted: true }) }); });
      S.careId = null;
    }
    if (f.col === 'children') {
      COLS.forEach(function (c) {
        if (c === 'children' || c === 'careSteps') return;
        all(c).filter(function (r) { return r.childId === f.rec.id; }).forEach(function (r) { items.push({ col: c, rec: Object.assign({}, r, { deleted: true }) }); });
      });
      if (S.childId === f.rec.id) S.childId = null;
    }
    S.form = null;
    saveMany(items).then(function () { toast('削除しました'); });
  }

  // =====================================================================
  // 印刷・PDF
  // =====================================================================
  function printView() {
    var p = S.print;
    var doc = p.type === 'care' ? careDoc(get('careProcedures', p.id)) : bookDoc(p.audience);
    return '<div class="print-bar no-print">' + btn('‹ 戻る', 'closePrint', {}, 'ghost') + '<span class="spacer"></span>' +
      (S.store.savePdf ? btn('PDFをドライブに保存', 'savePdf', {}, '') : '') + btn('印刷する', 'doPrint', {}, 'primary') + '</div>' +
      '<div class="print-hint no-print">「印刷する」→ 送信先で「PDFに保存」を選ぶと、PDFにできます。</div>' +
      '<article class="doc" id="doc">' + doc + '</article>';
  }

  function allowed(v, audience) {
    if (audience === 'family') return true;
    return v !== 'family';
  }

  function contactsTable(list) {
    if (!list.length) return '';
    return '<table class="doc-table"><tr><th>種類</th><th>名前</th><th>電話</th><th>受付時間</th></tr>' + list.map(function (c) {
      return '<tr><td>' + h(c.kind) + '</td><td>' + h(c.name) + (c.person ? '<br>' + h(c.person) : '') + '</td><td>' + h(c.phone) + '</td><td>' + h(c.hours) + '</td></tr>';
    }).join('') + '</table>';
  }

  function careBody(p) {
    var steps = stepsOf(p.id);
    var html = '<table class="doc-table">' +
      '<tr><th>ケア</th><td>' + h(p.title) + '（' + h(p.status || '実施中') + '）</td></tr>' +
      (p.startedOn ? '<tr><th>開始日</th><td>' + h(L.fmtDate(p.startedOn)) + '</td></tr>' : '') +
      (p.reason ? '<tr><th>開始の理由</th><td>' + br(p.reason) + '</td></tr>' : '') +
      (p.equipment ? '<tr><th>使う器具・規格</th><td>' + br(p.equipment) + '</td></tr>' : '') + '</table>';
    sections().forEach(function (sec) {
      var list = steps.filter(function (s) { return s.section === sec; });
      if (!list.length) return;
      html += '<h3>' + h(sec) + '</h3><ol>' + list.map(function (s) {
        return '<li>' + br(s.text) + (s.criteria ? '<div class="doc-criteria">判断の目安：' + br(s.criteria) + '</div>' : '') + '</li>';
      }).join('') + '</ol>';
    });
    return html;
  }

  function childOf(id) { return get('children', id) || {}; }

  function careDoc(p) {
    if (!p) return '<p>手順書が見つかりません。</p>';
    var child = childOf(p.childId);
    var steps = stepsOf(p.id);
    var updated = steps.concat([p]).reduce(function (m, s) { return String(s.updatedAt || '') > m ? String(s.updatedAt) : m; }, '');
    var emergency = mine('contacts').filter(function (c) { return ['病院', '訪問看護', '医療機器業者'].indexOf(c.kind) >= 0; });
    return '<h1>' + h(child.nickname || '') + '　' + h(p.title) + ' の手順書</h1>' +
      '<p class="doc-meta">最終更新：' + h(updated ? L.fmtDate(L.ymd(new Date(updated))) : '') + '　作成：家族</p>' +
      careBody(p) +
      (emergency.length ? '<h3>連絡先</h3>' + contactsTable(emergency) : '') +
      '<p class="doc-foot">この手順書は、主治医の指示にもとづいて家族が作成したものです。判断に迷うときは、家族または主治医に連絡してください。</p>';
  }

  function bookDoc(audience) {
    var child = childOf(S.childId);
    var t0 = today();
    var html = '<h1>' + h(child.nickname || '') + ' のサポートブック</h1>' +
      '<p class="doc-meta">' + h(L.fmtDate(t0)) + ' 作成　' + (audience === 'family' ? '家族用（すべての情報）' : '支援者向け') + '</p>';
    var items = mine('profile').filter(function (p) { return !p.validTo && allowed(p.visibility, audience); });
    fieldOptions(fieldDef('profile', 'category')).forEach(function (o) {
      var list = items.filter(function (p) { return p.category === o.value; });
      if (!list.length) return;
      html += '<h2>' + h(o.value) + '</h2><table class="doc-table">' + list.map(function (p) {
        return '<tr><th>' + h(p.label) + '</th><td>' + br(p.value) + '</td></tr>';
      }).join('') + '</table>';
    });
    var procs = mine('careProcedures').filter(function (p) { return p.status !== '終了' && allowed(p.visibility, audience); });
    if (procs.length) {
      html += '<h2>医療的ケア</h2>' + procs.map(function (p) { return '<div class="doc-block"><h3 class="doc-sub">' + h(p.title) + '</h3>' + careBody(p) + '</div>'; }).join('');
    }
    var contacts = mine('contacts');
    if (contacts.length) html += '<h2>関係機関</h2>' + contactsTable(contacts);
    if (audience === 'family') {
      var certs = mine('certificates');
      if (certs.length) {
        html += '<h2>受給者証・手帳・医療証</h2><table class="doc-table"><tr><th>種類</th><th>番号</th><th>区分・等級</th><th>有効期限</th></tr>' + certs.map(function (c) {
          return '<tr><td>' + h(c.name || c.kind) + '</td><td>' + h(c.number) + '</td><td>' + h(c.grade) + '</td><td>' + h(L.fmtDate(c.validUntil)) + '</td></tr>';
        }).join('') + '</table>';
      }
      var visits = mine('visits').sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
      if (visits.length) {
        html += '<h2>受診・入院の記録</h2><table class="doc-table"><tr><th>日付</th><th>種類</th><th>病院・機関</th><th>内容</th></tr>' + visits.map(function (v) {
          return '<tr><td>' + h(L.fmtDate(v.date)) + (v.endDate ? '〜' + h(L.fmtMD(v.endDate)) : '') + '</td><td>' + h(v.kind) + '</td><td>' + h([v.facility, v.department].filter(Boolean).join(' ')) + '</td><td>' + br(v.summary) + '</td></tr>';
        }).join('') + '</table>';
      }
    }
    html += '<p class="doc-foot">このサポートブックは家族が作成したものです。内容について分からないことは、家族にお問い合わせください。</p>';
    return html;
  }

  function printFileName() {
    var p = S.print;
    var child = childOf(S.childId);
    if (p.type === 'care') { var pr = get('careProcedures', p.id); return (child.nickname || '') + '_' + (pr ? pr.title : '手順書') + '_手順書_' + today(); }
    return (child.nickname || '') + '_サポートブック_' + (p.audience === 'family' ? '家族用' : '支援者向け') + '_' + today();
  }

  // =====================================================================
  // 書き出し・読み込み
  // =====================================================================
  function download(name, content, mime) {
    var blob = new Blob([content], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function saveOut(name, content, mime) {
    if (S.store.saveFile) {
      return S.store.saveFile(name, content, mime).then(function (r) {
        showNotice('Googleドライブに保存しました', 'フォルダ「たすかReマインド」に「' + r.name + '」を保存しました。', r.url);
      });
    }
    download(name, content, mime);
    return Promise.resolve();
  }

  function exportJson() {
    var data = L.makeExport(S.db, { name: 'tasuka-remind', version: BUILD.version || '', from: S.store.kind });
    saveOut('たすかReマインド_データ_' + today() + '.json', JSON.stringify(data, null, 1), 'application/json').then(function () {
      S.settings.lastExportAt = L.nowIso();
      S.store.saveSettings({ lastExportAt: S.settings.lastExportAt }).catch(function () { /* 記録できなくても問題なし */ });
      render();
    }).catch(function (e) { showNotice('書き出せませんでした', errMsg(e)); });
  }

  function importFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = L.migrate(JSON.parse(String(reader.result)));
        var changed = L.mergeImport(S.db, data.collections);
        if (!changed.length) { toast('新しいデータはありませんでした'); return; }
        saveMany(changed, { keepStamp: true }).then(function () { toast(changed.length + '件を読み込みました'); });
      } catch (e) {
        showNotice('読み込めませんでした', errMsg(e));
      }
    };
    reader.readAsText(file);
  }

  function loadSample() {
    var s = L.buildSample(today(), TEMPLATES);
    var items = [];
    Object.keys(s.collections).forEach(function (col) { s.collections[col].forEach(function (rec) { items.push({ col: col, rec: rec }); }); });
    S.childId = s.childId;
    S.tab = 'today';
    saveUi();
    saveMany(items, { keepStamp: true }).then(function () { toast('サンプルを追加しました（架空のデータです）'); });
  }

  // =====================================================================
  // 小さな表示
  // =====================================================================
  var toastTimer = null;
  function toast(msg) {
    S.toast = msg;
    render();
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { S.toast = ''; render(); }, 3200);
  }
  function showNotice(title, body, url) { S.notice = { title: title, body: body, url: url }; render(); }
  function noticeView() {
    var n = S.notice;
    return '<div class="backdrop" data-act="closeNotice"></div><div class="sheet notice" role="alertdialog" aria-label="' + h(n.title) + '"><div class="sheet-head"><h2>' + h(n.title) + '</h2></div>' +
      '<p>' + br(n.body) + '</p>' + (n.url ? '<p><a class="btn primary block" href="' + h(n.url) + '" target="_blank" rel="noopener">開く</a></p>' : '') +
      '<div class="sheet-actions"><span class="spacer"></span>' + btn('閉じる', 'closeNotice', {}, '') + '</div></div>';
  }

  // =====================================================================
  // 操作
  // =====================================================================
  var ACTIONS = {
    reload: function () { window.location.reload(); },
    tab: function (d) { S.tab = d.tab; S.form = null; if (d.tab !== 'care') S.careId = null; saveUi(); render(); window.scrollTo(0, 0); },
    infoTab: function (d) { S.infoTab = d.tab; render(); },
    newRec: function (d) { openForm(d.col, newRecord(d.col, d.category ? { category: d.category } : null)); },
    editRec: function (d) { var r = get(d.col, d.id); if (r) openForm(d.col, r); },
    closeForm: function () { S.form = null; render(); },
    deleteRec: deleteCurrent,
    done: function (d) { completeTask(d.id); },
    schedule: function (d) {
      var t = get('tasks', d.id);
      if (!t) return;
      save('tasks', Object.assign({}, t, { scheduledDate: L.addDays(today(), 1) })).then(function () { toast('明日の昼にお知らせします'); });
    },
    startProcess: function (d) {
      var cert = d.cert && get('certificates', d.cert);
      var tplId = (cert && cert.templateId) || '';
      if (!tplId && cert) {
        var match = TEMPLATES.templates.find(function (t) { return (t.certificateKinds || []).indexOf(cert.kind) >= 0; });
        tplId = match ? match.id : 'generic';
      }
      S.form = { kind: 'startProcess', templateId: tplId || TEMPLATES.templates[0].id, certificateId: cert ? cert.id : '', deadline: cert ? cert.validUntil : '' };
      render();
    },
    toggleProcess: function (d) { S.openProcess[d.key] = !S.openProcess[d.key]; render(); },
    toggleDone: function () { S.showDone = !S.showDone; render(); },
    deleteProcess: function (d) {
      var g = processGroups().find(function (x) { return x.key === d.key; });
      if (!g || !window.confirm('「' + g.name + '」の工程をすべて削除しますか？')) return;
      saveMany(g.tasks.map(function (t) { return { col: 'tasks', rec: Object.assign({}, t, { deleted: true }) }; })).then(function () { toast('削除しました'); });
    },
    toggleHistory: function (d) { S.showHistory[d.key] = !S.showHistory[d.key]; render(); },
    openCare: function (d) { S.careId = d.id; render(); window.scrollTo(0, 0); },
    closeCare: function () { S.careId = null; render(); },
    newStep: function (d) { openForm('careSteps', { procedureId: d.pid, section: d.section, order: nextStepOrder(d.pid, d.section) }); },
    moveStep: function (d) { moveStep(d.id, Number(d.dir)); },
    switchChild: function (d) { S.childId = d.id; S.careId = null; saveUi(); render(); },
    print: function (d) { S.print = { type: d.type, id: d.id, audience: d.audience || 'supporter' }; render(); window.scrollTo(0, 0); },
    closePrint: function () { S.print = null; render(); },
    doPrint: function () { window.print(); },
    savePdf: function () {
      var html = '<!doctype html><html><head><meta charset="utf-8"><style>' + PDF_CSS + '</style></head><body>' + document.getElementById('doc').innerHTML + '</body></html>';
      toast('PDFを作っています…');
      S.store.savePdf(html, printFileName()).then(function (r) {
        showNotice('PDFを保存しました', 'Googleドライブのフォルダ「たすかReマインド」に保存しました。支援者に渡すときは、ドライブで「共有」→「リンクを知っている全員（閲覧者）」にします。', r.url);
      }).catch(function (e) { showNotice('PDFを作れませんでした', errMsg(e)); });
    },
    exportJson: exportJson,
    exportIcs: function () {
      var ics = L.toIcs(mine('tasks'), { calName: 'たすかReマインド' });
      saveOut('たすかReマインド_ToDo.ics', ics, 'text/calendar');
    },
    loadSample: function () {
      if (all('children').length && !window.confirm('今のデータに、架空のサンプルを追加します。よろしいですか？')) return;
      loadSample();
    },
    testNotify: function () {
      S.store.testNotify().then(function () { toast('テスト通知を送りました。Discordを確認してください'); })
        .catch(function (e) { showNotice('送れませんでした', errMsg(e)); });
    },
    sendDigestNow: function () {
      S.store.sendDigestNow().then(function (r) { toast(r && r.sent ? 'まとめを送りました' : '送る内容がありませんでした'); })
        .catch(function (e) { showNotice('送れませんでした', errMsg(e)); });
    },
    closeNotice: function () { S.notice = null; render(); }
  };

  var PDF_CSS = 'body{font-family:sans-serif;font-size:11pt;line-height:1.6;color:#111}h1{font-size:17pt;margin:0 0 4pt}h2{font-size:13pt;border-bottom:1.5pt solid #333;margin:14pt 0 6pt;padding-bottom:2pt}h3{font-size:11.5pt;margin:10pt 0 4pt}' +
    '.doc-meta{color:#555;font-size:9.5pt}table{border-collapse:collapse;width:100%;margin:4pt 0}th,td{border:0.75pt solid #999;padding:4pt 6pt;text-align:left;vertical-align:top}th{background:#f1f1f1;width:28%}' +
    '.doc-criteria{color:#444;font-size:10pt;margin-top:2pt}.doc-foot{margin-top:16pt;font-size:9pt;color:#555}ol{padding-left:18pt}li{margin:3pt 0}';

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var fn = ACTIONS[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el.dataset, el); }
  });
  document.addEventListener('submit', function (e) {
    var form = e.target;
    var kind = form.getAttribute('data-form');
    if (!kind) return;
    e.preventDefault();
    if (kind === 'record') submitRecord(form);
    else if (kind === 'startProcess') submitStartProcess(form);
    else if (kind === 'settings') {
      var fd = new FormData(form);
      var s = {};
      ['discordWebhookUrl', 'digestHour', 'dayHour', 'certAlertDays', 'appUrl'].forEach(function (k) { if (fd.has(k)) s[k] = String(fd.get(k)).trim(); });
      S.store.saveSettings(s).then(function (res) { S.settings = Object.assign(S.settings, res || s); toast('設定を保存しました'); })
        .catch(function (err) { showNotice('保存できませんでした', errMsg(err)); });
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    var kind = el.getAttribute && el.getAttribute('data-change');
    if (kind === 'child') { S.childId = el.value; S.careId = null; saveUi(); render(); }
    else if (kind === 'import') { importFile(el.files && el.files[0]); el.value = ''; }
    else if (kind === 'tplPreview') {
      var form = el.form;
      var fd = new FormData(form);
      S.form = { kind: 'startProcess', templateId: fd.get('templateId'), certificateId: fd.get('certificateId'), deadline: fd.get('deadline'), name: fd.get('name') };
      render();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && (S.form || S.notice)) { S.form = null; S.notice = null; render(); }
  });

  // =====================================================================
  // 起動
  // =====================================================================
  function init() {
    S.store = IS_GAS ? createGasStore() : createLocalStore();
    var ui = loadUi();
    S.childId = ui.childId || null;
    S.tab = ui.tab || 'today';
    render();
    Promise.all([S.store.loadAll(), S.store.getSettings()]).then(function (res) {
      var db = res[0] || {};
      COLS.forEach(function (c) { if (!Array.isArray(db[c])) db[c] = []; });
      S.db = db;
      S.settings = res[1] || {};
      S.ready = true;
      render();
    }).catch(function (e) {
      S.error = errMsg(e);
      render();
    });
  }

  // GitHub Pages版だけ：オフラインでも開けるようにする（GAS版では使わない）
  function registerServiceWorker() {
    if (IS_GAS || !('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () { /* 使えなくてもアプリは動く */ });
    });
  }

  // テスト用に一部を公開
  window.TasukaApp = { state: S, actions: ACTIONS };
  registerServiceWorker();
  init();
})();
