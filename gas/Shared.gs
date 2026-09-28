// このファイルは build.mjs が自動で作ります。直接編集せず、src/ を直して node build.mjs を実行してください。
var SCHEMA = {
  "name": "tasuka-remind",
  "title": "たすかReマインド データ定義書",
  "schemaVersion": 1,
  "description": "子どもの情報を「1つの事実は1か所だけ」に保存するためのデータの形。ブラウザ保存・スプレッドシート・将来のデータベースのどれでも、この定義に従う。",
  "commonFields": [
    {
      "key": "id",
      "label": "ID",
      "type": "string",
      "help": "記録ごとの固有の番号（自動）。変更しない。"
    },
    {
      "key": "createdAt",
      "label": "作成日時",
      "type": "datetime",
      "help": "自動"
    },
    {
      "key": "updatedAt",
      "label": "更新日時",
      "type": "datetime",
      "help": "自動。移行・同期のとき、新しい方を判断するのに使う。"
    },
    {
      "key": "deleted",
      "label": "削除済み",
      "type": "bool",
      "help": "削除しても記録は残し、この印を付ける（同期のため）。"
    }
  ],
  "options": {
    "visibility": [
      {
        "value": "all",
        "label": "誰に見せてもよい"
      },
      {
        "value": "supporter",
        "label": "支援者まで"
      },
      {
        "value": "family",
        "label": "家族のみ"
      }
    ]
  },
  "collections": {
    "children": {
      "label": "子ども",
      "sheet": "子ども",
      "display": "nickname",
      "fields": [
        {
          "key": "nickname",
          "label": "呼び名",
          "type": "string",
          "required": true,
          "help": "通知にも表示されます。本名でなくてかまいません。"
        },
        {
          "key": "birthDate",
          "label": "生年月日",
          "type": "date"
        },
        {
          "key": "prefecture",
          "label": "都道府県",
          "type": "string"
        },
        {
          "key": "municipality",
          "label": "市区町村",
          "type": "string"
        },
        {
          "key": "note",
          "label": "メモ",
          "type": "text"
        }
      ]
    },
    "profile": {
      "label": "子どもの情報",
      "sheet": "子どもの情報",
      "display": "label",
      "description": "1項目1行。内容が変わったら古い行に「いつまで」を入れて残し、新しい行を追加する（履歴）。",
      "fields": [
        {
          "key": "childId",
          "label": "子ども",
          "type": "ref",
          "ref": "children",
          "hidden": true
        },
        {
          "key": "category",
          "label": "分類",
          "type": "select",
          "required": true,
          "default": "基本情報",
          "options": [
            "基本情報",
            "家族・緊急連絡先",
            "医療・服薬",
            "身体・アレルギー",
            "性格・特性・関わり方",
            "生活リズム・食事",
            "発達・できること",
            "本人・家族の意向",
            "その他"
          ]
        },
        {
          "key": "label",
          "label": "項目名",
          "type": "string",
          "required": true,
          "help": "例：アレルギー、好きなこと、落ち着く方法"
        },
        {
          "key": "value",
          "label": "内容",
          "type": "text",
          "required": true
        },
        {
          "key": "validFrom",
          "label": "いつから",
          "type": "date"
        },
        {
          "key": "validTo",
          "label": "いつまで",
          "type": "date",
          "help": "空欄＝今の情報。過去の情報になったら日付を入れる。"
        },
        {
          "key": "visibility",
          "label": "見せてよい範囲",
          "type": "select",
          "optionsRef": "visibility",
          "default": "supporter"
        },
        {
          "key": "note",
          "label": "メモ",
          "type": "text"
        }
      ]
    },
    "contacts": {
      "label": "関係機関",
      "sheet": "関係機関",
      "display": "name",
      "fields": [
        {
          "key": "childId",
          "label": "子ども",
          "type": "ref",
          "ref": "children",
          "hidden": true
        },
        {
          "key": "kind",
          "label": "種類",
          "type": "select",
          "required": true,
          "default": "病院",
          "options": [
            "病院",
            "療育",
            "福祉サービス",
            "相談支援",
            "保育園・学校",
            "役所",
            "訪問看護",
            "医療機器業者",
            "その他"
          ]
        },
        {
          "key": "name",
          "label": "名前",
          "type": "string",
          "required": true,
          "help": "例：○○こども病院 小児科"
        },
        {
          "key": "person",
          "label": "担当者",
          "type": "string"
        },
        {
          "key": "phone",
          "label": "電話番号",
          "type": "tel"
        },
        {
          "key": "hours",
          "label": "受付時間",
          "type": "string",
          "help": "例：平日 9:00〜17:00"
        },
        {
          "key": "note",
          "label": "メモ",
          "type": "text"
        }
      ]
    },
    "certificates": {
      "label": "受給者証・手帳・医療証",
      "sheet": "受給者証・手帳",
      "display": "kind",
      "fields": [
        {
          "key": "childId",
          "label": "子ども",
          "type": "ref",
          "ref": "children",
          "hidden": true
        },
        {
          "key": "kind",
          "label": "種類",
          "type": "select",
          "required": true,
          "default": "療育手帳",
          "options": [
            "療育手帳",
            "身体障害者手帳",
            "障害児通所受給者証",
            "障害福祉サービス受給者証",
            "小児慢性特定疾病医療受給者証",
            "重度障害者医療証",
            "特別児童扶養手当",
            "その他"
          ]
        },
        {
          "key": "name",
          "label": "自治体での呼び名",
          "type": "string",
          "help": "例：愛の手帳（東京都）"
        },
        {
          "key": "number",
          "label": "番号",
          "type": "string"
        },
        {
          "key": "grade",
          "label": "区分・等級",
          "type": "string"
        },
        {
          "key": "validUntil",
          "label": "有効期限",
          "type": "date",
          "help": "ここから更新の手続きを知らせます。"
        },
        {
          "key": "templateId",
          "label": "更新に使う手続きの型",
          "type": "template"
        },
        {
          "key": "note",
          "label": "メモ",
          "type": "text"
        }
      ]
    },
    "careProcedures": {
      "label": "医療的ケア手順書",
      "sheet": "医療的ケア手順書",
      "display": "title",
      "fields": [
        {
          "key": "childId",
          "label": "子ども",
          "type": "ref",
          "ref": "children",
          "hidden": true
        },
        {
          "key": "title",
          "label": "ケアの名前",
          "type": "string",
          "required": true,
          "help": "例：経管栄養（注入）"
        },
        {
          "key": "status",
          "label": "状態",
          "type": "select",
          "options": [
            "実施中",
            "終了"
          ],
          "default": "実施中"
        },
        {
          "key": "startedOn",
          "label": "開始日",
          "type": "date"
        },
        {
          "key": "endedOn",
          "label": "終了日",
          "type": "date"
        },
        {
          "key": "reason",
          "label": "開始の理由",
          "type": "text"
        },
        {
          "key": "equipment",
          "label": "使う器具・規格",
          "type": "text",
          "help": "例：チューブのサイズ・長さ"
        },
        {
          "key": "visibility",
          "label": "見せてよい範囲",
          "type": "select",
          "optionsRef": "visibility",
          "default": "supporter"
        },
        {
          "key": "note",
          "label": "メモ",
          "type": "text"
        }
      ]
    },
    "careSteps": {
      "label": "手順書の手順",
      "sheet": "手順書の手順",
      "display": "text",
      "fields": [
        {
          "key": "procedureId",
          "label": "手順書",
          "type": "ref",
          "ref": "careProcedures",
          "hidden": true
        },
        {
          "key": "section",
          "label": "項目",
          "type": "select",
          "required": true,
          "options": [
            "いつ・どれだけ",
            "準備",
            "実施前の確認",
            "実施",
            "中断の判断",
            "実施後",
            "いつもと違う時",
            "緊急時と連絡先"
          ]
        },
        {
          "key": "order",
          "label": "順番",
          "type": "number",
          "hidden": true
        },
        {
          "key": "text",
          "label": "やること",
          "type": "text",
          "required": true
        },
        {
          "key": "criteria",
          "label": "判断の目安",
          "type": "text",
          "help": "例：咳き込んだら一度止め、落ち着いてから再開"
        },
        {
          "key": "photoUrl",
          "label": "写真・動画のリンク",
          "type": "url",
          "help": "Googleドライブなどの共有リンク"
        }
      ]
    },
    "visits": {
      "label": "受診・入院の記録",
      "sheet": "受診・入院の記録",
      "display": "summary",
      "fields": [
        {
          "key": "childId",
          "label": "子ども",
          "type": "ref",
          "ref": "children",
          "hidden": true
        },
        {
          "key": "kind",
          "label": "種類",
          "type": "select",
          "default": "受診",
          "options": [
            "受診",
            "入院",
            "検査",
            "手術",
            "発達の記録",
            "その他"
          ]
        },
        {
          "key": "date",
          "label": "日付",
          "type": "date",
          "required": true
        },
        {
          "key": "endDate",
          "label": "終了日（入院など）",
          "type": "date"
        },
        {
          "key": "facility",
          "label": "病院・機関",
          "type": "string"
        },
        {
          "key": "department",
          "label": "診療科",
          "type": "string"
        },
        {
          "key": "summary",
          "label": "内容",
          "type": "text",
          "required": true,
          "help": "音声入力で話したままでもかまいません。"
        },
        {
          "key": "note",
          "label": "メモ",
          "type": "text"
        }
      ]
    },
    "tasks": {
      "label": "タスク",
      "sheet": "タスク",
      "display": "title",
      "description": "手続きは工程ごとのタスクに分け、「前の工程」が終わると次が出てくる。",
      "fields": [
        {
          "key": "childId",
          "label": "子ども",
          "type": "ref",
          "ref": "children",
          "hidden": true
        },
        {
          "key": "title",
          "label": "やること",
          "type": "string",
          "required": true
        },
        {
          "key": "processId",
          "label": "手続きのまとまりID",
          "type": "string",
          "hidden": true
        },
        {
          "key": "processName",
          "label": "手続き名",
          "type": "string",
          "hidden": true
        },
        {
          "key": "templateId",
          "label": "手続きの型",
          "type": "string",
          "hidden": true
        },
        {
          "key": "stepNo",
          "label": "工程番号",
          "type": "number",
          "hidden": true
        },
        {
          "key": "dependsOn",
          "label": "前の工程",
          "type": "refs",
          "ref": "tasks",
          "hidden": true
        },
        {
          "key": "dueDate",
          "label": "目安の期限",
          "type": "date"
        },
        {
          "key": "window",
          "label": "いつできるか",
          "type": "select",
          "default": "night",
          "options": [
            {
              "value": "night",
              "label": "夜でもできる（書類・ネット）"
            },
            {
              "value": "day",
              "label": "昼しかできない（電話・窓口）"
            }
          ]
        },
        {
          "key": "scheduledDate",
          "label": "昼にやる日",
          "type": "date",
          "help": "昼しかできないタスクを、この日の昼に1回だけ知らせます。"
        },
        {
          "key": "contactId",
          "label": "連絡先",
          "type": "ref",
          "ref": "contacts"
        },
        {
          "key": "script",
          "label": "伝えること・持ち物",
          "type": "text"
        },
        {
          "key": "assignee",
          "label": "担当",
          "type": "string",
          "help": "例：父、母"
        },
        {
          "key": "status",
          "label": "状態",
          "type": "select",
          "default": "todo",
          "options": [
            {
              "value": "todo",
              "label": "未完了"
            },
            {
              "value": "done",
              "label": "完了"
            },
            {
              "value": "skipped",
              "label": "対象外"
            }
          ]
        },
        {
          "key": "doneAt",
          "label": "完了日",
          "type": "date",
          "hidden": true
        },
        {
          "key": "certificateId",
          "label": "関係する受給者証・手帳",
          "type": "ref",
          "ref": "certificates"
        },
        {
          "key": "note",
          "label": "メモ",
          "type": "text"
        }
      ]
    }
  }
};

