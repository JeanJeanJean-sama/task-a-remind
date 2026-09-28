# たすかReマインド（試作版 v0.3）

[![テスト](https://github.com/jeanjeanjean-sama/task-a-remind/actions/workflows/ci.yml/badge.svg)](https://github.com/jeanjeanjean-sama/task-a-remind/actions/workflows/ci.yml)
[![Web版を公開](https://github.com/jeanjeanjean-sama/task-a-remind/actions/workflows/pages.yml/badge.svg)](https://github.com/jeanjeanjean-sama/task-a-remind/actions/workflows/pages.yml)

**▶ Web版を開く：https://jeanjeanjean-sama.github.io/task-a-remind/**

障害児・医療的ケア児の家庭のための、**子どもの情報まとめ**と**手続きリマインド**の試作版です。

> 子どもの情報を1か所に持っておき、そこから「人に渡す書類」と「自分がやる手続き」を取り出す。

## できること

| 画面 | できること |
|---|---|
| 今日 | 今夜できること／昼にしかできないこと（電話・窓口）を分けて表示。昼のタスクは「明日の昼にやる」で日を決める。期限が近い受給者証・手帳を知らせる |
| 手続き | 「療育手帳の更新」などの型を選び、期限を入れると、工程ごとのタスクを逆算して作る。前の工程が終わると次が出てくる |
| 子どもの情報 | 本人（特徴と関わり方・好きなこと・苦手なこと・食事・睡眠など、履歴つき）／家族・緊急連絡先／生活リズム／診断名と医療歴（年ごと）／成長の記録／保険証・受給者証・手帳／医療機関・関係機関 |
| 手順書 | 医療的ケアの手順書を、決まった8つの項目に沿って作る。足りない項目には質問が出る。印刷・PDF |
| 設定 | サポートブックの印刷（支援者向け／家族用。自作サポートブックと同じ章立て）、データの書き出し・読み込み、通知の設定 |

## 2つの版（画面は同じ1つのファイル）

| | かんたん版（GitHub Pages） | Google版（スプレッドシート＋GAS） |
|---|---|---|
| 始め方 | URLを開くだけ | スプレッドシートをコピーして初期設定 |
| 保存場所 | その端末のブラウザの中（同期をオンにすると自分のGoogleドライブにも） | 自分のGoogleドライブのスプレッドシート |
| 通知 | カレンダー用ファイル（.ics）を書き出す | **毎晩のまとめと昼の予定をDiscordに通知** |
| パソコンとスマホで同じデータ | **Googleでログインして同期**（自分のドライブのアプリ専用フォルダに保存） | 同じWebアプリのURLを開く |
| 家族との共有 | 同じGoogleアカウントで同期、またはデータファイルの受け渡し | 同じスプレッドシートを共有 |
| PDF | ブラウザの印刷で「PDFに保存」 | ドライブに保存して共有リンクで渡せる |

かんたん版で「データを書き出す」→ Google版で「読み込む」だけで移れます。

## 使い始める

| あなたは | 読むもの |
|---|---|
| Web版を使いたい | 上の「Web版を開く」をスマホで開き、ホーム画面に追加 → [かんたん版の使い方](guide/01_かんたん版の公開と使い方.md) |
| Google版（Discord通知つき）を使いたい | [Google版の導入手順](guide/02_Google版の導入手順.md) |
| このリポジトリを管理・公開したい | **[推奨手順：リポジトリでの管理とWeb版の公開](guide/00_推奨手順.md)**、[Googleドライブ同期の設定](guide/04_Googleドライブ同期の設定.md) |
| 開発に参加したい | [CONTRIBUTING.md](CONTRIBUTING.md) |

設計の資料：[データ定義書](guide/データ定義書.md)／[将来の移行を見据えた設計メモ](guide/03_設計メモ.md)／[セキュリティと個人情報](SECURITY.md)／[変更履歴](CHANGELOG.md)

## フォルダの中身

```
src/                    ← 元のファイル（ここを直す）
  schema.json           ← データ定義書（機械が読む版）
  templates.json        ← 手続きの型（療育手帳の更新など）
  logic.js              ← 共通ロジック（ブラウザとGASの両方で使う）
  app.js / style.css    ← 画面
  drive-sync.js         ← Googleドライブ同期（かんたん版だけで使う）
  config.json           ← GoogleのクライアントID（GitHubの変数 GOOGLE_CLIENT_ID でも指定できる）
  sw.js / manifest.webmanifest / assets/ ← Web版をアプリのように使うための部品
build.mjs               ← src/ から下の「自動で作るファイル」を作る
docs/                   ← 自動：Web版（GitHub Pagesで公開される）
gas/                    ← Google版（Apps Scriptに貼る4ファイル）
  Code.gs  appsscript.json   ← 手で直す
  Shared.gs  Index.html      ← 自動
guide/                  ← 手順書・データ定義書（自動）・設計メモ
sample/sample-data.json ← 自動：架空のサンプルデータ（読み込みの確認用）
test/                   ← テスト
scripts/serve.mjs       ← 手元でWeb版を表示する
.github/                ← 自動テスト・自動公開・リリース・Issueのひな形
```

## 開発する人向け

Node.js 20（`.nvmrc`）を使います。

```bash
npm ci               # 依存パッケージ（画面の確認用の Playwright）を入れる
npm run build        # src/ から docs/・gas/・guide/データ定義書.md・sample/ を作る
npm test             # ビルド＋ロジックのテスト＋GAS版のテスト（Googleを模擬）
npm run test:ui      # 画面の動作確認（かんたん版・Google版）
npm run serve        # http://localhost:8080 でWeb版を表示
```

**自動で作られるファイル（`docs/`、`gas/Index.html`、`gas/Shared.gs`、`guide/データ定義書.md`、`sample/`）は直接編集せず、`src/` を直して `npm run build` してください。** 作ったファイルも一緒にコミットします（作り直し忘れは自動テストが見つけます）。

main にマージすると、テストが通ればWeb版は自動で公開されます。

## 大事な注意

- **実在の子どもの情報を、このリポジトリに入れないでください。** テストは架空のサンプルで行います。
- 手続きの型はサンプルです。実際の手順や期間は自治体によって異なります。
- このアプリは医療的な判断や助言を行いません。手順書は、家族が書いた内容を整理して表示するものです。

## ライセンス

[MIT License](LICENSE)　© 2026 Jean=Summer

コードは自由に使い、直し、配ることができます（著作権表示とライセンス文を残してください）。手続きの型やサンプルデータを含め、無保証です。
