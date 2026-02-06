## OpenClaw との連携と利用フロー

ClawBridge は **OpenAI 互換 API** を公開しているため、OpenClaw からは  
「OpenAI 互換エンドポイントの 1 つ」として扱うだけで利用できます。

### 1. 基本フロー

1. **Discord / Web UI / CLI クライアント**
   - ユーザーがメッセージを送信
2. **OpenClaw**
   - OpenAI 互換のクライアントとして動作
   - エンドポイント URL と API キーを ClawBridge 用に設定
3. **ClawBridge**
   - `/v1/chat/completions` でリクエストを受け取る
   - モデル名に応じて G4F / Pollinations / Gemini / Groq / Puter へルーティング
   - レスポンスを OpenAI 互換形式に整形して OpenClaw へ返す
4. **OpenClaw**
   - 受け取ったレスポンスをクライアント(Discord や Web UI)にそのまま中継

図示すると以下のイメージです。

- **Discord / Web UI / その他クライアント**
  ⇔ **OpenClaw**
  ⇔ **ClawBridge (このリポジトリ)**
  ⇔ **G4F / Pollinations / その他プロバイダ**

### 2. OpenClaw 側の設定イメージ

OpenClaw の「OpenAI エンドポイント設定」で、以下のように指定します。

- **エンドポイント URL**: `http://<ClawBridgeホスト>:1337/v1`
- **API キー**: 任意のダミー値（例: `claw-free`）
  - ClawBridge 側では現状、この値で認証していません。  
    プレイグラウンドのフロントエンドも `Bearer claw-free` を付与しています。

モデル名は OpenClaw 側で指定した値が **そのまま ClawBridge の `model` フィールド**として届きます。

### 3. Discord ボットから使う場合の考え方

Discord ボットを OpenClaw に接続している場合:

- Discord → OpenClaw: OpenAI 互換 API 呼び出し
- OpenClaw → ClawBridge: 同じく `/v1/chat/completions` 形式
- ClawBridge:
  - Discord 由来のメッセージは `utils/formatters.js` のロジックで検出され、
  - ツールコール時には Discord Embed 形式のレスポンスを組み立てることが可能です。

Discord 側では「普通に OpenAI API を叩くつもり」で実装し、  
その送信先 URL を ClawBridge に向けるだけで、無料モデルを扱えるようになります。

### 4. Web UI からの直接利用

このリポジトリには、簡易な Web UI（プレイグラウンド）が同梱されています。

- URL: `http://127.0.0.1:1337/?view=playground`
- 実装場所: `public/index.html`
  - モデル選択
  - プロバイダヒント（`provider` パラメータ）
  - レスポンス時間や実際に使われたモデル/プロバイダの表示

プレイグラウンドは **ClawBridge API に対するサンプルクライアント** なので、  
自作の Web UI やツールを作る際の参考実装としても利用できます。

### 5. ツールコール (Function Calling) 対応

- OpenClaw から **tools** フィールド付きでリクエストされた場合:
  - G4F に関しては `services/ToolService.js` による「システムプロンプト注入」と
    `tool` ロール→`user` ロール変換などの **ポリフィル** を行い、
    本来ツール非対応なバックエンドでも疑似的にツールコールを扱えるようにしています。
  - レスポンス中に JSON 形式で埋め込まれたツールコールを
    `utils/parsers.js` の `parseBridgeResponse` が抽出し、
    OpenAI 互換の `tool_calls` 配列に変換します。

ツール定義やポリフィルの詳細は `architecture.md` と `providers-and-models.md` を参照してください。

