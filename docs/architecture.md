# 🏗️ アーキテクチャとファイル構成

ClawBridge の内部構造、各コンポーネントの役割、およびディレクトリ構成について解説します。

---

## 1. 📂 ディレクトリ構造

```text
ClawBridge/
├── src/                # 現行のソースコード (推奨)
│   ├── core/           # サーバ起動、設定管理、ロガー
│   ├── api/            # API エンドポイント、コントローラ
│   ├── services/       # ビジネスロジック、オーケストレーション
│   └── providers/      # 各 AI バックエンドとの通信
├── web/                # モダン Web UI (Next.js / TypeScript / Tailwind CSS)
├── public/             # 静的配信ディレクトリ (web/ のビルド成果物が配置される)
├── utils/              # パーサ、フォーマッタ、コンテンツ処理
├── config/             # 設定ファイル (settings.json 等)
├── bin/                # インストーラ、CLI ツール
└── g4f_server.py       # G4F 専用 Python バックエンド
```

---

## 2. 🧩 コンポーネント解説

### 📡 API レイヤ (`src/api/`)
OpenAI 互換プロトコルを処理するフロントエンドです。
- **`routes.js`**: 全エンドポイントの定義。OpenAI 互換 API から管理用 API までを網羅。
- **`ChatController.js`**: リクエストの受付と、ストリーミング/非ストリーミングレスポンスの切り替え。

### ⚙️ サービスレイヤ (`src/services/`)
ClawBridge の「頭脳」にあたる部分です。
- **`ChatService.js`**: モデル選定、プロバイダへのルーティング、フォールバックの実行。
- **`ToolService.js`**: ツール非対応モデルを補完する **Tool Polyfill** ロジック。

### 🔌 プロバイダレイヤ (`src/providers/`)
外部 AI サービスとの「アダプタ」群です。
- `BaseProvider.js` を継承し、各サービス固有の API (Gemini, Groq, Pollinations 等) を OpenAI 形式のインターフェースにラップします。

### 🛠️ ユーティリティ (`utils/`)
データ変換の心臓部です。
- **`parsers.js`**: 自由記述形式のレスポンスから JSON ツールコールやメッセージ本文を高精度に抽出。
- **`content.js`**: プロンプト前処理とメタデータ除去。

### 🌐 Web UI (`web/`)
統合管理ツールとしてのフロントエンドです。
- **Next.js & React**: モダンなフレームワークによる高速な操作感。
- **Dashboard**: サーバのステータスや接続状況を一覧表示。
- **Playground**: 直感的なチャットインターフェースでモデルの挙動をテスト。
- **Settings**: `settings.json` を GUI から編集・保存。
- **Logs**: リアルタイムでサーバログを確認。

---

## 3. 🐍 G4F Python バックエンド
G4F (GPT4Free) は Python エコシステムに強く依存しているため、Node.js から自動管理される独立したサブプロセスとして動作します。
- `g4f_server.py` が Port 1338 で ASGI サーバーを提供し、Node.js 側から API 経由で呼び出されます。

---

## ⚠️ レガシーコードに関する注意
ルート直下の `providers/` や `handlers/` にあるファイルは、旧バージョン (v0.2 以前) の名残であり、現在の `v0.3+` 構成では使用されていません。
リファクタリングが進むまでの間、互換性のために保持されていますが、**機能修正や拡張は必ず `src/` 配下に対して行ってください。**

---

[⬅️ ドキュメントセンターに戻る](./README.md)
