# ⚙️ インストールガイド

ClawBridge をあなたの環境にセットアップするための詳細な手順です。

---

## 📋 動作要件

| 要件 | バージョン | 確認コマンド |
| :--- | :--- | :--- |
| **Node.js** | 18.x 以上 (LTS推奨) | `node -v` |
| **Python** | 3.10 以上 | `python3 --version` |
| **Platform** | Linux / macOS / WSL2 | `uname -a` |

---

## 🚀 セットアップ手順

### 1. リポジトリのクローン
```bash
git clone https://github.com/nezumi0627/ClawBridge.git
cd ClawBridge
```

### 2. 自動インストール (推奨)
以下のコマンドを実行するだけで、依存関係の解決、Python 仮想環境の構築、OpenClaw への自動登録が完了します。

```bash
chmod +x install.sh
./install.sh
```

### 3. 手動インストール (詳細な制御が必要な場合)
自動スクリプトを使用しない場合は、以下の順序で実行してください。

1.  **Node.js 依存関係**: `npm install`
2.  **Python 仮想環境**:
    ```bash
    python3 -m venv gvenv
    source gvenv/bin/activate
    pip install -U g4f[all] requests curl-cffi uvicorn fastapi python-multipart
    ```
3.  **構成パッチ**: `node bin/install.js`

---

## ⚡ 起動と運用

### サーバーの起動
```bash
./start.sh
```
起動すると、ClawBridge (Port: 1337) と G4F Backend (Port: 1338) が立ち上がります。

### 管理ダッシュボードへのアクセス
ブラウザで以下を開いてください：
- **`http://127.0.0.1:1337/`**
  - **Dashboard**: 現在のステータス確認。
  - **Playground**: 接続テスト。
  - **Logs**: リアルタイムログ監視。

---

## ❓ トラブルシューティング

### Q: `Module not found` エラーが発生する
- Python 側のエラーの場合: `source gvenv/bin/activate` を実行してから、エラーに表示されたパッケージを `pip install` してください。

### Q: OpenClaw から接続できない
- `openclaw.json` 内の `baseUrl` が `http://127.0.0.1:1337/v1` になっているか確認してください。
- `install.sh` を再実行することで設定をリセット・再適用できます。

---

[⬅️ ドキュメントセンターに戻る](./README.md)
