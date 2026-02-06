<h1 align="center">🦞 ClawBridge <sup>Beta</sup></h1>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" />
  <img src="https://img.shields.io/badge/status-beta-orange" />
  <img src="https://img.shields.io/badge/node.js-%3E%3D18-green" />
  <img src="https://img.shields.io/badge/platform-linux%20%7C%20wsl-lightgrey" />
  <a href="https://openclaw.ai/">
    <img src="https://img.shields.io/badge/built%20for-OpenClaw-8A2BE2" />
  </a>
</p>

<p align="center">
  <strong>
    OpenClaw を世界中の無料 / 低コスト AI モデルに接続する<br>
    非公式ブリッジサーバ
  </strong>
</p>

<p align="center">
  <sub>
    OpenAI 互換 API で、複数の AI プロバイダを 1 つに統合
  </sub>
</p>

---

## 🧭 ClawBridge とは？

**ClawBridge** は  
**[OpenClaw](https://openclaw.ai/)** をフロントエンドとして利用し、  
複数の **無料 / 低コスト AI プロバイダ** を束ねる  
**OpenAI 互換 API ブリッジサーバ**です。

OpenClaw からのリクエストを受け取り、以下のバックエンドへ中継します：

- **Pollinations AI**
- **G4F（GPT4Free）**
- **Gemini / Groq / Puter** など

🔁 OpenClaw 側からは  
**「1 つの OpenAI 互換サーバ」**として見えるため、  
既存構成をほぼ変更せずに利用できます。

---

## ✨ 主な特徴

- **🦞 OpenClaw 特化設計**  
  OpenClaw との連携を前提に最適化されたブリッジ
- **💸 無料で即スタート**  
  Pollinations / G4F 対応、公式 API キー不要
- **🔁 OpenAI 互換 API**  
  `/v1/chat/completions` / `/v1/models` に対応
- **🔌 マルチプロバイダ統合**  
  複数 AI バックエンドを単一エンドポイントで管理
- **🛠 擬似ツールコール対応**  
  ツール非対応モデルにもプロンプト注入で対応
- **📊 Web 管理 UI 搭載**  
  ログ確認・疎通テスト・簡易デバッグが可能

---

## 📚 ドキュメント

詳細は `docs/` 以下を参照してください：

- 📦 [セットアップガイド](./docs/installation.md)
- 🤖 [モデル & プロバイダ一覧](./docs/providers-and-models.md)
- 🧩 [OpenClaw での使い方](./docs/usage-openclaw.md)
- ⚙️ [仕組みとアーキテクチャ](./docs/MECHANISM.md)
- 🏗 [内部アーキテクチャ詳細](./docs/architecture.md)

---

## 🚀 インストール

### 1️⃣ リポジトリをクローン
```bash
git clone https://github.com/nezumi0627/ClawBridge.git
cd ClawBridge
````

### 2️⃣ セットアップ

依存関係のインストールと
OpenClaw への自動登録を行います。

```bash
# 依存関係のインストール
npm install

# セットアップスクリプトの実行（OpenClaw への登録、Service 設定等）
node bin/install.js
```

### 3️⃣ 起動

```bash
./start.sh
```

📖 詳細やトラブルシューティングは
[インストールガイド](./docs/installation.md) を参照してください。

---

## 📄 ライセンス

MIT License
詳細は [LICENSE](LICENSE) を参照してください。