var TEMPLATES = {
  "version": 1,
  "caution": "これはサンプルの流れです。実際の手順・必要書類・かかる期間は、自治体や制度によって異なります。必ずお住まいの自治体の案内で確認し、必要に応じて工程を直してください。",
  "templates": [
    {
      "id": "ryouiku-renew",
      "name": "療育手帳の更新",
      "certificateKinds": [
        "療育手帳"
      ],
      "steps": [
        {
          "title": "更新の案内と必要書類を確認する",
          "window": "night",
          "daysBefore": 90,
          "script": "期限・必要なもの・判定（発達検査）の予約先を確認する"
        },
        {
          "title": "判定（発達検査）の予約を電話でとる",
          "window": "day",
          "daysBefore": 85,
          "contactKind": "療育",
          "script": "「療育手帳の更新の判定を予約したい」と伝える。子どもの名前・生年月日・手帳番号を手元に用意する"
        },
        {
          "title": "判定（発達検査）を受ける",
          "window": "day",
          "daysBefore": 60,
          "script": "予約した日時・持ち物を確認する"
        },
        {
          "title": "判定の結果を受け取る",
          "window": "day",
          "daysBefore": 30
        },
        {
          "title": "役所で更新を申請する",
          "window": "day",
          "daysBefore": 21,
          "contactKind": "役所",
          "script": "判定結果・今の手帳・写真など（自治体の案内で確認）。期限に間に合わない場合は、窓口で相談する"
        },
        {
          "title": "関係する医療証・受給者証の期限も確認する",
          "window": "night",
          "daysBefore": 14,
          "script": "手帳の更新が遅れると切れてしまう証明書がないか確認する"
        },
        {
          "title": "新しい手帳を受け取り、アプリの有効期限を直す",
          "window": "night",
          "daysBefore": 0
        }
      ]
    },
    {
      "id": "tsusho-renew",
      "name": "障害児通所受給者証の更新",
      "certificateKinds": [
        "障害児通所受給者証",
        "障害福祉サービス受給者証"
      ],
      "steps": [
        {
          "title": "更新の案内と必要書類を確認する",
          "window": "night",
          "daysBefore": 60
        },
        {
          "title": "相談支援専門員に連絡し、利用計画案の作成を依頼する",
          "window": "day",
          "daysBefore": 55,
          "contactKind": "相談支援",
          "script": "受給者証の更新時期と、今後使いたいサービス・日数を伝える"
        },
        {
          "title": "申請書類を記入する",
          "window": "night",
          "daysBefore": 45
        },
        {
          "title": "役所に申請する（窓口・郵送など自治体の方法で）",
          "window": "day",
          "daysBefore": 40,
          "contactKind": "役所"
        },
        {
          "title": "新しい受給者証を事業所に見せ、アプリの有効期限を直す",
          "window": "night",
          "daysBefore": 0,
          "script": "コピーを渡す・写真を送るなど、事業所の方法で"
        }
      ]
    },
    {
      "id": "shoman-renew",
      "name": "小児慢性特定疾病医療受給者証の更新",
      "certificateKinds": [
        "小児慢性特定疾病医療受給者証"
      ],
      "steps": [
        {
          "title": "更新の案内と必要書類を確認する",
          "window": "night",
          "daysBefore": 90
        },
        {
          "title": "主治医に意見書（診断書）を依頼する",
          "window": "day",
          "daysBefore": 75,
          "contactKind": "病院",
          "script": "更新用の医療意見書が必要なことと、提出の期限を伝える"
        },
        {
          "title": "意見書を受け取る",
          "window": "day",
          "daysBefore": 45
        },
        {
          "title": "申請書類をそろえる",
          "window": "night",
          "daysBefore": 40
        },
        {
          "title": "申請する",
          "window": "day",
          "daysBefore": 30,
          "contactKind": "役所"
        },
        {
          "title": "新しい受給者証を病院・薬局に見せ、アプリの有効期限を直す",
          "window": "night",
          "daysBefore": 0
        }
      ]
    },
    {
      "id": "generic",
      "name": "期限のある手続き（汎用）",
      "certificateKinds": [],
      "steps": [
        {
          "title": "必要なものを確認する",
          "window": "night",
          "daysBefore": 30
        },
        {
          "title": "申請・提出する",
          "window": "day",
          "daysBefore": 14
        },
        {
          "title": "完了を確認し、アプリの情報を直す",
          "window": "night",
          "daysBefore": 0
        }
      ]
    }
  ]
};

