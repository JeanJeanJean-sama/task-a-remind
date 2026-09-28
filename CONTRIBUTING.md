# 開発に参加する方へ

## いちばん大事な決まり

**実在の子どもの情報を、リポジトリ・Issue・プルリクエスト・画面写真に入れないでください。** 確認には「サンプルで試す」の架空のデータを使います。

## 準備

- Node.js 20（`.nvmrc`）。外部のライブラリは、画面の確認に使う Playwright だけです

```bash
npm ci                          # 依存パッケージを入れる
npx playwright install chromium # 画面の確認をするときだけ
```

## よく使うコマンド

| コマンド | すること |
|---|---|
| `npm run build` | `src/` から `docs/`・`gas/`・`guide/データ定義書.md`・`sample/` を作る |
| `npm test` | ビルド＋ロジックのテスト＋GAS版のテスト（Googleを模擬） |
| `npm run test:ui` | 画面の動作確認（かんたん版とGoogle版） |
| `npm run serve` | `http://localhost:8080` でWeb版を表示 |
| `npm run gas:push` | ビルドして Apps Script にアップロード（clasp、`.clasp.json` が必要） |

## どこを直すか

| 直したいこと | ファイル |
|---|---|
| データの項目 | `src/schema.json`（直したら `guide/データ定義書.md` が自動で更新される） |
| 手続きの型 | `src/templates.json` |
| 工程の計算・通知の文面 | `src/logic.js`（ブラウザとGASの両方で使う。DOMやGoogleのサービスを使わない） |
| 画面 | `src/app.js`・`src/style.css` |
| GAS（スプレッドシート・Discord） | `gas/Code.gs` |

`docs/`・`gas/Index.html`・`gas/Shared.gs` は自動で作られます。直接は直さず、作り直したものもコミットしてください。

## データ定義を変えるとき

- 項目を**足す**：自由に足してかまいません
- 項目の**名前（key）を変える・消す・意味を変える**：`schemaVersion` を1つ上げ、`src/logic.js` の `migrate()` に古い形から新しい形への変換を書き、テストを足します
- 画面に出る名前（`label`）は自由に変えてかまいません

## 手続きの型を足すとき

`src/templates.json` に追加します。`window` は `night`（夜でもできる）か `day`（昼しかできない）、`daysBefore` は期限の何日前が目安か、`contactKind` は関係機関の種類（電話番号を自動で出すため）です。自治体の公式ページなど**出典をプルリクエストに書いてください**。

## コミットとプルリクエスト

- ブランチ名：`feature/〇〇`、`fix/〇〇`
- コミットメッセージ：日本語でよいので「何をしたか」を1行で
- プルリクエストのチェックリストに沿って確認してください
