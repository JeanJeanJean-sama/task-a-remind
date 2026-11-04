/*
 * たすかReマインド 共通ロジック
 * ブラウザ版（GitHub Pages / GASのWebアプリ）とGAS（サーバー側）の両方で使う。
 * 画面（DOM）や保存先に依存しない処理だけをここに置く。
 * 将来スマホアプリ・独自サーバーへ移行するときも、このファイルはそのまま使える想定。
 */
var Logic = (function () {
  'use strict';

  var CURRENT_SCHEMA_VERSION = 2;
  var EXPORT_FORMAT = 'task-a-remind-export';
  // 名前を「task-a-remind」にそろえる前（v0.3.0まで）の書き出しファイルも読み込めるようにする
  var LEGACY_FORMATS = ['tasuka-remind-export'];

  // ---------- 日付（すべて 'YYYY-MM-DD' の文字列で扱う） ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function parseYmd(s) {
    if (!s) return null;
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(s));
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3]);
  }
  function addDays(s, n) {
    var d = parseYmd(s);
    if (!d) return '';
    d.setDate(d.getDate() + n);
    return ymd(d);
  }
  /** b - a の日数 */
  function diffDays(a, b) {
    var da = parseYmd(a), db = parseYmd(b);
    if (!da || !db) return null;
    return Math.round((db.getTime() - da.getTime()) / 86400000);
  }
  /** n 年先の同じ日（2/29 は、うるう年でなければ 2/28） */
  function addYears(s, n) {
    var d = parseYmd(s);
    if (!d) return '';
    var y = d.getFullYear() + n, m = d.getMonth();
    var last = new Date(y, m + 1, 0).getDate();
    return ymd(new Date(y, m, Math.min(d.getDate(), last)));
  }
  function fmtMD(s) {
    var d = parseYmd(s);
    return d ? (d.getMonth() + 1) + '/' + d.getDate() : '';
  }
  function fmtDate(s) {
    var d = parseYmd(s);
    return d ? d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日' : '';
  }
  function fmtYm(s) {
    var m = /^(\d{4})-(\d{1,2})/.exec(String(s || ''));
    return m ? m[1] + '年' + (+m[2]) + '月' : '';
  }
  /** 生年月日と日付から「1歳8ヶ月」「5ヶ月」「12日」のような年齢を作る */
  function ageText(birth, date) {
    var b = parseYmd(birth), d = parseYmd(date || ymd());
    if (!b || !d || d < b) return '';
    var months = (d.getFullYear() - b.getFullYear()) * 12 + (d.getMonth() - b.getMonth());
    if (d.getDate() < b.getDate()) months -= 1;
    if (months <= 0) return Math.round((d - b) / 86400000) + '日';
    var y = Math.floor(months / 12), m = months % 12;
    if (!y) return m + 'ヶ月';
    return y + '歳' + (m ? m + 'ヶ月' : '');
  }
  function nowIso() { return new Date().toISOString(); }

  function uuid() {
    if (typeof crypto !== 'undefined' && crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    if (typeof Utilities !== 'undefined' && Utilities.getUuid) return Utilities.getUuid();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }

  // ---------- 記録の扱い ----------
  function alive(list) { return (list || []).filter(function (r) { return r && !r.deleted; }); }
  function indexById(list) {
    var m = {};
    (list || []).forEach(function (r) { if (r && r.id) m[r.id] = r; });
    return m;
  }

  // ---------- タスク ----------
  /** 未完了で、前の工程がすべて終わっているタスクだけが「今やれる」 */
  function isActionable(task, byId) {
    if (!task || task.deleted || task.status !== 'todo') return false;
    var deps = task.dependsOn || [];
    for (var i = 0; i < deps.length; i++) {
      var d = byId[deps[i]];
      if (d && !d.deleted && d.status === 'todo') return false;
    }
    return true;
  }

  function dueLabel(task, today) {
    if (!task.dueDate) return '';
    var d = diffDays(today, task.dueDate);
    if (d === null) return '';
    if (d < 0) return '目安を' + (-d) + '日過ぎています';
    if (d === 0) return '今日が目安';
    return 'あと' + d + '日';
  }

  /** 手続きの型を group ごとに分ける（画面の <optgroup> 用）。group のない型は「更新・申請」、汎用の型は「その他」 */
  var TEMPLATE_GROUPS = ['更新・申請', '毎年の届出', '期限のあるもの', '年齢の節目', '災害の備え', 'その他'];
  function groupTemplates(templates) {
    var list = (templates && templates.templates) || templates || [];
    var by = {};
    list.forEach(function (t) {
      var g = t.group || (t.id === 'generic' ? 'その他' : '更新・申請');
      (by[g] = by[g] || []).push(t);
    });
    var order = TEMPLATE_GROUPS.concat(Object.keys(by).filter(function (g) { return TEMPLATE_GROUPS.indexOf(g) < 0; }));
    return order.filter(function (g) { return by[g]; }).map(function (g) { return { label: g, templates: by[g] }; });
  }

  function findTemplate(templates, id) {
    var list = (templates && templates.templates) || templates || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /**
   * 手続きの型と期限から、工程ごとのタスクを作る。
   * 期限から逆算した目安日が今日より前になる場合は、今日以降に詰めて「追い詰めない」。
   */
  function planProcess(template, deadline, opts) {
    opts = opts || {};
    var today = opts.today || ymd();
    var processId = uuid();
    var now = nowIso();
    var byKind = opts.contactIdsByKind || {};
    var prev = null;
    var out = [];
    template.steps.forEach(function (st, i) {
      var due = deadline ? addDays(deadline, -(st.daysBefore || 0)) : '';
      if (due && due < today) due = today;
      var t = {
        id: uuid(), createdAt: now, updatedAt: now, deleted: false,
        childId: opts.childId || '',
        title: st.title,
        processId: processId,
        processName: opts.processName || template.name,
        templateId: template.id,
        stepNo: i + 1,
        dependsOn: prev ? [prev.id] : [],
        dueDate: due,
        window: st.window || 'night',
        scheduledDate: '',
        contactId: (st.contactKind && byKind[st.contactKind]) || '',
        script: st.script || '',
        assignee: '',
        status: 'todo',
        doneAt: '',
        certificateId: opts.certificateId || '',
        note: ''
      };
      out.push(t);
      prev = t;
    });
    return out;
  }

  /**
   * 手続き（同じ processId の工程）を始めたときの期限を、工程の目安日から推し量る。
   * 目安日＝期限−daysBefore（今日より前なら今日に詰める）なので、「目安日＋daysBefore」の最小が期限になる。
   */
  function processDeadline(tasks, template) {
    var steps = (template && template.steps) || [];
    var best = '';
    (tasks || []).forEach(function (t) {
      if (!t.dueDate) return;
      var st = steps[(Number(t.stepNo) || 0) - 1];
      var d = addDays(t.dueDate, (st && st.daysBefore) || 0);
      if (d && (!best || d < best)) best = d;
    });
    return best;
  }

  /** 名前の中の「2026年」「2026年度」を1年先にする */
  function nextYearName(name) {
    return String(name || '').replace(/(\d{4})(?=年)/g, function (y) { return String(+y + 1); });
  }

  /**
   * 毎年くり返す型（repeat: "yearly"）の手続きで、工程がすべて終わっていれば、
   * 来年の分を始めるための案（型・期限を1年先にした日・名前・受給者証）を返す。
   * くり返さない型、まだ終わっていない工程がある、来年の分をもう始めている、のときは null。
   */
  function nextRepeat(db, processId, templates) {
    if (!processId) return null;
    var all = alive(db.tasks);
    var mine = all.filter(function (t) { return t.processId === processId; });
    if (!mine.length) return null;
    if (mine.some(function (t) { return t.status === 'todo'; })) return null;
    var first = mine[0];
    var tpl = findTemplate(templates, first.templateId);
    if (!tpl || tpl.repeat !== 'yearly') return null;
    var deadline = processDeadline(mine, tpl);
    // 同じ子どもで、同じ型の、もっと先の期限の手続きがあれば、来年の分はもう始めている
    var others = {};
    all.forEach(function (t) {
      if (t.processId && t.processId !== processId && t.templateId === tpl.id && t.childId === first.childId) {
        (others[t.processId] = others[t.processId] || []).push(t);
      }
    });
    var started = Object.keys(others).some(function (k) {
      var d = processDeadline(others[k], tpl);
      return !deadline || !d || d > deadline;
    });
    if (started) return null;
    return {
      templateId: tpl.id,
      childId: first.childId || '',
      certificateId: first.certificateId || '',
      lastDeadline: deadline,
      deadline: deadline ? addYears(deadline, 1) : '',
      name: nextYearName(first.processName || tpl.name)
    };
  }

  /**
   * 小学校に入学する日（4月1日）。6歳になったあとの最初の4月1日。
   * 満年齢は誕生日の前日に増えるので、4月1日生まれまでは前の学年（早生まれ）になる。
   */
  function schoolEntryDate(birth) {
    var b = parseYmd(birth);
    if (!b) return '';
    var m = b.getMonth() + 1, d = b.getDate();
    var early = m < 4 || (m === 4 && d === 1);
    return (b.getFullYear() + (early ? 6 : 7)) + '-04-01';
  }

  /**
   * 生年月日から、手続きの期限を出す（手続きの型の deadlineFromBirth）。
   *   { "kind": "schoolEntry" }           → 小学校に入学する日（4月1日）
   *   { "kind": "birthday", "age": 18 }   → 18歳の誕生日
   * 返す値：{ date, label, note }。型に決まりがない・生年月日がないときは null。
   */
  function birthDeadline(template, birthDate) {
    var r = template && template.deadlineFromBirth;
    if (!r || !parseYmd(birthDate)) return null;
    var note = r.note || '';
    if (r.kind === 'schoolEntry') return { date: schoolEntryDate(birthDate), label: '小学校に入学する日', note: note };
    if (r.kind === 'birthday' && Number(r.age) > 0) return { date: addYears(birthDate, Number(r.age)), label: Number(r.age) + '歳の誕生日', note: note };
    return null;
  }

  /** 期限が近いのに、更新の手続きをまだ始めていない受給者証・手帳 */
  function certificateAlerts(db, today, childId, days) {
    var tasks = alive(db.tasks);
    return alive(db.certificates).filter(function (c) {
      if (childId && c.childId !== childId) return false;
      if (!c.validUntil) return false;
      var d = diffDays(today, c.validUntil);
      if (d === null || d > days) return false;
      return !tasks.some(function (t) { return t.certificateId === c.id && t.status === 'todo'; });
    }).map(function (c) {
      return { cert: c, daysLeft: diffDays(today, c.validUntil) };
    }).sort(function (a, b) { return a.daysLeft - b.daysLeft; });
  }

  /** 今日の画面・夜のまとめ通知の元になる集計 */
  function summarize(db, today, opts) {
    opts = opts || {};
    var childId = opts.childId;
    var byId = indexById(db.tasks);
    var tomorrow = addDays(today, 1);
    var r = { night: [], dayToday: [], dayTomorrow: [], dayUnscheduled: [], dayLater: [] };
    alive(db.tasks).forEach(function (t) {
      if (childId && t.childId !== childId) return;
      if (!isActionable(t, byId)) return;
      if (t.window === 'day') {
        if (!t.scheduledDate) r.dayUnscheduled.push(t);
        else if (t.scheduledDate <= today) r.dayToday.push(t);
        else if (t.scheduledDate === tomorrow) r.dayTomorrow.push(t);
        else r.dayLater.push(t);
      } else {
        r.night.push(t);
      }
    });
    var byDue = function (a, b) { return (a.dueDate || '9999').localeCompare(b.dueDate || '9999'); };
    Object.keys(r).forEach(function (k) { r[k].sort(byDue); });
    r.certs = certificateAlerts(db, today, childId, opts.certDays || 120);
    return r;
  }

  // ---------- 使えるかもしれない制度（目安） ----------
  // 制度の一覧（src/benefits.json）と、子どもの手帳・受給者証を照らし合わせる。
  // 言い切らない：結果は「当てはまりそう（likely）」か「条件しだい（maybe）」の2段階だけ。
  // 医療の情報を含むので、通知（Discord）の文面には使わない。
  var HANDBOOK_KINDS = ['身体障害者手帳', '療育手帳', '精神障害者保健福祉手帳'];
  var Z2H = { '０': '0', '１': '1', '２': '2', '３': '3', '４': '4', '５': '5', '６': '6', '７': '7', '８': '8', '９': '9', 'Ａ': 'A', 'Ｂ': 'B', 'ａ': 'A', 'ｂ': 'B' };

  /** 手帳の等級を「1級」「A1」などの形で返す。選ぶ欄が空なら、書いてある欄から読み取れるときだけ使う */
  function certGrade(c) {
    if (!c) return '';
    if (c.gradeCode) return c.gradeCode;
    if (HANDBOOK_KINDS.indexOf(c.kind) < 0) return '';
    var s = String(c.grade || '').replace(/[０-９ＡＢａｂ]/g, function (ch) { return Z2H[ch]; });
    var found = [];
    var re = /([1-6])\s*級/g, m;
    while ((m = re.exec(s))) found.push(m[1] + '級');
    re = /([ABab])\s*([12])/g;
    while ((m = re.exec(s))) found.push(m[1].toUpperCase() + m[2]);
    // 2つ以上読み取れたときは、どれか分からないので使わない
    var uniq = found.filter(function (x, i) { return found.indexOf(x) === i; });
    return uniq.length === 1 ? uniq[0] : '';
  }

  function ageYears(birth, today) {
    var b = parseYmd(birth), t = parseYmd(today);
    if (!b || !t) return null;
    var y = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) y -= 1;
    return y;
  }

  /** 1つの条件を、持っている証明書と照らす → 'yes' / 'unknown'（情報が足りない）/ 'no' */
  function evalCond(cond, certs, why) {
    var best = 'no', note = '';
    certs.forEach(function (c) {
      if (c.kind !== cond.kind || best === 'yes') return;
      var r = 'yes', miss = [];
      if (cond.grades) {
        var g = certGrade(c);
        if (!g) { r = 'unknown'; miss.push('等級'); }
        else if (cond.grades.indexOf(g) < 0) r = 'no';
      }
      if (r !== 'no' && cond.types) {
        var ts = [c.disabilityType, c.disabilityType2].filter(Boolean);
        if (!ts.length) { r = 'unknown'; miss.push('障害の種類'); }
        else if (!ts.some(function (x) { return cond.types.indexOf(x) >= 0; })) r = 'no';
      }
      if (r !== 'no' && cond.fareClass) {
        if (!c.fareClass) { r = 'unknown'; miss.push('第1種・第2種'); }
        else if (c.fareClass !== cond.fareClass) r = 'no';
      }
      if (r === 'yes' || (r === 'unknown' && best === 'no')) {
        best = r;
        var g2 = certGrade(c);
        note = c.kind + (g2 ? ' ' + g2 : '') + (r === 'unknown' ? '（' + miss.join('・') + 'が入っていません）' : '');
      }
    });
    if (best !== 'no' && note) why.push(note);
    return best;
  }

  /** when の1行（all：すべて／count：of のうち count 個以上）を評価 */
  function evalWhen(w, certs) {
    var why = [];
    var results = (w.all || w.of || []).map(function (cond) { return evalCond(cond, certs, why); });
    var yes = results.filter(function (r) { return r === 'yes'; }).length;
    var unk = results.filter(function (r) { return r === 'unknown'; }).length;
    var need = w.all ? results.length : (w.count || 1);
    var r = yes >= need ? 'yes' : yes + unk >= need ? 'unknown' : 'no';
    return { result: r, why: why };
  }

  /**
   * 子どもに「使えるかもしれない制度」を出す。
   * 戻り値：{ area: 'match' | 'other' | 'unset', stale, items: [{ benefit, level, why }], checked: [{ benefit, check }] }
   *   area：子どもの市区町村が一覧の地域か（'unset' は未入力。目安として出す）
   *   stale：一覧の見直し期限（reviewBy）を過ぎているか
   */
  function suggestBenefits(db, data, childId, today) {
    var out = { area: 'unset', stale: false, items: [], checked: [] };
    if (!data || !data.benefits) return out;
    today = today || ymd();
    out.stale = !!(data.reviewBy && today > data.reviewBy);
    var child = alive(db.children).filter(function (c) { return c.id === childId; })[0] || {};
    var place = String(child.municipality || '') + String(child.prefecture || '');
    if (place) {
      out.area = (data.areaKeywords || []).some(function (k) { return place.indexOf(k) >= 0; }) ? 'match' : 'other';
      if (out.area === 'other') return out;
    }
    var certs = alive(db.certificates).filter(function (c) {
      return c.childId === childId && (!c.status || c.status === '取得済み');
    });
    var checks = {};
    alive(db.benefitChecks).forEach(function (r) { if (r.childId === childId && r.benefitId) checks[r.benefitId] = r; });
    var age = child.birthDate ? ageYears(child.birthDate, today) : null;
    data.benefits.forEach(function (b) {
      if (checks[b.id]) { out.checked.push({ benefit: b, check: checks[b.id] }); return; }
      if (b.ageUnder && age !== null && age >= b.ageUnder) return;
      if ((b.heldKinds || []).some(function (k) { return certs.some(function (c) { return c.kind === k; }); })) return;
      var level = '', why = [];
      (b.when || []).forEach(function (w) {
        var e = evalWhen(w, certs);
        if (e.result === 'no') return;
        var lv = e.result === 'yes' ? (w.level || 'maybe') : 'maybe';
        if (!level || (level === 'maybe' && lv === 'likely')) { level = lv; why = e.why; }
      });
      if (level) out.items.push({ benefit: b, level: level, why: why });
    });
    out.items.sort(function (a, b) { return (a.level === b.level ? 0 : a.level === 'likely' ? -1 : 1); });
    return out;
  }

  // ---------- 通知の文面（病名など医療の情報は載せない） ----------
  function contactLine(t, contactsById) {
    var c = t.contactId && contactsById[t.contactId];
    if (!c || c.deleted) return '';
    var s = c.name;
    if (c.phone) s += ' ☎ ' + c.phone;
    if (c.hours) s += '（' + c.hours + '）';
    return s;
  }
  function childTag(t, childrenById, multi) {
    if (!multi) return '';
    var c = childrenById[t.childId];
    return c ? '〔' + c.nickname + '〕' : '';
  }

  function buildDigestText(db, today, opts) {
    opts = opts || {};
    var s = summarize(db, today, { certDays: opts.certDays });
    var children = indexById(alive(db.children));
    var multi = alive(db.children).length > 1;
    var contacts = indexById(db.contacts);
    var lines = [];
    function item(t, extra) {
      var line = '・' + childTag(t, children, multi) + t.title;
      var due = dueLabel(t, today);
      if (due) line += '（' + due + '）';
      if (t.assignee) line += ' 担当：' + t.assignee;
      lines.push(line);
      if (extra) lines.push('　' + extra);
    }
    if (s.night.length) {
      lines.push('【今夜できること】');
      s.night.slice(0, 10).forEach(function (t) { item(t); });
      if (s.night.length > 10) lines.push('　ほか' + (s.night.length - 10) + '件');
    }
    if (s.dayTomorrow.length) {
      lines.push('【明日の昼にやること】');
      s.dayTomorrow.forEach(function (t) { item(t, contactLine(t, contacts)); });
    }
    if (s.dayUnscheduled.length) {
      lines.push('【昼にやる日を決めましょう】');
      s.dayUnscheduled.forEach(function (t) { item(t); });
    }
    if (s.certs.length) {
      lines.push('【期限が近い受給者証・手帳】');
      s.certs.forEach(function (a) {
        var c = a.cert;
        var name = (c.name || c.kind);
        var tag = multi && children[c.childId] ? '〔' + children[c.childId].nickname + '〕' : '';
        lines.push('・' + tag + name + '：' + (a.daysLeft < 0 ? '有効期限を' + (-a.daysLeft) + '日過ぎています' : '有効期限まであと' + a.daysLeft + '日') + '（更新の手続きをまだ始めていません）');
      });
    }
    if (!lines.length) return '';
    var head = '📋 たすかReマインド｜今夜のまとめ（' + fmtMD(today) + '）';
    var tail = opts.appUrl ? '\n▶ アプリを開く：' + opts.appUrl : '';
    return head + '\n' + lines.join('\n') + tail;
  }

  function buildDayText(db, today, opts) {
    opts = opts || {};
    var s = summarize(db, today, {});
    if (!s.dayToday.length) return '';
    var children = indexById(alive(db.children));
    var multi = alive(db.children).length > 1;
    var contacts = indexById(db.contacts);
    var lines = ['☀️ たすかReマインド｜今日の昼にやること（' + fmtMD(today) + '）'];
    s.dayToday.forEach(function (t) {
      lines.push('・' + childTag(t, children, multi) + t.title + (t.assignee ? ' 担当：' + t.assignee : ''));
      var c = contactLine(t, contacts);
      if (c) lines.push('　' + c);
      if (t.script) lines.push('　伝えること：' + t.script);
    });
    if (opts.appUrl) lines.push('▶ 終わったらアプリで完了に：' + opts.appUrl);
    return lines.join('\n');
  }

  // ---------- カレンダー（.ics）書き出し ----------
  function icsEscape(s) {
    return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }
  function toIcs(tasks, opts) {
    opts = opts || {};
    var stamp = nowIso().replace(/[-:]/g, '').replace(/\.\d+/, '');
    var out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//task-a-remind//JP', 'CALSCALE:GREGORIAN',
      'X-WR-CALNAME:' + icsEscape(opts.calName || 'たすかReマインド')];
    alive(tasks).forEach(function (t) {
      if (t.status !== 'todo') return;
      var date = (t.window === 'day' && t.scheduledDate) ? t.scheduledDate : t.dueDate;
      if (!date) return;
      var d = date.replace(/-/g, '');
      var end = addDays(date, 1).replace(/-/g, '');
      out.push('BEGIN:VEVENT', 'UID:' + t.id + '@task-a-remind', 'DTSTAMP:' + stamp,
        'DTSTART;VALUE=DATE:' + d, 'DTEND;VALUE=DATE:' + end,
        'SUMMARY:' + icsEscape((t.window === 'day' ? '【昼】' : '') + t.title),
        'DESCRIPTION:' + icsEscape((t.processName ? t.processName + '\n' : '') + (t.script || '')),
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(t.title),
        // 終日予定の前日22時に知らせる
        'TRIGGER:-PT2H', 'END:VALARM', 'END:VEVENT');
    });
    out.push('END:VCALENDAR');
    return out.join('\r\n');
  }

  // ---------- 書き出し・読み込み（移行の道具） ----------
  function makeExport(db, meta) {
    var collections = {};
    Object.keys(db).forEach(function (k) { collections[k] = db[k] || []; });
    return {
      format: EXPORT_FORMAT,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: nowIso(),
      app: meta || {},
      collections: collections
    };
  }

  /**
   * 古い定義で保存されたデータを、今の定義に合わせて直す。
   * 何度実行しても同じ結果になるように書く（起動のたびに実行するため）。
   * 直した記録を [{col, rec}] で返す。
   */
  var CATEGORY_V1_TO_V2 = {
    '性格・特性・関わり方': '特徴と関わり方',
    '生活リズム・食事': '食事',
    '家族・緊急連絡先': 'その他'
  };
  function upgradeCollections(cols) {
    var changed = [];
    var now = nowIso();
    (cols.profile || []).forEach(function (r) {
      var to = CATEGORY_V1_TO_V2[r.category];
      if (to) { r.category = to; r.updatedAt = now; changed.push({ col: 'profile', rec: r }); }
    });
    (cols.certificates || []).forEach(function (r) {
      if (!r.status) { r.status = '取得済み'; r.updatedAt = now; changed.push({ col: 'certificates', rec: r }); }
    });
    return changed;
  }

  /** 書き出しファイルを今の形に直す。定義を変えたらここ（と upgradeCollections）に変換を足す。 */
  function migrate(data) {
    if (data && LEGACY_FORMATS.indexOf(data.format) >= 0) data.format = EXPORT_FORMAT;
    if (!data || data.format !== EXPORT_FORMAT || !data.collections) {
      throw new Error('たすかReマインドの書き出しファイルではありません');
    }
    var v = Number(data.schemaVersion || 1);
    if (v > CURRENT_SCHEMA_VERSION) {
      throw new Error('新しいバージョンのアプリで書き出されたデータです。アプリを更新してください');
    }
    if (v < 2) upgradeCollections(data.collections); // 第1版→第2版：分類の名前、受給者証の状態
    data.schemaVersion = CURRENT_SCHEMA_VERSION;
    return data;
  }

  /** IDが同じなら更新日時が新しい方を残す */
  function mergeImport(current, incoming) {
    var changed = [];
    Object.keys(incoming || {}).forEach(function (col) {
      if (!current[col]) return; // 定義にないデータ種別は無視
      var byId = indexById(current[col]);
      (incoming[col] || []).forEach(function (rec) {
        if (!rec || !rec.id) return;
        var cur = byId[rec.id];
        if (!cur || String(rec.updatedAt || '') > String(cur.updatedAt || '')) changed.push({ col: col, rec: rec });
      });
    });
    return changed;
  }

  // ---------- AIで読み取った書類のデータの取り込み（取り込み用ファイル） ----------
  // 取り込み用ファイルの形は guide/AI読み取りの指示書.md（3-3 で自動生成）と、提案書A（2026-10-21）の 3-1。
  // ID・作成日時・子どもはファイルに書かず、取り込むときにTRMが付ける。
  var IMPORT_FORMAT = 'task-a-remind-import';
  var IMPORT_FORMAT_VERSION = 1;
  /** 取り込める記録の種類（process は記録ではなく「手続きを始める」） */
  var IMPORT_TYPES = ['visits', 'milestones', 'diagnoses', 'certificates', 'contacts', 'profile', 'process'];
  /** 取り込まない項目：番号（あとで手入力）。sourceFile は from から入れる */
  var IMPORT_NUMBER_KEYS = ['number', 'issuerNumber'];
  var PROCESS_FIELDS = [
    { key: 'templateId', label: '手続きの型', type: 'template', required: true },
    { key: 'deadline', label: '締め切り', type: 'date', required: true },
    { key: 'name', label: '手続きの名前', type: 'string' }
  ];
  var WAREKI_RE = /明治|大正|昭和|平成|令和|元年|^[MTSHRmtshr]\s*\d{1,2}[.\/年-]/;

  /**
   * 貼り付けた文やファイルの中身から、取り込み用ファイル（JSON）を取り出す。
   * AIの答えをそのまま貼っても読めるように、コードブロックや前後の説明を飛ばして { 〜 } を探す。
   * 形が違うときは、利用者に見せる文で Error を投げる。
   */
  function parseImportText(text) {
    var s = String(text == null ? '' : text).replace(/^﻿/, '').trim();
    if (!s) throw new Error('中身が空です。AIの答えを貼り付けるか、ファイルを選んでください');
    var tries = [s];
    var fence = /```[a-zA-Z]*\s*\n?([\s\S]*?)```/g, m;
    while ((m = fence.exec(s))) tries.push(m[1].trim());
    var a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a >= 0 && b > a) tries.push(s.slice(a, b + 1));
    var data = null;
    for (var i = 0; i < tries.length && !data; i++) {
      try {
        var d = JSON.parse(tries[i]);
        if (d && typeof d === 'object' && !Array.isArray(d)) data = d;
      } catch (e) { /* 次を試す */ }
    }
    if (!data) throw new Error('読み取れませんでした。AIの答えの中に、{ で始まり } で終わる部分（JSON）がありません。途中で切れていないか確かめてください');
    if (data.format === EXPORT_FORMAT || LEGACY_FORMATS.indexOf(data.format) >= 0) {
      throw new Error('これは「書き出したデータ」のファイルです。「書き出したデータを読み込む」から読み込んでください');
    }
    if (data.format !== IMPORT_FORMAT) throw new Error('取り込み用ファイルではありません（"format" が "' + IMPORT_FORMAT + '" ではありません）');
    if (Number(data.formatVersion || 1) > IMPORT_FORMAT_VERSION || Number(data.schemaVersion || 0) > CURRENT_SCHEMA_VERSION) {
      throw new Error('新しいバージョンのアプリ用に作られたファイルです。アプリを更新してください');
    }
    if (!Array.isArray(data.records)) throw new Error('取り込む記録（"records"）がありません');
    return data;
  }

  function importNorm(v) {
    var s = String(v == null ? '' : v);
    if (s.normalize) s = s.normalize('NFKC');
    return s.replace(/\s+/g, '').toLowerCase();
  }
  /** 'YYYY-MM-DD' が実際にある日か */
  function isRealDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return false;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3];
  }
  function isRealMonth(s) {
    var m = /^(\d{4})-(\d{2})$/.exec(s);
    return !!m && +m[2] >= 1 && +m[2] <= 12;
  }
  function optionValues(field, schema) {
    var src = field.optionsRef ? (schema.options || {})[field.optionsRef] : field.options;
    if (!Array.isArray(src)) return null;
    return src.map(function (o) { return typeof o === 'string' ? o : o.value; });
  }
  /** 保管箱のファイル名だけを残す（フォルダの名前には利用者の名前が入ることがあるため） */
  function baseName(s) {
    var parts = String(s == null ? '' : s).trim().split(/[\\\/]/);
    return parts[parts.length - 1];
  }

  /** 重なりを見分けるための「鍵」。同じ鍵の記録は、同じものがありそうと知らせる */
  function duplicateKey(type, r) {
    var n = importNorm;
    switch (type) {
      case 'visits': return r.date ? n(r.date) + '|' + n(r.facility) : '';
      case 'milestones': return r.item ? n(r.item) : '';
      case 'diagnoses': return r.name ? n(r.name) : '';
      case 'certificates': return r.kind ? n(r.kind) + '|' + n(r.validUntil) : '';
      case 'contacts': return r.name ? n(r.name) : '';
      case 'profile': return r.label ? n(r.category) + '|' + n(r.label) + '|' + n(r.value) : '';
      default: return '';
    }
  }
  /** contacts は、名前が同じで、診療科がどちらか空か同じなら重なりとみなす（診療科ごとに1件ずつ登録するため） */
  function sameDuplicate(type, a, b) {
    if (type !== 'contacts') return true;
    var da = importNorm(a.department), db = importNorm(b.department);
    return !da || !db || da === db;
  }
  function duplicateText(type, r) {
    switch (type) {
      case 'visits': return [r.date, r.facility, r.summary].filter(Boolean).join(' ');
      case 'milestones': return r.item || '';
      case 'diagnoses': return r.name || '';
      case 'certificates': return [r.name || r.kind, r.validUntil ? '有効期限 ' + r.validUntil : ''].filter(Boolean).join(' ');
      case 'contacts': return [r.name, r.department].filter(Boolean).join(' ');
      case 'profile': return (r.label || '') + '：' + (r.value || '');
      case 'process': return r.processName || r.name || '';
      default: return '';
    }
  }

  /**
   * 取り込み用ファイルの記録を1件ずつ調べる（保存はしない）。確認の画面はこの結果を出す。
   *   data      … parseImportText() の結果
   *   schema    … src/schema.json
   *   db        … 今のデータ（{ children: [...], visits: [...], ... }）。重なりと生年月日を調べるのに使う
   *   templates … src/templates.json
   *   opts      … { childId: 取り込む先の子ども, today: 'YYYY-MM-DD' }
   * 子どもを選び直したら、もう一度呼ぶ（生まれる前の日付・重なりは子どもごとに違うため）。
   * 返す形は、提案書Aの作業記録（3-1）と test/logic.test.mjs を参照。
   */
  function checkImport(data, schema, db, templates, opts) {
    opts = opts || {};
    db = db || {};
    var today = opts.today || ymd();
    var childId = opts.childId || '';
    var child = childId ? indexById(alive(db.children))[childId] : null;
    var birth = child && isRealDate(String(child.birthDate || '')) ? child.birthDate : '';
    var seen = {}; // ファイルの中での重なり：type|鍵 → [{ index, rec }]

    return ((data && data.records) || []).map(function (raw, index) {
      raw = raw && typeof raw === 'object' ? raw : {};
      var type = String(raw.type || '').trim();
      var item = {
        index: index, type: type, label: '', rec: {}, from: baseName(raw.from), memo: String(raw.memo == null ? '' : raw.memo).trim(),
        unclear: [], dropped: [], defaulted: [], problems: [], duplicateOf: null,
        certificateId: '', canImport: true, checked: true
      };
      function problem(level, code, message, key) { item.problems.push({ level: level, code: code, key: key || '', message: message }); }

      var def = type === 'process' ? { label: '手続きを始める', fields: PROCESS_FIELDS } : (schema.collections || {})[type];
      if (IMPORT_TYPES.indexOf(type) < 0 || !def) {
        item.label = type || '（種類なし）';
        problem('block', 'badType', type ? 'この種類（' + type + '）は取り込めません' : '記録の種類（type）がありません');
        return finish(item);
      }
      item.label = def.label;
      var src = raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) ? raw.data : null;
      if (!src) { problem('block', 'noData', '項目と値（data）がありません'); return finish(item); }

      var fields = {};
      def.fields.forEach(function (f) { fields[f.key] = f; });
      var rec = item.rec;

      // 1. 項目を選ぶ：定義にない・番号・自動で入る項目は捨てる
      Object.keys(src).forEach(function (k) {
        var f = fields[k], v = src[k];
        if (IMPORT_NUMBER_KEYS.indexOf(k) >= 0 && type !== 'process') { item.dropped.push({ key: k, reason: 'number' }); return; }
        if (!f) { item.dropped.push({ key: k, reason: 'unknown' }); return; }
        if (f.hidden || f.type === 'ref' || f.type === 'refs' || k === 'sourceFile') { item.dropped.push({ key: k, reason: 'auto' }); return; }
        if (v == null || v === '') return;
        if (typeof v === 'object') { item.dropped.push({ key: k, reason: 'badValue' }); return; }
        rec[k] = typeof v === 'string' ? v.trim() : (f.type === 'number' ? v : String(v));
      });
      if (item.dropped.some(function (d) { return d.reason === 'number'; })) {
        problem('info', 'numberDropped', '番号の項目は取り込みません。必要なら、取り込んだあとに手で入れてください');
      }

      // 2. 値を調べる
      def.fields.forEach(function (f) {
        var k = f.key;
        if (!(k in rec)) return;
        var v = rec[k];
        if (f.type === 'date' || f.type === 'month') {
          var s = String(v);
          if (s.normalize) s = s.normalize('NFKC').trim();
          rec[k] = s;
          if (WAREKI_RE.test(s)) { problem('block', 'wareki', f.label + 'が和暦のままです（' + s + '）。西暦に直してください', k); return; }
          var ok = f.type === 'date' ? isRealDate(s) : isRealMonth(s);
          if (!ok) { problem('block', 'badDate', f.label + 'の形が正しくありません（' + s + '）。' + (f.type === 'date' ? 'YYYY-MM-DD' : 'YYYY-MM') + ' の形で書きます', k); return; }
          if (f.pastOnly) {
            var cut = f.type === 'date' ? today : today.slice(0, 7);
            if (s > cut) problem('warn', 'future', f.label + 'が未来の日付です（' + s + '）', k);
            else if (birth && s < (f.type === 'date' ? birth : birth.slice(0, 7))) {
              problem('warn', 'beforeBirth', f.label + '：生まれる前の日付です。妊娠中の記録ならこのままで大丈夫です', k);
            }
          }
          return;
        }
        if (f.type === 'select') {
          var vals = optionValues(f, schema);
          if (vals && vals.indexOf(v) < 0) problem('warn', 'notInOptions', f.label + '「' + v + '」は選択肢にありません', k);
          return;
        }
        if (f.type === 'number' && (v === '' || isNaN(Number(v)))) { problem('warn', 'notInOptions', f.label + 'が数ではありません（' + v + '）', k); return; }
        if (f.type === 'template' && !findTemplate(templates, v)) {
          problem(type === 'process' ? 'block' : 'warn', 'noTemplate', '手続きの型「' + v + '」がありません', k);
        }
      });

      // 3. 手続き：締め切りがなく、型に「生年月日から決める」があれば、それを入れる
      var tpl = type === 'process' ? findTemplate(templates, rec.templateId) : null;
      if (tpl && !rec.deadline && birth) {
        var bd = birthDeadline(tpl, birth);
        if (bd && bd.date) {
          rec.deadline = bd.date;
          item.defaulted.push('deadline');
          problem('info', 'deadlineFromBirth', '締め切りがないので、生年月日から「' + bd.label + '」（' + bd.date + '）を入れました', 'deadline');
        }
      }

      // 4. 必須の項目（値がないもの）
      def.fields.forEach(function (f) {
        if (f.required && !(f.key in rec) && !item.problems.some(function (p) { return p.key === f.key && p.level === 'block'; })) {
          // 手続きは、型と締め切りがないと工程を作れないので取り込めない
          problem(type === 'process' ? 'block' : 'warn', 'required', f.label + 'がありません', f.key);
        }
      });

      // 5. 入っていない項目に、ふだんの入力と同じ初めの値を入れる（必須の項目には入れない＝推測で埋めない）
      def.fields.forEach(function (f) {
        if (f.default === undefined || f.required || f.hidden || f.key in rec) return;
        rec[f.key] = (type === 'profile' && f.key === 'visibility' && (schema.options.categoryVisibility || {})[rec.category]) || f.default;
        item.defaulted.push(f.key);
      });

      // 6. AIが自信のない項目（取り込む項目にあるものだけ）
      (Array.isArray(raw.unclear) ? raw.unclear : []).forEach(function (k) {
        k = String(k);
        if (k in rec && item.unclear.indexOf(k) < 0 && item.defaulted.indexOf(k) < 0) item.unclear.push(k);
      });
      if (item.unclear.length) {
        problem('warn', 'unclear', 'AIが自信がない項目：' + item.unclear.map(function (k) { return fields[k].label; }).join('、'));
      }

      if (type !== 'process') rec.sourceFile = item.from;

      // 7. 重なり（今のデータ → ファイルの中の前の記録）
      if (type === 'process') {
        if (tpl) {
          var running = alive(db.tasks).filter(function (t) {
            return t.templateId === tpl.id && t.childId === childId && t.status === 'todo';
          });
          if (running.length) item.duplicateOf = { col: 'tasks', id: running[0].processId, index: -1, text: duplicateText('process', running[0]) };
          // 型の受給者証の種類に合うものが1つだけなら、最初から選んでおく
          var certs = alive(db.certificates).filter(function (c) {
            return c.childId === childId && (tpl.certificateKinds || []).indexOf(c.kind) >= 0;
          });
          if (certs.length === 1) item.certificateId = certs[0].id;
        }
        var pkey = rec.templateId ? 'process|' + rec.templateId : '';
        if (!item.duplicateOf && pkey && seen[pkey]) item.duplicateOf = { col: '', id: '', index: seen[pkey][0].index, text: duplicateText('process', seen[pkey][0].rec) };
        if (pkey) (seen[pkey] = seen[pkey] || []).push({ index: index, rec: rec });
        if (item.duplicateOf) problem('warn', 'duplicate', item.duplicateOf.index >= 0
          ? 'このファイルの中に、同じ手続きがもう1つあります'
          : 'この手続きは、もう始まっています（' + item.duplicateOf.text + '）');
        return finish(item);
      }
      var key = duplicateKey(type, rec);
      if (key) {
        var hit = alive(db[type]).filter(function (r) {
          return r.childId === childId && duplicateKey(type, r) === key && sameDuplicate(type, r, rec);
        })[0];
        if (hit) item.duplicateOf = { col: type, id: hit.id, index: -1, text: duplicateText(type, hit) };
        else {
          var prev = (seen[type + '|' + key] || []).filter(function (x) { return sameDuplicate(type, x.rec, rec); })[0];
          if (prev) item.duplicateOf = { col: '', id: '', index: prev.index, text: duplicateText(type, prev.rec) };
        }
        (seen[type + '|' + key] = seen[type + '|' + key] || []).push({ index: index, rec: rec });
      }
      if (item.duplicateOf) {
        problem('warn', 'duplicate', item.duplicateOf.index >= 0
          ? 'このファイルの中に、同じものがもう1つあります（' + item.duplicateOf.text + '）'
          : 'すでに同じものがありそうです（' + item.duplicateOf.text + '）');
      }
      return finish(item);
    });

    function finish(item) {
      item.canImport = !item.problems.some(function (p) { return p.level === 'block'; });
      item.checked = item.canImport && !item.problems.some(function (p) { return p.level === 'warn'; });
      return item;
    }
  }

  /**
   * 確認の画面でチェックした記録を、保存できる形 [{ col, rec }] にする。
   *   items     … checkImport() の結果（checked が true で、canImport も true のものだけ使う）
   *   childId   … 取り込む先の子ども
   *   templates … src/templates.json
   *   today     … 'YYYY-MM-DD'（手続きの工程の目安日を、今日より前にしないため）
   *   opts      … { db: 今のデータ }（工程の連絡先・子どもの情報の並び順に使う）
   * process は planProcess() で工程ごとのタスクにする。手続きの受給者証は item.certificateId（画面で選ぶ）。
   */
  function applyImport(items, childId, templates, today, opts) {
    opts = opts || {};
    var db = opts.db || {};
    var now = nowIso();
    var out = [];
    var mine = function (col) { return alive(db[col]).filter(function (r) { return r.childId === childId; }); };
    var picked = (items || []).filter(function (it) { return it && it.checked && it.canImport; });
    var order = mine('profile').reduce(function (m, p) { return Math.max(m, Number(p.order) || 0); }, 0);
    // 先に記録を作る（同じファイルの医療機関を、手続きの連絡先に使えるように）
    picked.forEach(function (it) {
      if (it.type === 'process') return;
      var rec = { id: uuid(), createdAt: now, updatedAt: now, deleted: false, childId: childId };
      Object.keys(it.rec).forEach(function (k) { rec[k] = it.rec[k]; });
      if (it.type === 'profile') rec.order = ++order;
      out.push({ col: it.type, rec: rec });
    });
    var byKind = {};
    mine('contacts').concat(out.filter(function (x) { return x.col === 'contacts'; }).map(function (x) { return x.rec; }))
      .forEach(function (c) { if (c.kind && !byKind[c.kind]) byKind[c.kind] = c.id; });
    picked.forEach(function (it) {
      if (it.type !== 'process') return;
      var tpl = findTemplate(templates, it.rec.templateId);
      if (!tpl || !it.rec.deadline) return;
      planProcess(tpl, it.rec.deadline, {
        childId: childId, today: today || ymd(), contactIdsByKind: byKind,
        certificateId: it.certificateId || '', processName: it.rec.name || tpl.name
      }).forEach(function (t) { out.push({ col: 'tasks', rec: t }); });
    });
    return out;
  }

  // ---------- サンプルデータ（すべて架空） ----------
  function buildSample(today, templates) {
    today = today || ymd();
    var now = nowIso();
    function rec(o) { o.id = uuid(); o.createdAt = now; o.updatedAt = now; o.deleted = false; return o; }
    var birth = addDays(today, -640);
    var child = rec({ nickname: 'さくら（サンプル）', fullName: '見本 さくら', furigana: 'みほん さくら', birthDate: birth,
      prefecture: '神奈川県', municipality: '横浜市○○区（架空）', address: '〒000-0000 神奈川県横浜市○○区○○町1-2-3（架空）', phone: '', note: 'これは架空のサンプルです' });
    var cid = child.id;

    function fam(relation, name, order, extra) {
      return rec(Object.assign({ childId: cid, relation: relation, name: name, birthDate: '', occupation: '', phone: '', address: '',
        emergencyOrder: order || '', livesTogether: '同居', visibility: 'supporter', note: '' }, extra || {}));
    }
    var family = [
      fam('母', '見本 花子', 1, { phone: '090-0000-0000', occupation: '会社員' }),
      fam('父', '見本 太郎', 2, { phone: '090-0000-1111', occupation: '会社員' }),
      fam('祖母', '見本 春子', 3, { phone: '000-000-0000', livesTogether: '別居', address: '（架空）○○県○○市' })
    ];

    var ord = 0;
    function p(category, label, value, extra) {
      ord += 1;
      return rec(Object.assign({ childId: cid, category: category, label: label, value: value, caution: '', validFrom: '', validTo: '', visibility: 'supporter', order: ord, note: '' }, extra || {}));
    }
    var profile = [
      p('基本情報', '通っている園・学校', '（架空）○○保育園（週3日）'),
      p('特徴と関わり方', '見て覚える', '言葉より、身ぶりや絵で見せると伝わりやすいです。まねをするのが得意です。', { visibility: 'all' }),
      p('特徴と関わり方', '疲れやすさ', '同じ運動量でも疲れやすいです。眠そうなサインが出たら休ませてください。', { visibility: 'all' }),
      p('特徴と関わり方', '慣れない場所で', '人が多いと緊張して表情がかたくなります。慣れると声が出てきます。', { visibility: 'all' }),
      p('好きなこと・遊び', '好きな遊び', 'ハイハイで追いかけっこ、揺らし遊び', { caution: '首が弱いので、揺らすときは首を支えてください', visibility: 'all' }),
      p('好きなこと・遊び', '好きな音・音楽', '手遊び歌、太鼓の音', { visibility: 'all' }),
      p('苦手なこと', '触られるのが苦手なところ', '顔（特に鼻のまわり）', { visibility: 'all' }),
      p('食事', 'ミルクの種類', '（架空）ミルクA'),
      p('食事', 'ミルク1回の量', '160ml（口から飲めない分はチューブから）'),
      p('食事', '離乳食・食事の形態', 'ペースト食'),
      p('食事', '食物アレルギー', '牛乳・卵・小麦は確認済みで問題なし', { visibility: 'all' }),
      p('睡眠', '眠い時のサイン', '目をこする、ぼんやりする', { visibility: 'all' }),
      p('医療・服薬', '服薬', '（架空）お薬A　朝・夕'),
      p('医療・服薬', '在宅酸素', '夜間のみ使用', { validFrom: addDays(today, -600), validTo: addDays(today, -60) }),
      p('医療・服薬', '在宅酸素', '終了（手術のため）', { validFrom: addDays(today, -60) }),
      p('出生時の様子', '身長・体重・頭囲・胸囲', '（架空）体重2,100g　身長44cm', { visibility: 'family' }),
      p('本人・家族の意向', '家族の願い', 'いろいろな食べ物を楽しめるようになってほしい', { visibility: 'family' })
    ];

    function sc(time, activity, kind) { return rec({ childId: cid, time: time, activity: activity, kind: kind, note: '' }); }
    var schedule = [
      sc('06:00', 'ミルク1回目', '食事・ミルク'), sc('07:00', '起きる', '睡眠'), sc('09:00', 'ミルク2回目', '食事・ミルク'),
      sc('12:00', '離乳食', '食事・ミルク'), sc('13:00', 'ミルク3回目', '食事・ミルク'), sc('14:00', 'お昼寝', '睡眠'),
      sc('17:00', 'お風呂', '入浴'), sc('19:00', 'ミルク4回目', '食事・ミルク'), sc('21:00', '寝る', '睡眠')
    ];

    function dg(name, ym, dept, status, explanation, extra) {
      return rec(Object.assign({ childId: cid, name: name, detail: '', diagnosedOn: ym, department: dept, status: status, explanation: explanation, visibility: 'supporter', note: '' }, extra || {}));
    }
    var diagnoses = [
      dg('（架空）○○症候群', birth.slice(0, 7), '○○こども病院 遺伝科', '経過観察中', '（架空の説明）体力がつきにくく、かぜが重くなりやすいです。見て覚えるのが得意です。'),
      dg('（架空）心臓の病気', birth.slice(0, 7), '○○こども病院 循環器科', '治療中', '（架空の説明）汗をたくさんかく、呼吸が苦しそうなときは家族に連絡してください。')
    ];

    function c(kind, name, department, phone, hours, extra) {
      return rec(Object.assign({ childId: cid, kind: kind, name: name, department: department || '', person: '', phone: phone || '', hours: hours || '', address: '', visitPattern: '', supplies: '', note: '' }, extra || {}));
    }
    var contacts = [
      c('病院', '○○こども病院', '循環器科', '03-0000-0000', '平日 9:00〜17:00', { person: '主治医：○○先生', visitPattern: '月1回、心臓の経過観察', supplies: '（架空）お薬A、酸素のチューブ' }),
      c('病院', '○○こども病院', '総合診療科', '03-0000-0000', '平日 9:00〜17:00', { visitPattern: '月1回、食事と体重の確認', supplies: '経管栄養チューブ' }),
      c('病院', '○○クリニック', '小児科', '03-0000-0500', '', { visitPattern: 'かぜ・予防接種' }),
      c('訪問看護', '○○訪問看護ステーション', '', '03-0000-0800', '', { person: '△△さん', visitPattern: '週1回、体調の確認とチューブ交換' }),
      c('療育', '○○療育センター', '理学療法', '03-0000-1111', '平日 9:00〜16:00', { visitPattern: '月2回、運動の訓練' }),
      c('相談支援', '○○相談支援センター', '', '03-0000-2222', '平日 9:00〜17:00', { person: '△△さん' }),
      c('役所', '○○区福祉保健センター（架空）', '障害者支援担当', '045-000-3333', '平日 8:45〜17:00'),
      c('医療機器業者', '○○メディカル', '在宅酸素', '0120-000-000', '24時間', { person: '△△さん', note: '災害時・停電時に連絡' })
    ];
    var byKind = {};
    contacts.forEach(function (x) { if (!byKind[x.kind]) byKind[x.kind] = x.id; });

    function cert(kind, days, templateId, extra) {
      return rec(Object.assign({ childId: cid, kind: kind, status: '取得済み', name: '', issuerNumber: '', issuerName: '', number: '（架空）000000', grade: '', disease: '', copay: '',
        issuedOn: '', validUntil: days === null ? '' : addDays(today, days), renewalNote: '', templateId: templateId || '', note: '' }, extra || {}));
    }
    var certs = [
      cert('健康保険証', null, '', { issuerName: '（架空）○○健康保険組合', issuerNumber: '00000000' }),
      cert('小児医療証（子ども医療証）', null, '', { renewalNote: '毎年自動で更新' }),
      cert('身体障害者手帳', 400, 'shintai-recheck', { grade: '（架空）3級', gradeCode: '3級', disabilityType: '内部障害（心臓・じん臓・呼吸器など）', fareClass: '第2種', renewalNote: '再認定の期日あり' }),
      cert('小児慢性特定疾病医療受給者証', 70, 'shoman-renew', { disease: '（架空）心臓の病気', copay: '月額上限 ○○円・2割', renewalNote: '毎年更新。文書料が必要' }),
      cert('療育手帳', null, 'ryouiku-renew', { status: '未取得・取得予定', number: '', note: '2歳以降に取得予定' })
    ];
    var tasks = [];
    var tpl = findTemplate(templates, 'shoman-renew');
    if (tpl) {
      tasks = planProcess(tpl, certs[3].validUntil, { childId: cid, certificateId: certs[3].id, processName: '小児慢性の受給者証の更新', today: today, contactIdsByKind: byKind });
      tasks[0].status = 'done';
      tasks[0].doneAt = today;
    }
    tasks.push(rec({ childId: cid, title: '保育園に来月の注入時間の変更を伝える', processId: '', processName: '', templateId: '', stepNo: '', dependsOn: [], dueDate: addDays(today, 3), window: 'night', scheduledDate: '', contactId: '', script: '連絡帳に書く', assignee: '母', status: 'todo', doneAt: '', certificateId: '', note: '' }));

    var proc = rec({ childId: cid, title: '経管栄養（注入）', status: '実施中', startedOn: addDays(today, -300), endedOn: '',
      reason: '（架空）口からの食事だけでは体重が増えないため', history: '（架空）開始後1か月で体重が500g増えたため継続',
      dose: '（例）1回○ml × 1日○回', schedule: '（例）6:00、9:00、13:00、16:00、19:00、22:00', baseline: '',
      equipment: '（例）経鼻胃管 ○Fr・○cm', supplies: 'シリンジ、白湯、固定用テープ', supplierContactId: '', visibility: 'supporter', note: '' });
    var order = 0;
    function st(section, text, criteria) {
      order += 1;
      return rec({ procedureId: proc.id, section: section, order: order, text: text, criteria: criteria || '', photoUrl: '' });
    }
    var steps = [
      st('いつ・どれだけ', '（例）主治医の指示どおり：口から飲めた残りをチューブから入れる', '食事が取れなかった時の追加は、家族に確認する'),
      st('準備', '石けんで手を洗う'),
      st('準備', '栄養剤・シリンジ・白湯を用意する'),
      st('実施前の確認', '（例）チューブの印の位置がずれていないか見る', 'ずれている・確認できない時は注入せず家族に連絡'),
      st('実施', '（例）ゆっくり○分以上かけて入れる'),
      st('中断の判断', '咳き込んだ・泣いた時は一度止める', '落ち着いてから再開する。止まらない時は家族に連絡'),
      st('実施後', '白湯○mlでチューブ内を流す', 'チューブが詰まるのを防ぐため'),
      st('注意点', '体調が悪い時は、無理に全部入れない', '吐きやすい時は1回の量を減らす'),
      st('いつもと違う時', 'チューブが抜けた時は入れ直さず、家族に連絡する'),
      st('交換・入れ直し', '（例）チューブの交換は週1回、家で家族が行う'),
      st('緊急時と連絡先', '顔色が悪い・呼吸が苦しそうな時はすぐ救急車（119）', '搬送の希望先：○○こども病院')
    ];
    var o2 = rec({ childId: cid, title: '在宅酸素療法', status: '終了', startedOn: addDays(today, -600), endedOn: addDays(today, -60),
      reason: '（架空）血液中の酸素を補うため', history: '（架空）0.5L/分 → 1L/分 → 手術後に終了', dose: '（例）○L/分', schedule: '夜間',
      baseline: '（例）SpO2 平時 ○〜○%', equipment: '酸素濃縮器、酸素ボンベ（外出時）', supplies: '鼻のチューブ（カニューラ）、固定用テープ',
      supplierContactId: contacts[7].id, visibility: 'supporter', note: '' });
    steps.push(rec({ procedureId: o2.id, section: '注意点', order: 1, text: '火から2m以上はなす', criteria: '', photoUrl: '' }));

    function v(kind, date, facility, department, summary, extra) {
      return rec(Object.assign({ childId: cid, kind: kind, date: date, endDate: '', facility: facility, department: department || '', doctor: '',
        summary: summary, symptoms: '', treatment: '', result: '', note: '' }, extra || {}));
    }
    var visits = [
      v('受診', addDays(today, -14), '○○こども病院', '循環器科', '（架空）定期受診。体重が増えている'),
      v('入院', addDays(today, -75), '○○こども病院', '循環器科', '（架空）心臓の手術', {
        endDate: addDays(today, -60), doctor: '○○先生', symptoms: '（架空）成長にともない呼吸が苦しくなってきた',
        treatment: '（架空）手術', result: '（架空）経過は良好。在宅酸素は終了',
        sourceFile: '2026-08-01_退院療養計画書_架空.pdf' }), // 元の書類（人に渡す書類には印刷しない）
      v('医療的ケアの開始・変更', addDays(today, -300), '○○こども病院', '耳鼻科', '（架空）経管栄養を始めるため入院', { endDate: addDays(today, -297) })
    ];
    function ms(item, days, ageText) {
      return rec({ childId: cid, item: item, achievedOn: days === null ? '' : addDays(birth, days), ageText: ageText || '', note: '' });
    }
    var milestones = [ms('追視', 60), ms('首すわり', 150), ms('寝返り', 240), ms('おすわり', null, '1歳2ヶ月')];
    milestones[1].sourceFile = '2025-06-01_健診結果_架空.pdf';
    return {
      childId: cid,
      collections: {
        children: [child], family: family, profile: profile, schedule: schedule, diagnoses: diagnoses, contacts: contacts,
        certificates: certs, careProcedures: [proc, o2], careSteps: steps, visits: visits, milestones: milestones, tasks: tasks,
        benefitChecks: [rec({ childId: cid, benefitId: 'tetsudo', benefitName: '鉄道・バスなどの運賃の割引', status: '利用している', checkedOn: addDays(today, -200), note: '（架空）' })]
      }
    };
  }

  return {
    CURRENT_SCHEMA_VERSION: CURRENT_SCHEMA_VERSION,
    EXPORT_FORMAT: EXPORT_FORMAT,
    ymd: ymd, parseYmd: parseYmd, addDays: addDays, diffDays: diffDays, fmtMD: fmtMD, fmtDate: fmtDate, fmtYm: fmtYm, ageText: ageText,
    nowIso: nowIso, uuid: uuid, alive: alive, indexById: indexById,
    isActionable: isActionable, dueLabel: dueLabel, findTemplate: findTemplate, groupTemplates: groupTemplates, planProcess: planProcess,
    addYears: addYears, processDeadline: processDeadline, nextYearName: nextYearName, nextRepeat: nextRepeat,
    schoolEntryDate: schoolEntryDate, birthDeadline: birthDeadline,
    certificateAlerts: certificateAlerts, summarize: summarize,
    certGrade: certGrade, ageYears: ageYears, suggestBenefits: suggestBenefits,
    buildDigestText: buildDigestText, buildDayText: buildDayText, toIcs: toIcs,
    makeExport: makeExport, migrate: migrate, upgradeCollections: upgradeCollections, mergeImport: mergeImport, buildSample: buildSample,
    IMPORT_FORMAT: IMPORT_FORMAT, IMPORT_TYPES: IMPORT_TYPES, parseImportText: parseImportText, checkImport: checkImport, applyImport: applyImport
  };
})();
