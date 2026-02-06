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

### 4. 統合管理ダッシュボード (Web UI)
 
ClawBridge には、高度な管理・テスト用の Web UI が同梱されています。
 
- **アクセス URL**: `http://127.0.0.1:1337/` (設定ポートにより異なります)
- **主要機能**:
  - **Dashboard**: プロバイダの接続状況確認。
  - **Playground**: モデルやプロバイダを選んで直接チャット。ストリーミングやツールコールのテストも可能。
  - **Settings**: モデルの追加・編集やシステム設定を GUI で完結。
  - **Logs**: サーバのデバッグログをブラウザ上で閲覧。
- **実装**: `web/` (Next.js) で開発され、ビルドされた成果物が `public/` から配信されます。
 
開発時には `npm run ui:dev` を使用することで、ホットリロード有効な状態で UI を編集できます。
構築やデプロイについては `development.md` を参照してください。

### 5. ツールコール (Function Calling) 対応

- OpenClaw から **tools** フィールド付きでリクエストされた場合:
  - G4F に関しては `services/ToolService.js` による「システムプロンプト注入」と
    `tool` ロール→`user` ロール変換などの **ポリフィル** を行い、
    本来ツール非対応なバックエンドでも疑似的にツールコールを扱えるようにしています。
  - レスポンス中に JSON 形式で埋め込まれたツールコールを
    `utils/parsers.js` の `parseBridgeResponse` が抽出し、
    OpenAI 互換の `tool_calls` 配列に変換します。

ツール定義やポリフィルの詳細は `architecture.md` と `providers-and-models.md` を参照してください。

