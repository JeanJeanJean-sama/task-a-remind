// このファイルは build.mjs が自動で作ります。直接編集せず、src/ を直して node build.mjs を実行してください。
var SCHEMA = {
  "name": "task-a-remind",
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
    "handbookGrades": [
      {
        "value": "1級",
        "label": "1級（身体・精神）"
      },
      {
        "value": "2級",
        "label": "2級（身体・精神）"
      },
      {
        "value": "3級",
        "label": "3級（身体・精神）"
      },
      {
        "value": "4級",
        "label": "4級（身体）"
      },
      {
        "value": "5級",
        "label": "5級（身体）"
      },
      {
        "value": "6級",
        "label": "6級（身体）"
      },
      {
        "value": "A1",
        "label": "A1（療育手帳・最重度）"
      },
      {
        "value": "A2",
        "label": "A2（療育手帳・重度）"
      },
      {
        "value": "B1",
        "label": "B1（療育手帳・中度）"
      },
      {
        "value": "B2",
        "label": "B2（療育手帳・軽度）"
      }
    ],
    "physicalTypes": [
      "視覚障害",
      "聴覚・平衡機能障害",
      "音声・言語・そしゃく機能障害",
      "肢体不自由（上肢）",
      "肢体不自由（下肢）",
      "肢体不自由（体幹）",
      "脳原性運動機能障害（上肢機能）",
      "脳原性運動機能障害（移動機能）",
      "内部障害（心臓・じん臓・呼吸器など）"
    ],
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
            "精神障害者保健福祉手帳",
            "障害児通所受給者証",
            "障害福祉サービス受給者証",
            "小児慢性特定疾病医療受給者証",
            "特定医療費（指定難病）受給者証",
            "自立支援医療受給者証",
            "重度障害者医療証",
            "特別児童扶養手当",
            "障害児福祉手当",
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
          "label": "区分・等級・種別（書いてあるとおり）",
          "type": "string"
        },
        {
          "key": "gradeCode",
          "label": "手帳の等級（選ぶ）",
          "type": "select",
          "optionsRef": "handbookGrades",
          "showIf": {
            "key": "kind",
            "in": [
              "身体障害者手帳",
              "療育手帳",
              "精神障害者保健福祉手帳"
            ]
          },
          "help": "等級を選ぶと「使えるかもしれない制度」の目安を出します。療育手帳は、自治体の呼び名がちがっても近いものを選びます。"
        },
        {
          "key": "disabilityType",
          "label": "障害の種類（身体障害者手帳）",
          "type": "select",
          "optionsRef": "physicalTypes",
          "showIf": {
            "key": "kind",
            "in": [
              "身体障害者手帳"
            ]
          },
          "help": "手帳に書かれている障害のうち、主なものを選びます。"
        },
        {
          "key": "disabilityType2",
          "label": "障害の種類（2つ目があれば）",
          "type": "select",
          "optionsRef": "physicalTypes",
          "showIf": {
            "key": "kind",
            "in": [
              "身体障害者手帳"
            ]
          }
        },
        {
          "key": "fareClass",
          "label": "旅客運賃の割引の種別",
          "type": "select",
          "options": [
            "第1種",
            "第2種"
          ],
          "showIf": {
            "key": "kind",
            "in": [
              "身体障害者手帳",
              "療育手帳",
              "精神障害者保健福祉手帳"
            ]
          },
          "help": "手帳の「旅客鉄道株式会社旅客運賃減額」の欄に書かれています。"
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
    "benefitChecks": {
      "label": "制度の確認",
      "sheet": "制度の確認",
      "display": "benefitName",
      "description": "「使えるかもしれない制度（目安）」を、利用者が確かめた結果。ここに記録した制度は、候補の一覧から外れる。",
      "fields": [
        {
          "key": "childId",
          "label": "子ども",
          "type": "ref",
          "ref": "children",
          "hidden": true
        },
        {
          "key": "benefitId",
          "label": "制度のID",
          "type": "string",
          "hidden": true,
          "help": "src/benefits.json の id"
        },
        {
          "key": "benefitName",
          "label": "制度の名前",
          "type": "string",
          "required": true
        },
        {
          "key": "status",
          "label": "状態",
          "type": "select",
          "required": true,
          "default": "利用している",
          "options": [
            "手続き中",
            "利用している",
            "対象外だった",
            "今は使わない"
          ]
        },
        {
          "key": "checkedOn",
          "label": "確認した日",
          "type": "date"
        },
        {
          "key": "note",
          "label": "メモ",
          "type": "text",
          "help": "例：窓口で、所得の条件にあてはまらないと言われた"
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
      "id": "shintai-recheck",
      "name": "身体障害者手帳の再認定（等級の見直し）",
      "certificateKinds": [
        "身体障害者手帳"
      ],
      "source": "横浜市「障害福祉のあんない2026」16頁（必要書類：写真・指定医師の身体障害者診断書など）",
      "steps": [
        {
          "title": "再認定の案内と必要書類を確認する",
          "window": "night",
          "daysBefore": 90,
          "script": "再認定の期日・診断書の様式・写真の大きさ（タテ4cm×ヨコ3cm）を確認する"
        },
        {
          "title": "指定医に身体障害者診断書を依頼する",
          "window": "day",
          "daysBefore": 75,
          "contactKind": "病院",
          "script": "「身体障害者手帳の再認定の診断書をお願いしたい」と伝え、提出の期限も伝える"
        },
        {
          "title": "診断書を受け取る",
          "window": "day",
          "daysBefore": 45
        },
        {
          "title": "区役所に申請する",
          "window": "day",
          "daysBefore": 30,
          "contactKind": "役所",
          "script": "診断書・写真・今の手帳・マイナンバーが確認できるもの・本人確認書類（自治体の案内で確認）"
        },
        {
          "title": "新しい手帳を受け取り、アプリの等級と期限を直す",
          "window": "night",
          "daysBefore": 0,
          "script": "等級が変わると、使える制度も変わることがあります"
        }
      ]
    },
    {
      "id": "seishin-renew",
      "name": "精神障害者保健福祉手帳の更新",
      "certificateKinds": [
        "精神障害者保健福祉手帳"
      ],
      "source": "横浜市「障害福祉のあんない2026」16〜17頁（必要書類・申請先）",
      "steps": [
        {
          "title": "更新の案内と必要書類を確認する",
          "window": "night",
          "daysBefore": 90,
          "script": "郵送・窓口・オンラインのどれで申請するかも決める"
        },
        {
          "title": "主治医に手帳用の診断書を依頼する",
          "window": "day",
          "daysBefore": 80,
          "contactKind": "病院",
          "script": "「精神障害者保健福祉手帳の更新の診断書をお願いしたい」と伝える"
        },
        {
          "title": "診断書を受け取る",
          "window": "day",
          "daysBefore": 50
        },
        {
          "title": "申請する（郵送・窓口・オンラインのどれか）",
          "window": "night",
          "daysBefore": 40,
          "script": "診断書・写真（必要な場合）・マイナンバーが確認できるもの・本人確認書類"
        },
        {
          "title": "新しい手帳を受け取り、アプリの期限を直す",
          "window": "night",
          "daysBefore": 0
        }
      ]
    },
    {
      "id": "apply-benefit",
      "name": "制度の申請（汎用）",
      "certificateKinds": [],
      "source": "横浜市「障害福祉のあんない2026」各制度の【窓口】【必要なもの】",
      "steps": [
        {
          "title": "窓口に、対象になるかと必要なものを聞く",
          "window": "day",
          "daysBefore": 28,
          "contactKind": "役所",
          "script": "「○○を使えるか知りたい」と伝える。手帳を手元に用意する"
        },
        {
          "title": "必要な書類をそろえる",
          "window": "night",
          "daysBefore": 21
        },
        {
          "title": "申請する（窓口・郵送など、案内された方法で）",
          "window": "day",
          "daysBefore": 14,
          "contactKind": "役所"
        },
        {
          "title": "結果を確認し、アプリに記録する",
          "window": "night",
          "daysBefore": 0,
          "script": "受給者証などが届いたら「保険証・受給者証・手帳」に登録する"
        }
      ]
    },
    {
      "id": "apply-benefit-doctor",
      "name": "診断書が必要な制度の申請",
      "certificateKinds": [],
      "source": "横浜市「障害福祉のあんない2026」各制度の【必要なもの】（診断書・意見書など）",
      "steps": [
        {
          "title": "窓口に、対象になるかと必要な書類・診断書の様式を聞く",
          "window": "day",
          "daysBefore": 45,
          "contactKind": "役所",
          "script": "「○○を申請したい」と伝え、診断書を省略できるかも聞く。手帳を手元に用意する"
        },
        {
          "title": "主治医に診断書（意見書）を依頼する",
          "window": "day",
          "daysBefore": 40,
          "contactKind": "病院",
          "script": "制度の名前と、提出の期限を伝える"
        },
        {
          "title": "診断書（意見書）を受け取る",
          "window": "day",
          "daysBefore": 21
        },
        {
          "title": "そのほかの書類をそろえる",
          "window": "night",
          "daysBefore": 18,
          "script": "戸籍・住民票などは、取ってからの期限が決まっていることがあります"
        },
        {
          "title": "申請する（窓口・郵送など、案内された方法で）",
          "window": "day",
          "daysBefore": 14,
          "contactKind": "役所"
        },
        {
          "title": "結果を確認し、アプリに記録する",
          "window": "night",
          "daysBefore": 0,
          "script": "認定の通知・受給者証などが届いたら「保険証・受給者証・手帳」に登録する"
        }
      ]
    },
    {
      "id": "tax-deduction",
      "name": "障害者控除を申告する（年末調整・確定申告）",
      "certificateKinds": [],
      "source": "横浜市「障害福祉のあんない2026」114〜115頁",
      "steps": [
        {
          "title": "手帳の等級を確かめ、障害者か特別障害者かを確認する",
          "window": "night",
          "daysBefore": 21
        },
        {
          "title": "年末調整の書類（扶養控除等の申告書）か確定申告に書く",
          "window": "night",
          "daysBefore": 14,
          "script": "勤務先の年末調整の書類に、子どもの障害者控除の欄がある"
        },
        {
          "title": "源泉徴収票などで、控除されたか確認する",
          "window": "night",
          "daysBefore": 0
        }
      ]
    },
    {
      "id": "tokuji-shotoku",
      "name": "特別児童扶養手当の所得状況届",
      "group": "毎年の届出",
      "certificateKinds": [
        "特別児童扶養手当"
      ],
      "repeat": "yearly",
      "checkedOn": "2026-11-03",
      "source": "横浜市「特別児童扶養手当」（2026-10-01更新）：所得状況届は毎年8月12日〜9月11日。出さないと8月分からの手当が受けられず、2年出さないと資格がなくなる。出す先は区の福祉保健センター（こども家庭支援課）。出し方（窓口・郵送）は届いた案内で確認する",
      "steps": [
        {
          "title": "届いた案内で、期間・提出先・持ち物を確かめる",
          "window": "night",
          "daysBefore": 30,
          "script": "横浜市では毎年8月12日〜9月11日が届出の期間。期限には9月11日を入れる（このタスクの期限＝提出の締め切り）。案内はスキャンして保管箱へ"
        },
        {
          "title": "書類に書いて、持ち物をそろえる",
          "window": "night",
          "daysBefore": 21,
          "script": "届出の用紙・本人確認書類など（案内に書いてあるもの）。用紙は市のページからも印刷できる。分からない欄は空けておき、窓口で聞く"
        },
        {
          "title": "提出する（窓口・郵送など案内の方法で）",
          "window": "day",
          "daysBefore": 14,
          "contactKind": "役所",
          "script": "区役所のこども家庭支援課へ。出さないと8月分からの手当が止まり、2年続けて出さないと資格がなくなる。間に合わないときは、締め切りの前に窓口へ電話して相談する"
        },
        {
          "title": "控えを保管する",
          "window": "night",
          "daysBefore": 0,
          "script": "提出した書類の写真かコピーを保管箱へ。次の年も同じ時期（8月12日〜9月11日）に届出がある。受給者証・手帳の「有効期限」は変えない（有効期限には再認定の期限だけを入れる）。次の年の分は、この手続きを終えたあとに始める"
        }
      ]
    },
    {
      "id": "tokuji-recheck",
      "name": "特別児童扶養手当の再認定（診断書の提出）",
      "group": "期限のあるもの",
      "certificateKinds": [
        "特別児童扶養手当"
      ],
      "checkedOn": "2026-11-03",
      "source": "横浜市「特別児童扶養手当」（2026-10-01更新）：期間を決めて認定（有期認定）された人は、期限までに診断書などを出さないと手当が受けられない。診断書は決まった様式（第1〜8号）をB4かA3で印刷して病院へ持っていく。期限は届いた案内で確認する",
      "steps": [
        {
          "title": "再認定の案内で、期限と診断書の様式を確かめる",
          "window": "night",
          "daysBefore": 75,
          "script": "案内に入っている診断書の用紙を使う。用紙は市のページからも印刷できる（B4かA3）。どの様式か分からなければ窓口に聞く"
        },
        {
          "title": "主治医に診断書を依頼する",
          "window": "day",
          "daysBefore": 70,
          "contactKind": "病院",
          "script": "「特別児童扶養手当の再認定の診断書をお願いしたい」と伝え、用紙を渡し、提出の期限も伝える。できあがりまでの日数と費用を聞く"
        },
        {
          "title": "診断書を受け取り、内容を確かめる",
          "window": "day",
          "daysBefore": 35,
          "script": "名前・生年月日の間違いがないか見る。コピーをとって保管箱へ（あとで障害年金などで役に立つ）"
        },
        {
          "title": "提出する",
          "window": "day",
          "daysBefore": 28,
          "contactKind": "役所",
          "script": "区役所のこども家庭支援課へ"
        },
        {
          "title": "結果の通知を受け取り、アプリの記録を直す",
          "window": "night",
          "daysBefore": 0,
          "script": "次の再認定の時期が書いてあれば、受給者証・手帳の「有効期限」に入れておく"
        }
      ]
    },
    {
      "id": "shojifukushi-shotoku",
      "name": "障害児福祉手当の所得状況届",
      "group": "毎年の届出",
      "certificateKinds": [
        "障害児福祉手当"
      ],
      "repeat": "yearly",
      "checkedOn": "2026-11-03",
      "source": "横浜市「障害児福祉手当／特別障害者手当」の案内（令和8年4月現在）：所得状況届は毎年8月12日〜9月11日。受付は区の福祉保健センター。横浜市「障害児福祉手当」（2026-08-03更新）。出し方は届いた案内で確認する",
      "steps": [
        {
          "title": "届いた案内で、期間・提出先・持ち物を確かめる",
          "window": "night",
          "daysBefore": 30,
          "script": "横浜市では毎年8月12日〜9月11日が届出の期間。期限には9月11日を入れる。特別児童扶養手当の届出と同じ期間なので、いっしょに準備すると楽"
        },
        {
          "title": "書類に書いて、持ち物をそろえる",
          "window": "night",
          "daysBefore": 21
        },
        {
          "title": "提出する（窓口・郵送など案内の方法で）",
          "window": "day",
          "daysBefore": 14,
          "contactKind": "役所",
          "script": "区の福祉保健センターへ。出さないと、手当が止まることがある"
        },
        {
          "title": "控えを保管する",
          "window": "night",
          "daysBefore": 0,
          "script": "提出した書類の写真かコピーを保管箱へ。次の年も同じ時期（8月12日〜9月11日）に届出がある。受給者証・手帳の「有効期限」は変えない（有効期限には再認定の期限だけを入れる）。次の年の分は、この手続きを終えたあとに始める"
        }
      ]
    },
    {
      "id": "judo-iryo-todoke",
      "name": "重度障害者医療証の変更の届出",
      "group": "期限のあるもの",
      "certificateKinds": [
        "重度障害者医療証"
      ],
      "checkedOn": "2026-11-03",
      "source": "横浜市「重度障害者医療費助成」の概要・更新の届出・届出が必要なときのページ（2026-08-20更新など）：所得と年齢の制限はない。医療証の有効期限や決まった時期の一斉の更新は、ページに書かれていない。手帳が更新されたときは、区役所の保険年金課（保険係）に届け出る",
      "steps": [
        {
          "title": "届出が必要か確かめる",
          "window": "night",
          "daysBefore": 14,
          "script": "手帳を更新した・健康保険が変わった・住所が変わった、などのとき。市外へ引っ越すときは、引っ越す前に届出（資格がなくなる）。マイナ保険証か資格確認書がないと、医療証は使えない"
        },
        {
          "title": "持ち物をそろえる",
          "window": "night",
          "daysBefore": 10,
          "script": "手帳を更新したとき：更新された手帳・今の医療証・健康保険の内容がわかるもの（資格確認書など）。届出書は窓口にある。ほかの届出の持ち物は区役所で確認"
        },
        {
          "title": "区役所の保険年金課（保険係）に届け出る",
          "window": "day",
          "daysBefore": 7,
          "contactKind": "役所",
          "script": "区内の引っ越しは今の区、市内の別の区へは引っ越し先の区に届け出る"
        },
        {
          "title": "新しい医療証を病院・薬局に見せ、アプリの記録を直す",
          "window": "night",
          "daysBefore": 0
        }
      ]
    },
    {
      "id": "shugaku-shorei",
      "name": "個別支援学級の就学奨励の申請",
      "group": "毎年の届出",
      "certificateKinds": [],
      "repeat": "yearly",
      "checkedOn": "2026-11-03",
      "source": "横浜市「個別支援学級就学奨励制度について」（2026-10-19更新）：様式は年度ごとで、令和8年度版は6月以降に学校から配られる。書類は子どもが通う学校へ出す。毎年申請が要るかはページに書かれていない。問い合わせは教育委員会の学校支援・地域連携課（就学係）",
      "steps": [
        {
          "title": "学校から配られた様式と締め切りを確かめる",
          "window": "night",
          "daysBefore": 21,
          "script": "例年6月以降に、個別支援学級からお知らせと様式が配られる。届いたら期限をアプリに入れ直す。毎年の申請が必要かは、学校か教育委員会の就学係に聞く"
        },
        {
          "title": "様式に書いて、必要なものをそろえる",
          "window": "night",
          "daysBefore": 14,
          "script": "収入額需要額調書・振込先の口座の書類など（お知らせに書いてあるもの）"
        },
        {
          "title": "学校に提出する",
          "window": "day",
          "daysBefore": 7,
          "contactKind": "保育園・学校"
        },
        {
          "title": "結果を確認し、控えを保管する",
          "window": "night",
          "daysBefore": 0
        }
      ]
    },
    {
      "id": "ikusei-recheck",
      "name": "自立支援医療（育成医療）の再認定",
      "group": "期限のあるもの",
      "certificateKinds": [
        "自立支援医療受給者証"
      ],
      "checkedOn": "2026-10-19",
      "source": "横浜市「自立支援医療（育成医療）」（2026-04-22更新）：手術と術後の通院は原則3か月以内、一部は最長1年。継続が必要なときは再認定の申請ができる",
      "steps": [
        {
          "title": "受給者証の期間が終わったあとも治療が続くか、病院に確かめる",
          "window": "day",
          "daysBefore": 45,
          "contactKind": "病院",
          "script": "「育成医療の期間が○月で終わるが、治療は続きますか。再認定の申請が必要ですか」と聞く"
        },
        {
          "title": "区役所に、再認定に必要な書類を聞く",
          "window": "day",
          "daysBefore": 40,
          "contactKind": "役所",
          "script": "窓口は区役所のこども家庭支援課。医師の意見書などが要るか確かめる"
        },
        {
          "title": "病院に必要な書類（意見書など）を依頼する",
          "window": "day",
          "daysBefore": 35,
          "contactKind": "病院"
        },
        {
          "title": "書類を受け取り、申請する",
          "window": "day",
          "daysBefore": 14,
          "contactKind": "役所",
          "script": "健康保険の情報・マイナンバーが確認できるもの・本人確認書類なども（案内で確認）"
        },
        {
          "title": "新しい受給者証を病院・薬局に見せ、アプリの期限を直す",
          "window": "night",
          "daysBefore": 0
        }
      ]
    },
    {
      "id": "yuryo-doro-renew",
      "name": "有料道路の障害者割引の更新",
      "group": "期限のあるもの",
      "certificateKinds": [],
      "checkedOn": "2026-11-03",
      "source": "横浜市「有料道路の障害者割引」（2025-03-21更新）：区の福祉保健センターで登録する。ETCを使う人は、マイナポータルからオンラインでも申請できる（新規・変更・更新）。期限の決まりは相模原市のページ（2025-07-28更新）：更新後は3回目の誕生日まで有効で、期限の2か月前から手続きできる。NEXCO東日本のお知らせ（2020-05-07）：期限が切れると新規の申請になる",
      "steps": [
        {
          "title": "手帳に書いてある割引の有効期限を確かめる",
          "window": "night",
          "daysBefore": 45,
          "script": "期限をこの手続きの期限に入れる。期限の2か月前から更新できる。切れると、更新ではなく新しい申請になってしまう"
        },
        {
          "title": "持ち物をそろえる",
          "window": "night",
          "daysBefore": 30,
          "script": "手帳・車検証（2023年1月以降に出た車検証なら「自動車検査証記録事項」も）・本人が運転するなら運転免許証・ETCを使うならETCカードと、車載器のセットアップ申込書・証明書。車やETCカードを替えたときも手続きが要る"
        },
        {
          "title": "区役所で更新の手続きをする",
          "window": "day",
          "daysBefore": 21,
          "contactKind": "役所",
          "script": "区の福祉保健センターへ。ETCを使う人は、マイナンバーカードでマイナポータルからオンラインでも申請できる"
        },
        {
          "title": "次の有効期限をアプリに入れる",
          "window": "night",
          "daysBefore": 0
        }
      ]
    },
    {
      "id": "hosogu-renew",
      "name": "補装具・日常生活用具の作り直し・再申請",
      "group": "期限のあるもの",
      "certificateKinds": [],
      "checkedOn": "2026-11-03",
      "source": "横浜市「補装具費を申請される皆様へ」（局改訂R0704）・「利用者向けページ（日常生活用具）」（2026-10-01更新）：どちらも、買う前・作る前に区の福祉保健センターに申請する。18歳未満の意見書は「補装具費支給意見書」。日常生活用具は、使える間は耐用年数をすぎても再給付されない。耐用年数・必要書類は品目ごとに違うので区役所で確認",
      "steps": [
        {
          "title": "今使っている用具の、使い始めた日と耐用年数を確かめる",
          "window": "night",
          "daysBefore": 90,
          "script": "日常生活用具は、使える間は耐用年数をすぎても作り直せない。壊れて直せないときは相談できる（業者の「修理できない」という証明が要ることがある）。体に合わなくなったときも相談する"
        },
        {
          "title": "区役所に、申請の流れと必要な書類を聞く",
          "window": "day",
          "daysBefore": 80,
          "contactKind": "役所",
          "script": "区の福祉保健センター（子どもはこども家庭支援課）。医師の意見書や、判定が必要かも聞く"
        },
        {
          "title": "業者に見積もりを頼む",
          "window": "day",
          "daysBefore": 70,
          "contactKind": "医療機器業者",
          "script": "横浜市に登録している業者に頼む"
        },
        {
          "title": "必要なら、医師に意見書を頼む",
          "window": "day",
          "daysBefore": 60,
          "contactKind": "病院",
          "script": "18歳未満の補装具は「補装具費支給意見書」の用紙を使う"
        },
        {
          "title": "区役所に申請する",
          "window": "day",
          "daysBefore": 45,
          "contactKind": "役所",
          "script": "決まる前に買ったり作ったりすると、対象にならない。決定の通知を待つ。子どもの申請では、保護者のマイナンバーも要る"
        },
        {
          "title": "決定の通知が届いたら、業者に注文する",
          "window": "day",
          "daysBefore": 14,
          "contactKind": "医療機器業者"
        },
        {
          "title": "受け取り、使い始める",
          "window": "night",
          "daysBefore": 0,
          "script": "この工程を「完了」にした日が、受け取った日として残る（次の作り直しの目安になる）。耐用年数がすぎるころに、もう一度この手続きを始める"
        }
      ]
    },
    {
      "id": "mynumber-renew",
      "name": "マイナンバーカードの更新",
      "group": "期限のあるもの",
      "certificateKinds": [],
      "checkedOn": "2026-11-03",
      "source": "横浜市「マイナンバーカード」のページ・「15歳未満の方の受け取り」（2026-10-28更新）：未成年のときに作ったカードは発行から5回目の誕生日まで。申請はスマートフォン・パソコン・郵送・写真機で。申請から1か月〜1か月半で交付通知書が届き、受け取りを予約する。15歳未満は親（法定代理人）といっしょに受け取りに行く",
      "steps": [
        {
          "title": "カードに書いてある有効期限と、届いた通知を確かめる",
          "window": "night",
          "daysBefore": 90,
          "script": "未成年のときに作ったカードは、発行から5回目の誕生日まで（大人は10回目）。未成年のときに作った人は、電子証明書だけでなくカードごと更新する"
        },
        {
          "title": "申請する（スマートフォン・パソコン・郵送・写真機）",
          "window": "night",
          "daysBefore": 75,
          "script": "顔写真が要る。今の子どもの写真を撮っておく"
        },
        {
          "title": "交付通知書（はがき）が届いたら、受け取りの予約をする",
          "window": "day",
          "daysBefore": 30,
          "contactKind": "役所",
          "script": "申請から1か月〜1か月半で届く。インターネットか電話（マイナンバーカード専用ダイヤル）で予約する。15歳未満は親がいっしょに行く。持ち物：交付通知書・今のカード・子どもと親の本人確認書類（はがきで確認）"
        },
        {
          "title": "受け取り、アプリの期限を直す",
          "window": "day",
          "daysBefore": 0,
          "script": "今のカードは返す（返さないと再交付の扱いで手数料がかかる）。健康保険証として使っている場合は、病院・薬局での使い方も確かめる"
        }
      ]
    },
    {
      "id": "shugaku-sodan",
      "name": "就学相談と就学先の決定（年長）",
      "group": "年齢の節目",
      "certificateKinds": [],
      "checkedOn": "2026-11-03",
      "source": "横浜市教育委員会 特別支援教育相談課「就学に向けての相談について」（令和9年4月入学者用）：学区の小学校の校長と面談し、個別支援学級を見学する。申込は特別支援教育総合センターへ、特別支援学校を考えるなら6月30日、個別支援学級・通級なら7月31日まで（郵送か電子申請）。発達検査の結果（1年以内）が要る。相談日が決まるまで最大6か月ほど。就学時健康診断の通知は10月ごろ区役所から届く",
      "steps": [
        {
          "title": "就学相談の申し込み方法と時期を調べる",
          "window": "night",
          "daysBefore": 420,
          "script": "期限には「小学校に入学する日（4月1日）」を入れる。横浜市の申込の締め切りは、特別支援学校を考えるなら年長の6月30日、個別支援学級・通級なら7月31日。年中のうちに調べ始めると余裕がある"
        },
        {
          "title": "療育・相談支援の担当に、就学について相談する",
          "window": "day",
          "daysBefore": 400,
          "contactKind": "療育",
          "script": "今の様子と、親の希望（通常の学級・個別支援学級・特別支援学校など）を伝える。申込には1年以内の発達検査の結果が要るので、検査の予定も聞く"
        },
        {
          "title": "学区の小学校に電話し、校長との面談と個別支援学級の見学を予約する",
          "window": "day",
          "daysBefore": 330,
          "contactKind": "保育園・学校",
          "script": "特別支援学校を考えている場合も、個別支援学級の見学は必要。医療的ケアがあるときは、学校でのケアの体制も聞く"
        },
        {
          "title": "就学相談を申し込む",
          "window": "night",
          "daysBefore": 300,
          "script": "申込書を特別支援教育総合センターへ郵送するか、横浜市の電子申請で送る。発達検査の結果は、紙ならコピーを付ける。締め切り（6月30日・7月31日）より早めに"
        },
        {
          "title": "特別支援学校など、ほかの学校の見学・体験に行く",
          "window": "day",
          "daysBefore": 270,
          "contactKind": "保育園・学校",
          "script": "特別支援学校を考える場合は、見学が必要"
        },
        {
          "title": "就学相談を受ける",
          "window": "day",
          "daysBefore": 200,
          "script": "日時は「相談日時決定通知」で届く（決まるまで最大6か月ほど）。相談は1時間半〜2時間。約4週間後に報告書が届く"
        },
        {
          "title": "就学時健康診断を受ける",
          "window": "day",
          "daysBefore": 150,
          "script": "10月ごろ、区役所から通知が届く"
        },
        {
          "title": "就学先を決める",
          "window": "night",
          "daysBefore": 120,
          "script": "相談の結果と家族の希望を合わせて決める。必要なら学区の校長ともう一度面談する。迷ったら相談員にもう一度聞く"
        },
        {
          "title": "入学の通知を受け取り、学校に引き継ぐことをまとめる",
          "window": "night",
          "daysBefore": 45,
          "script": "サポートブック（支援者向け）を印刷して、入学前に学校へ渡すと話が早い"
        }
      ]
    },
    {
      "id": "iko-18",
      "name": "18歳の切り替え（子どものサービスから大人のサービスへ）",
      "group": "年齢の節目",
      "certificateKinds": [],
      "checkedOn": "2026-11-03",
      "source": "横浜市「障害福祉サービスの利用手続きについて」（2025-11-13更新）：18歳以上の窓口は区の福祉保健センターの高齢・障害支援課（18歳未満はこども家庭支援課。高校3年生まではこども家庭支援課の区もある）。障害支援区分の認定には、認定調査と医師意見書がある。横浜市「愛の手帳の交付」（2024-10-08更新）：判定は18歳未満は児童相談所、18歳以上は障害者更生相談所。時期は区役所と相談支援専門員に確認する",
      "steps": [
        {
          "title": "相談支援専門員と、18歳以降の生活とサービスを話し合う",
          "window": "day",
          "daysBefore": 365,
          "contactKind": "相談支援",
          "script": "期限には「18歳の誕生日」か「高校を卒業する日」を入れる。卒業後の通い先（生活介護など）も話す"
        },
        {
          "title": "卒業後の通い先を見学する",
          "window": "day",
          "daysBefore": 300,
          "contactKind": "保育園・学校",
          "script": "学校の進路の先生とも相談する。実習の予定も聞く"
        },
        {
          "title": "療育手帳の再判定の時期を確かめる",
          "window": "night",
          "daysBefore": 270,
          "script": "横浜市では、18歳以上の判定は障害者更生相談所（18歳未満は児童相談所）。「療育手帳の更新」の手続きの型と合わせて使う"
        },
        {
          "title": "障害支援区分の認定を申請する",
          "window": "day",
          "daysBefore": 180,
          "contactKind": "役所",
          "script": "区の高齢・障害支援課へ（高校3年生まではこども家庭支援課の区もある）。認定の調査と、医師の意見書がある。意見書を書いてもらえるか、先に病院に確かめておく"
        },
        {
          "title": "大人の障害福祉サービスの受給者証を申請する",
          "window": "day",
          "daysBefore": 90,
          "contactKind": "役所",
          "script": "相談支援専門員にサービス等利用計画案を作ってもらう（家族が作るセルフプランもできる）"
        },
        {
          "title": "新しい受給者証を事業所に見せ、アプリに登録する",
          "window": "night",
          "daysBefore": 0,
          "script": "大人の受給者証は本人の名前になる。子どもの受給者証は「状態」を終わりにする"
        }
      ]
    },
    {
      "id": "nenkin-20",
      "name": "20歳の切り替え（障害基礎年金・特別障害者手当）",
      "group": "年齢の節目",
      "certificateKinds": [],
      "checkedOn": "2026-11-03",
      "source": "日本年金機構「先天性の病気などにより20歳前から障害がありますが…」（2025-09-01更新）・「障害基礎年金を受けられるとき」（2025-12-02更新）、横浜市「年金の請求先」（2023-03-16更新）：初診日が20歳前なら、20歳をすぎてから区役所の保険年金課（国民年金係）に請求する。特別児童扶養手当・障害児福祉手当は20歳で終わり、自動では切り替わらない。必要書類・時期は窓口で確認する",
      "steps": [
        {
          "title": "初めて病院にかかった日（初診日）と、その病院を確かめる",
          "window": "night",
          "daysBefore": 365,
          "script": "期限には「20歳の誕生日」を入れる。保管箱の「12_障害年金の準備」を見る。カルテが残っているうちに証明をもらう。乳幼児健診などで障害が確かめられた記録や、療育手帳も役に立つ"
        },
        {
          "title": "区役所の保険年金課（国民年金係）に、申請の流れと必要な書類を聞く",
          "window": "day",
          "daysBefore": 300,
          "contactKind": "役所",
          "script": "「20歳前からの障害で、障害基礎年金を申請したい」と伝える"
        },
        {
          "title": "初診の病院が今と違えば、受診状況等証明書を依頼する",
          "window": "day",
          "daysBefore": 270,
          "contactKind": "病院"
        },
        {
          "title": "病歴・就労状況等申立書の下書きを作る",
          "window": "night",
          "daysBefore": 180,
          "script": "生まれてから今までの経過を書く。医療の保管箱の目録と、生育の振り返りシートが役に立つ"
        },
        {
          "title": "主治医に年金用の診断書を依頼する",
          "window": "day",
          "daysBefore": 60,
          "contactKind": "病院",
          "script": "診断書は、いつの状態を書いてもらうかに決まりがあるので、窓口で確かめてから頼む"
        },
        {
          "title": "障害基礎年金を申請する",
          "window": "day",
          "daysBefore": 0,
          "contactKind": "役所",
          "script": "20歳になってから、区役所の保険年金課（国民年金係）へ。本人の所得証明書・本人名義の通帳なども要る（マイナンバーを書けば省ける書類もある）"
        },
        {
          "title": "特別障害者手当の申請を区役所に相談する",
          "window": "day",
          "daysBefore": 0,
          "contactKind": "役所",
          "script": "区の福祉保健センターへ。診断書が要る。年金の診断書と同じ時期に頼めるか聞く"
        },
        {
          "title": "子どもの手当が終わったことを確かめ、アプリの記録を直す",
          "window": "night",
          "daysBefore": 0
        }
      ]
    },
    {
      "id": "saigai-sonae",
      "name": "災害の備えの登録と見直し（名簿・個別避難計画）",
      "group": "災害の備え",
      "certificateKinds": [],
      "repeat": "yearly",
      "checkedOn": "2026-11-03",
      "source": "横浜市「災害時要援護者支援」（2026-03-31更新）：区役所が名簿を地域の防災組織に渡す（やり方は区・地域で違う）。名簿の対象は手帳の等級などで決まる。横浜市「個別避難計画の作成について」（2026-06-25更新）：対象の人に書類が届き、福祉の専門職（計画相談員など）と作るのが基本。人工呼吸器などを使う人の計画は「医療機器の停電への備え」の型を使う",
      "steps": [
        {
          "title": "区役所に、災害時要援護者名簿に載っているか聞く",
          "window": "day",
          "daysBefore": 30,
          "contactKind": "役所",
          "script": "区役所の高齢・障害支援課などに「災害時要援護者名簿に子どもが載っているか、載せてもらえるか。個別避難計画を作れるか」と聞く"
        },
        {
          "title": "個別避難計画を作る・見直す",
          "window": "night",
          "daysBefore": 21,
          "contactKind": "相談支援",
          "script": "逃げる場所・行き方・手伝ってくれる人・持っていく医療機器と薬。相談支援専門員といっしょに作るのが基本（家族で作ってもよい）。訪問看護にも相談できる"
        },
        {
          "title": "非常持ち出しの中身を確かめる",
          "window": "night",
          "daysBefore": 7,
          "script": "薬・ケアの物品の数日分、医療的ケア手順書の印刷、サポートブックの印刷"
        },
        {
          "title": "見直しを終える",
          "window": "night",
          "daysBefore": 0,
          "script": "この工程を「完了」にした日が、見直した日として残る。次の年も同じ時期に見直す"
        }
      ]
    },
    {
      "id": "teiden-sonae",
      "name": "医療機器の停電への備え",
      "group": "災害の備え",
      "certificateKinds": [],
      "repeat": "yearly",
      "checkedOn": "2026-11-03",
      "source": "横浜市「人工呼吸器等要電源医療的ケア児・者等災害時個別避難計画の作成について」（2026-10-19更新）：在宅で人工呼吸器などを使う人は、訪問看護師と個別避難計画を作れる。横浜市「在宅で人工呼吸器等を使う人への非常用電源の給付」（2026-05-25更新）：発電機・ポータブル電源などの給付。申請は年3回（2026年度は7月・10月・2027年1月）、郵送だけ。マスク型の人工呼吸器・酸素濃縮器は対象外。電力会社の登録は各社に確認する",
      "steps": [
        {
          "title": "医療機器ごとに、バッテリーで何時間動くか確かめる",
          "window": "night",
          "daysBefore": 30,
          "script": "人工呼吸器・吸引器・酸素など。分からなければ業者に聞く"
        },
        {
          "title": "業者に、停電のときの対応を聞く",
          "window": "day",
          "daysBefore": 25,
          "contactKind": "医療機器業者",
          "script": "予備のバッテリー・手動の吸引器・連絡先を確かめる"
        },
        {
          "title": "訪問看護師に、停電に備えた個別避難計画を作れるか聞く",
          "window": "day",
          "daysBefore": 22,
          "contactKind": "訪問看護",
          "script": "在宅で人工呼吸器などを使っている人が対象。訪問看護を使っていなければ、区の在宅医療連携拠点に聞く"
        },
        {
          "title": "非常用電源の給付が使えるか確かめる",
          "window": "day",
          "daysBefore": 20,
          "contactKind": "役所",
          "script": "横浜市では、在宅で人工呼吸器などを使う人に発電機・ポータブル電源の給付がある。申請は年3回・郵送で、主治医の診断書か意見書が要る。対象の機器かどうかは市の担当か区役所に聞く"
        },
        {
          "title": "電力会社に、在宅で医療機器を使っていることを伝える登録があるか確かめる",
          "window": "day",
          "daysBefore": 15
        },
        {
          "title": "医療的ケア手順書の「緊急時と連絡先」に停電のときを書き足す",
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
    certificateAlerts: certificateAlerts, summarize: summarize,
    certGrade: certGrade, ageYears: ageYears, suggestBenefits: suggestBenefits,
    buildDigestText: buildDigestText, buildDayText: buildDayText, toIcs: toIcs,
    makeExport: makeExport, migrate: migrate, upgradeCollections: upgradeCollections, mergeImport: mergeImport, buildSample: buildSample
  };
})();
