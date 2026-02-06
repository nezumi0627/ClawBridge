# 🦞 ClawBridge <sup>Beta</sup>

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
    OpenClaw を世界中の無料 / 低コスト AI モデルに接続するブリッジサーバ
  </strong>
</p>

---

## 🧩 概要

**ClawBridge** は、  
**[OpenClaw](https://openclaw.ai/)** をフロントとして利用し、  
複数の無料 / 低コスト AI プロバイダを束ねる **非公式ブリッジサーバ**です。

OpenClaw からのリクエストを受け取り、

- **Pollinations AI**
- **G4F（GPT4Free）**
- **Gemini / Groq / Puter** など

のバックエンドへ中継します。

OpenClaw 側からは  
**OpenAI 互換 API を提供する単一のサーバ**として見えるため、  
既存構成をほぼ変更せずに多様なモデルを扱えます。

---

## ✨ 特徴

- **🦞 OpenClaw 前提設計**  
  OpenClaw からの接続を想定した専用ブリッジ
- **💸 無料スタート可能**  
  Pollinations / G4F を利用し、公式 API キー不要
- **🔁 OpenAI 互換 API**  
  `/v1/chat/completions` / `/v1/models` に対応
- **🔌 マルチプロバイダ統合**  
  複数 AI バックエンドを 1 エンドポイントに集約
- **🛠 ツールコール擬似対応**  
  ツール非対応モデルにもプロンプト注入で対応
- **📊 管理 UI 搭載**  
  ログ確認・簡易テストが可能な Web UI 付き

---

## � ドキュメント

詳細なドキュメントは [docs/README.md](./docs/README.md) を参照してください。

- [セットアップガイド](./docs/installation.md)
- [モデルとプロバイダ一覧](./docs/providers-and-models.md)
- [OpenClaw での使い方](./docs/usage-openclaw.md)
- [仕組みとアーキテクチャ](./docs/MECHANISM.md)
- [内部アーキテクチャ](./docs/architecture.md)

---

## �🚀 インストール

### 1. リポジトリのクローン
```bash
git clone https://github.com/nezumi0627/ClawBridge.git
cd ClawBridge
```

### 2. セットアップ
ClawBridge は自動セットアップスクリプトを提供しています。これにより依存関係のインストールと OpenClaw への自動登録が行われます。

```bash
# 依存関係のインストール
npm install

# セットアップスクリプトの実行（OpenClaw への登録、Service 設定等）
node bin/install.js
```

### 3. 起動
```bash
./start.sh
```

詳細な手順やトラブルシューティングは [インストールガイド](./docs/installation.md) をご覧ください。

---

## 📄 ライセンス

MIT License - see the [LICENSE](LICENSE) file for details.
