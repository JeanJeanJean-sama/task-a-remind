// このファイルは build.mjs が自動で作ります。直接編集せず、src/ を直して node build.mjs を実行してください。
var SCHEMA = {
  "name": "tasuka-remind",
  "title": "たすかReマインド データ定義書",
  "schemaVersion": 2,
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
    ],
    "categoryVisibility": {
      "出生時の様子": "family",
      "医療・服薬": "supporter",
      "本人・家族の意向": "family"
    },
    "labelSuggestions": {
      "基本情報": [
        "血液型",
        "身長",
        "体重",
        "通っている園・学校",
        "利用しているサービス",
        "言葉・コミュニケーション",
        "移動のしかた"
      ],
      "特徴と関わり方": [
        "成長のペース",
        "見て覚える",
        "体の特徴",
        "人との関わり",
        "疲れやすさ",
        "慣れない場所で",
        "伝わりやすい伝え方"
      ],
      "好きなこと・遊び": [
        "好きな遊び",
        "好きな音・音楽",
        "好きなおもちゃ",
        "好きな本",
        "好きな食べ物"
      ],
      "苦手なこと": [
        "苦手なこと",
        "苦手な音・場所",
        "触られるのが苦手なところ",
        "パニックになったとき"
      ],
      "食事": [
        "ミルクの種類",
        "ミルク1回の量",
        "ミルクの回数・時間",
        "ミルクの介助方法",
        "離乳食・食事の形態",
        "食事の介助方法",
        "食事の回数・時間",
        "食事の量",
        "食物アレルギー",
        "食事の注意点"
      ],
      "睡眠": [
        "寝る時間",
        "起きる時間",
        "お昼寝",
        "寝かしつけのしかた",
        "眠い時のサイン"
      ],
      "身体・アレルギー": [
        "アレルギー（食物）",
        "アレルギー（薬）",
        "体温の目安",
        "気をつける体の部位"
      ],
      "医療・服薬": [
        "服薬",
        "発作",
        "体調が悪い時のサイン",
        "受診の目安"
      ],
      "発達・できること": [
        "運動",
        "手先",
        "言葉",
        "身のまわりのこと",
        "発達検査の結果"
      ],
      "出生時の様子": [
        "出産日時",
        "身長・体重・頭囲・胸囲",
        "在胎週数・分娩の経過",
        "産院",
        "出産当時のメモ"
      ],
      "本人・家族の意向": [
        "家族の願い",
        "本人の希望",
        "目標"
      ],
      "その他": []
    },
    "milestoneSuggestions": [
      "追視",
      "首すわり",
      "寝返り",
      "ずりばい",
      "おすわり",
      "ハイハイ",
      "つかまり立ち",
      "伝い歩き",
      "ひとり歩き",
      "歯の生え始め",
      "指さし",
      "初めての言葉",
      "二語文",
      "スプーンで食べる",
      "コップで飲む",
      "トイレでおしっこ"
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
          "help": "家で呼んでいる名前。通知にも表示されます。"
        },
        {
          "key": "fullName",
          "label": "氏名",
          "type": "string"
        },
        {
          "key": "furigana",
          "label": "ふりがな",
          "type": "string"
        },
        {
          "key": "birthDate",
          "label": "生年月日",
          "type": "date",
          "help": "年齢（○歳○ヶ月）を自動で表示します。"
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
          "key": "address",
          "label": "住所",
          "type": "text",
          "help": "印刷では家族用にだけ載ります。"
        },
        {
          "key": "phone",
          "label": "自宅の電話番号",
          "type": "tel"
        },
        {
          "key": "note",
          "label": "メモ",
          "type": "text"
        }
      ]
    },
    "family": {
      "label": "家族・緊急連絡先",
      "sheet": "家族・緊急連絡先",
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
          "key": "relation",
          "label": "続柄",
          "type": "string",
          "required": true,
          "help": "例：父、母、祖父、きょうだい"
        },
        {
          "key": "name",
          "label": "氏名",
          "type": "string"
        },
        {
          "key": "birthDate",
          "label": "生年月日",
          "type": "date"
        },
        {
          "key": "occupation",
          "label": "職業",
          "type": "string"
        },
        {
          "key": "phone",
          "label": "電話番号",
          "type": "tel"
        },
        {
          "key": "address",
          "label": "住所",
          "type": "text"
        },
        {
          "key": "emergencyOrder",
          "label": "緊急連絡の順番",
          "type": "number",
          "help": "1、2…と入れると緊急連絡先として順に載ります。空欄なら緊急連絡先にしません。"
        },
        {
          "key": "livesTogether",
          "label": "同居",
          "type": "select",
          "options": [
            "同居",
            "別居"
          ]
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
          "label": "備考",
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
            "特徴と関わり方",
            "好きなこと・遊び",
            "苦手なこと",
            "食事",
            "睡眠",
            "身体・アレルギー",
            "医療・服薬",
            "発達・できること",
            "出生時の様子",
            "本人・家族の意向",
            "その他"
          ]
        },
        {
          "key": "label",
          "label": "項目名",
          "type": "string",
          "required": true,
          "suggestFrom": "labelSuggestions",
          "help": "候補から選ぶか、自由に入力します。"
        },
        {
          "key": "value",
          "label": "内容",
          "type": "text",
          "required": true
        },
        {
          "key": "caution",
          "label": "注意すること",
          "type": "text",
          "help": "例：首が弱いので支えが必要"
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
          "key": "order",
          "label": "並び順",
          "type": "number",
          "hidden": true
        },
        {
          "key": "note",
          "label": "メモ",
          "type": "text"
        }
      ]
    },
    "schedule": {
      "label": "生活リズム",
      "sheet": "生活リズム",
      "display": "activity",
      "fields": [
        {
          "key": "childId",
          "label": "子ども",
          "type": "ref",
          "ref": "children",
          "hidden": true
        },
        {
          "key": "time",
          "label": "時刻",
          "type": "time",
          "required": true
        },
        {
          "key": "activity",
          "label": "すること",
          "type": "string",
          "required": true,
          "help": "例：ミルク1回目、お昼寝、お風呂"
        },
        {
          "key": "kind",
          "label": "種類",
          "type": "select",
          "default": "食事・ミルク",
          "options": [
            "食事・ミルク",
            "睡眠",
            "医療的ケア",
            "服薬",
            "入浴",
            "通園・療育",
            "遊び",
            "その他"
          ]
        },
        {
          "key": "note",
          "label": "メモ",
          "type": "text"
        }
      ]
    },
    "diagnoses": {
      "label": "診断名",
      "sheet": "診断名",
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
          "key": "name",
          "label": "診断名",
          "type": "string",
          "required": true
        },
        {
          "key": "detail",
          "label": "正式名・補足",
          "type": "text"
        },
        {
          "key": "diagnosedOn",
          "label": "診断された時期",
          "type": "month"
        },
        {
          "key": "department",
          "label": "病院・診療科",
          "type": "string"
        },
        {
          "key": "status",
          "label": "いまの状態",
          "type": "select",
          "default": "経過観察中",
          "options": [
            "経過観察中",
            "治療中",
            "治療済み",
            "その他"
          ]
        },
        {
          "key": "explanation",
          "label": "支援者向けの説明",
          "type": "text",
          "help": "どんな病気・症状か、日常で気をつけること。サポートブックの「症状について」に載ります。"
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
          "help": "例：経鼻経管栄養、在宅酸素療法"
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
          "label": "開始の理由・目的",
          "type": "text"
        },
        {
          "key": "history",
          "label": "これまでの経過・変化",
          "type": "text",
          "help": "例：流量の変化、体重の変化、続けている理由"
        },
        {
          "key": "dose",
          "label": "量・設定",
          "type": "text",
          "help": "例：1回○ml×○回、酸素 ○L/分"
        },
        {
          "key": "schedule",
          "label": "実施する時間",
          "type": "text"
        },
        {
          "key": "baseline",
          "label": "いつもの様子・数値の目安",
          "type": "text",
          "help": "例：酸素飽和度（SpO2）平時○〜○%"
        },
        {
          "key": "equipment",
          "label": "器具・規格",
          "type": "text",
          "help": "例：チューブのサイズ・長さ"
        },
        {
          "key": "supplies",
          "label": "使う物・消耗品",
          "type": "text"
        },
        {
          "key": "supplierContactId",
          "label": "機器・業者の連絡先",
          "type": "ref",
          "ref": "contacts"
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
            "注意点",
            "いつもと違う時",
            "交換・入れ直し",
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
          "label": "判断の目安・補足",
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
            "日帰り入院",
            "検査",
            "手術",
            "診断",
            "医療的ケアの開始・変更",
            "事故・けが",
            "セカンドオピニオン",
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
          "key": "doctor",
          "label": "担当医",
          "type": "string"
        },
        {
          "key": "summary",
          "label": "概要",
          "type": "text",
          "required": true,
          "help": "一覧に出る短い説明。音声入力で話したままでもかまいません。"
        },
        {
          "key": "symptoms",
          "label": "症状・経緯",
          "type": "text"
        },
        {
          "key": "treatment",
          "label": "治療・検査の内容",
          "type": "text"
        },
        {
          "key": "result",
          "label": "結果・その後の経過",
          "type": "text"
        },
        {
          "key": "note",
          "label": "メモ",
          "type": "text"
        }
      ]
    },
    "milestones": {
      "label": "成長の記録",
      "sheet": "成長の記録",
      "display": "item",
      "fields": [
        {
          "key": "childId",
          "label": "子ども",
          "type": "ref",
          "ref": "children",
          "hidden": true
        },
        {
          "key": "item",
          "label": "できたこと",
          "type": "string",
          "required": true,
          "suggestFrom": "milestoneSuggestions",
          "help": "例：首すわり、ひとり歩き"
        },
        {
          "key": "achievedOn",
          "label": "できた日",
          "type": "date",
          "help": "日付を入れると、そのときの年齢を自動で出します。"
        },
        {
          "key": "ageText",
          "label": "できた時期",
          "type": "string",
          "help": "日付が分からないときに「1歳2ヶ月」のように入れます。"
        },
        {
          "key": "note",
          "label": "メモ",
          "type": "text"
        }
      ]
    },
    "certificates": {
      "label": "保険証・受給者証・手帳",
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
            "健康保険証",
            "小児医療証（子ども医療証）",
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
          "key": "status",
          "label": "状態",
          "type": "select",
          "default": "取得済み",
          "options": [
            "取得済み",
            "申請中",
            "未取得・取得予定"
          ]
        },
        {
          "key": "name",
          "label": "自治体での呼び名",
          "type": "string",
          "help": "例：愛の手帳（東京都）"
        },
        {
          "key": "issuerNumber",
          "label": "公費負担者番号・保険者番号",
          "type": "string"
        },
        {
          "key": "issuerName",
          "label": "発行元・保険者の名前",
          "type": "string"
        },
        {
          "key": "number",
          "label": "番号（受給者番号・記号番号など）",
          "type": "string"
        },
        {
          "key": "grade",
          "label": "区分・等級・種別",
          "type": "string"
        },
        {
          "key": "disease",
          "label": "対象の疾患名",
          "type": "string"
        },
        {
          "key": "copay",
          "label": "自己負担（上限額・割合）",
          "type": "text"
        },
        {
          "key": "issuedOn",
          "label": "取得日",
          "type": "date"
        },
        {
          "key": "validUntil",
          "label": "有効期限",
          "type": "date",
          "help": "ここから更新の手続きを知らせます。"
        },
        {
          "key": "renewalNote",
          "label": "更新の決まり",
          "type": "text",
          "help": "例：毎年更新、文書料が必要、自動更新"
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
    "contacts": {
      "label": "医療機関・関係機関",
      "sheet": "関係機関",
      "display": "name",
      "description": "同じ病院で診療科が複数あるときは、診療科ごとに1件ずつ登録する（画面では病院ごとにまとめて表示）。",
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
            "訪問看護",
            "医療機器業者",
            "福祉サービス",
            "相談支援",
            "保育園・学校",
            "子育て支援",
            "教室・親の会",
            "役所",
            "児童相談所",
            "その他"
          ]
        },
        {
          "key": "name",
          "label": "機関の名前",
          "type": "string",
          "required": true,
          "help": "例：○○こども病院"
        },
        {
          "key": "department",
          "label": "診療科・区分",
          "type": "string",
          "help": "例：循環器科、理学療法"
        },
        {
          "key": "person",
          "label": "主治医・担当者",
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
          "key": "address",
          "label": "住所",
          "type": "text"
        },
        {
          "key": "visitPattern",
          "label": "通院・利用のしかた",
          "type": "text",
          "help": "例：月1回、心臓の経過観察"
        },
        {
          "key": "supplies",
          "label": "処方・診療材料",
          "type": "text"
        },
        {
          "key": "note",
          "label": "備考",
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

  var CURRENT_SCHEMA_VERSION = 2;
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

  // ---------- サンプルデータ（すべて架空） ----------
  function buildSample(today, templates) {
    today = today || ymd();
    var now = nowIso();
    function rec(o) { o.id = uuid(); o.createdAt = now; o.updatedAt = now; o.deleted = false; return o; }
    var birth = addDays(today, -640);
    var child = rec({ nickname: 'さくら（サンプル）', fullName: '見本 さくら', furigana: 'みほん さくら', birthDate: birth,
      prefecture: '東京都', municipality: '○○市', address: '〒000-0000 東京都○○市○○町1-2-3（架空）', phone: '', note: 'これは架空のサンプルです' });
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
      c('役所', '○○市役所 障害福祉課', '', '03-0000-3333', '平日 8:30〜17:15'),
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
      cert('身体障害者手帳', 400, 'generic', { grade: '（架空）3級' }),
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
        treatment: '（架空）手術', result: '（架空）経過は良好。在宅酸素は終了' }),
      v('医療的ケアの開始・変更', addDays(today, -300), '○○こども病院', '耳鼻科', '（架空）経管栄養を始めるため入院', { endDate: addDays(today, -297) })
    ];
    function ms(item, days, ageText) {
      return rec({ childId: cid, item: item, achievedOn: days === null ? '' : addDays(birth, days), ageText: ageText || '', note: '' });
    }
    var milestones = [ms('追視', 60), ms('首すわり', 150), ms('寝返り', 240), ms('おすわり', null, '1歳2ヶ月')];
    return {
      childId: cid,
      collections: {
        children: [child], family: family, profile: profile, schedule: schedule, diagnoses: diagnoses, contacts: contacts,
        certificates: certs, careProcedures: [proc, o2], careSteps: steps, visits: visits, milestones: milestones, tasks: tasks
      }
    };
  }

  return {
    CURRENT_SCHEMA_VERSION: CURRENT_SCHEMA_VERSION,
    EXPORT_FORMAT: EXPORT_FORMAT,
    ymd: ymd, parseYmd: parseYmd, addDays: addDays, diffDays: diffDays, fmtMD: fmtMD, fmtDate: fmtDate, fmtYm: fmtYm, ageText: ageText,
    nowIso: nowIso, uuid: uuid, alive: alive, indexById: indexById,
    isActionable: isActionable, dueLabel: dueLabel, findTemplate: findTemplate, planProcess: planProcess,
    certificateAlerts: certificateAlerts, summarize: summarize,
    buildDigestText: buildDigestText, buildDayText: buildDayText, toIcs: toIcs,
    makeExport: makeExport, migrate: migrate, upgradeCollections: upgradeCollections, mergeImport: mergeImport, buildSample: buildSample
  };
})();
