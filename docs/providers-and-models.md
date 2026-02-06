# 🔌 プロバイダーとモデルの詳細仕様

ClawBridge がどのように各 AI サービスと通信し、どのモデルをどのプロバイダーへ振り分けているかを解説します。

---

## 🧭 ルーティングの基本戦略

ClawBridge は、受信したモデル名に基づいて `ChatService.route()` メソッドで最適なプロバイダーを選択します。

### 1. 🥇 優先プロバイダー (Official APIs)
自身の API キーを設定している場合、以下のプロバイダーが最優先で利用されます。
- **Google Gemini**: `gemini-` を含むモデル。
- **Groq**: Llama 3 系モデル。高速推論エンジン。
- **PuterJS (via G4F)**: Claude 3.7 や GPT-4o 系の高品質アクセス。

### 2. 🥈 無料中継プロバイダー (Free Resources)
API キーがない場合、以下のリソースから「今、動くもの」を見つけ出します。
- **Pollinations**: 最も高速な「とりあえずの回答」用。
- **G4F (GPT4Free)**: 世界中の無料エンドポイントをスキャン。

---

## 🛠️ 各プロバイダーの特徴

### 🟣 Pollinations AI
- **役割**: 超高速なテキスト/画像生成。
- **モデル**: `gpt-4o-mini`, `openai`, `llama`
- **特徴**: アカウント不要、速度重視。ClawBridge はここでも Tool Polyfill を適用します。

### 🐉 G4F (GPT4Free)
- **役割**: 深層の無料リソースへのアクセス。
- **モデル**: GPT-4, Llama 3.1, Claude, DeepSeek など多数。
- **運用**: Node.js から Python サブプロセスとして起動。動作確認済みモデルは GitHub から自動同期されます。

### 💠 Google Gemini
- **役割**: 信頼性の高い主力エンジン。
- **モデル**: `gemini-2.1-flash`, `gemini-2.5-pro`, `gemini-2.0-flash`
- **特徴**: 100万トークンを超える巨大な文脈理解。

---

## 🔃 障害耐性 (フォールバック)

ClawBridge の真価は、特定のモデルやプロバイダーがダウンした際の **自動切り替え** にあります。

```json
// 設定例: gpt-4o-mini が失敗したら gemini へ、それもダメなら llama へ
"fallbacks": {
  "gpt-4o-mini": ["gemini-2.1-flash", "llama-3.1-8b"]
}
```

このチェーンは `config/settings.json` で自由に変更可能です。

---

## 🚀 知っておくべきこと

- **Tool Polyfill**: ClawBridge は全てのプロバイダーに対し、独自のプロンプト注入技術を用いて、本来ツール非対応なモデルでも OpenClaw のツール実行を成功させます。
- **ステータスチェック**: 稼働状況や対応モデルは、管理画面の `Test` セクションからいつでもリアルタイムに検証できます。

---

[⬅️ ドキュメントセンターに戻る](./README.md)