/*
 * たすかReマインド 共通ロジック
 * ブラウザ版（GitHub Pages / GASのWebアプリ）とGAS（サーバー側）の両方で使う。
 * 画面（DOM）や保存先に依存しない処理だけをここに置く。
 * 将来スマホアプリ・独自サーバーへ移行するときも、このファイルはそのまま使える想定。
 */
var Logic = (function () {
  'use strict';

  var CURRENT_SCHEMA_VERSION = 1;
  var EXPORT_FORMAT = 'tasuka-remind-export';

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
  function fmtMD(s) {
    var d = parseYmd(s);
    return d ? (d.getMonth() + 1) + '/' + d.getDate() : '';
  }
  function fmtDate(s) {
    var d = parseYmd(s);
    return d ? d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日' : '';
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
    var out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//tasuka-remind//JP', 'CALSCALE:GREGORIAN',
      'X-WR-CALNAME:' + icsEscape(opts.calName || 'たすかReマインド')];
    alive(tasks).forEach(function (t) {
      if (t.status !== 'todo') return;
      var date = (t.window === 'day' && t.scheduledDate) ? t.scheduledDate : t.dueDate;
      if (!date) return;
      var d = date.replace(/-/g, '');
      var end = addDays(date, 1).replace(/-/g, '');
      out.push('BEGIN:VEVENT', 'UID:' + t.id + '@tasuka-remind', 'DTSTAMP:' + stamp,
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

  /** 古い形式のデータを今の形に直す。定義を変えたらここに変換を足す。 */
  function migrate(data) {
    if (!data || data.format !== EXPORT_FORMAT || !data.collections) {
      throw new Error('たすかReマインドの書き出しファイルではありません');
    }
    var v = Number(data.schemaVersion || 1);
    if (v > CURRENT_SCHEMA_VERSION) {
      throw new Error('新しいバージョンのアプリで書き出されたデータです。アプリを更新してください');
    }
    // 例： if (v < 2) { ...v1→v2の変換...; v = 2; }
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

  // ---------- サンプルデータ（架空） ----------
  function buildSample(today, templates) {
    today = today || ymd();
    var now = nowIso();
    function rec(o) { o.id = uuid(); o.createdAt = now; o.updatedAt = now; o.deleted = false; return o; }
    var child = rec({ nickname: 'さくら（サンプル）', birthDate: addDays(today, -1650), prefecture: '東京都', municipality: '○○市', note: 'これは架空のサンプルです' });
    var cid = child.id;
    function p(category, label, value, extra) {
      return rec(Object.assign({ childId: cid, category: category, label: label, value: value, validFrom: '', validTo: '', visibility: 'supporter', note: '' }, extra || {}));
    }
    var profile = [
      p('基本情報', '呼ばれ方', 'さくちゃん'),
      p('家族・緊急連絡先', '緊急連絡先', '母：090-0000-0000／父：090-0000-1111', { visibility: 'supporter' }),
      p('医療・服薬', '主な診断名', '（架空）○○症候群', { visibility: 'family' }),
      p('医療・服薬', '服薬', '（架空）お薬A　朝・夕', { visibility: 'supporter' }),
      p('医療・服薬', '在宅酸素', '夜間のみ使用', { validFrom: addDays(today, -1500), validTo: addDays(today, -400) }),
      p('医療・服薬', '在宅酸素', '終了（手術のため）', { validFrom: addDays(today, -400) }),
      p('身体・アレルギー', 'アレルギー', 'なし（食物・薬とも）', { visibility: 'all' }),
      p('性格・特性・関わり方', '好きなこと', '音の出るおもちゃ、手遊び歌', { visibility: 'all' }),
      p('性格・特性・関わり方', '苦手なこと', '大きな音、急に触られること', { visibility: 'all' }),
      p('性格・特性・関わり方', '落ち着く方法', '抱っこして背中をトントンする', { visibility: 'all' }),
      p('生活リズム・食事', '食事', '経管栄養（注入）＋口から少量', { visibility: 'supporter' })
    ];
    function c(kind, name, phone, hours, person) {
      return rec({ childId: cid, kind: kind, name: name, person: person || '', phone: phone || '', hours: hours || '', note: '' });
    }
    var contacts = [
      c('病院', '○○こども病院 小児科', '03-0000-0000', '平日 9:00〜17:00'),
      c('療育', '○○療育センター', '03-0000-1111', '平日 9:00〜16:00'),
      c('相談支援', '○○相談支援センター', '03-0000-2222', '平日 9:00〜17:00', '△△さん'),
      c('役所', '○○市役所 障害福祉課', '03-0000-3333', '平日 8:30〜17:15'),
      c('医療機器業者', '○○メディカル', '0120-000-000', '24時間')
    ];
    var byKind = {};
    contacts.forEach(function (x) { if (!byKind[x.kind]) byKind[x.kind] = x.id; });
    function cert(kind, days, templateId, extra) {
      return rec(Object.assign({ childId: cid, kind: kind, name: '', number: '（架空）000000', grade: '', validUntil: addDays(today, days), templateId: templateId, note: '' }, extra || {}));
    }
    var certs = [
      cert('療育手帳', 85, 'ryouiku-renew', { grade: '（架空）B' }),
      cert('障害児通所受給者証', 200, 'tsusho-renew'),
      cert('小児慢性特定疾病医療受給者証', 70, 'shoman-renew')
    ];
    var tasks = [];
    var tpl = findTemplate(templates, 'shoman-renew');
    if (tpl) {
      tasks = planProcess(tpl, certs[2].validUntil, { childId: cid, certificateId: certs[2].id, processName: '小児慢性の受給者証の更新', today: today, contactIdsByKind: byKind });
      tasks[0].status = 'done';
      tasks[0].doneAt = today;
    }
    tasks.push(rec({ childId: cid, title: '保育園に来月の注入時間の変更を伝える', processId: '', processName: '', templateId: '', stepNo: '', dependsOn: [], dueDate: addDays(today, 3), window: 'night', scheduledDate: '', contactId: '', script: '連絡帳に書く', assignee: '母', status: 'todo', doneAt: '', certificateId: '', note: '' }));

    var proc = rec({ childId: cid, title: '経管栄養（注入）', status: '実施中', startedOn: addDays(today, -1600), endedOn: '', reason: '（架空）口からの食事だけでは栄養が足りないため', equipment: '（例）経鼻胃管 ○Fr・○cm', visibility: 'supporter', note: '' });
    var order = 0;
    function st(section, text, criteria) {
      order += 1;
      return rec({ procedureId: proc.id, section: section, order: order, text: text, criteria: criteria || '', photoUrl: '' });
    }
    var steps = [
      st('いつ・どれだけ', '（例）主治医の指示どおり：1日○回、1回○ml', '食事が取れなかった時の追加は、家族に確認する'),
      st('準備', '石けんで手を洗う'),
      st('準備', '栄養剤・シリンジ・白湯を用意する'),
      st('実施前の確認', '（例）チューブの印の位置がずれていないか見る', 'ずれている・確認できない時は注入せず家族に連絡'),
      st('実施', '（例）ゆっくり○分以上かけて入れる'),
      st('中断の判断', '咳き込んだ・泣いた時は一度止める', '落ち着いてから再開する。止まらない時は家族に連絡'),
      st('実施後', '白湯○mlでチューブ内を流す', 'チューブが詰まるのを防ぐため'),
      st('いつもと違う時', 'チューブが抜けた時は入れ直さず、家族に連絡する'),
      st('緊急時と連絡先', '顔色が悪い・呼吸が苦しそうな時はすぐ救急車（119）', '搬送の希望先：○○こども病院')
    ];
    function v(kind, date, facility, department, summary, endDate) {
      return rec({ childId: cid, kind: kind, date: date, endDate: endDate || '', facility: facility, department: department || '', summary: summary, note: '' });
    }
    var visits = [
      v('受診', addDays(today, -14), '○○こども病院', '小児科', '（架空）定期受診。体重が増えている。次回は3か月後'),
      v('入院', addDays(today, -410), '○○こども病院', '小児外科', '（架空）手術のため入院', addDays(today, -398)),
      v('発達の記録', addDays(today, -60), '', '', 'つかまり立ちができた！')
    ];
    return {
      childId: cid,
      collections: {
        children: [child], profile: profile, contacts: contacts, certificates: certs,
        careProcedures: [proc], careSteps: steps, visits: visits, tasks: tasks
      }
    };
  }

  return {
    CURRENT_SCHEMA_VERSION: CURRENT_SCHEMA_VERSION,
    EXPORT_FORMAT: EXPORT_FORMAT,
    ymd: ymd, parseYmd: parseYmd, addDays: addDays, diffDays: diffDays, fmtMD: fmtMD, fmtDate: fmtDate,
    nowIso: nowIso, uuid: uuid, alive: alive, indexById: indexById,
    isActionable: isActionable, dueLabel: dueLabel, findTemplate: findTemplate, planProcess: planProcess,
    certificateAlerts: certificateAlerts, summarize: summarize,
    buildDigestText: buildDigestText, buildDayText: buildDayText, toIcs: toIcs,
    makeExport: makeExport, migrate: migrate, mergeImport: mergeImport, buildSample: buildSample
  };
})();
