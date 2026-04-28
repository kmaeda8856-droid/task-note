# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git 運用ルール

- コードを変更するたびに、変更をコミットして GitHub にプッシュすること。
- プッシュのタイミング: ファイルの編集・作成・削除を行った直後、次の作業に移る前に必ず実行する。
- コミットメッセージは変更内容を簡潔に日本語で記述する。
- ブランチは `main` を基本とし、大きな機能追加には feature ブランチを切る。

### 毎回の変更後に実行するコマンド

```bash
git add -A
git commit -m "<変更内容の説明>"
git push origin <現在のブランチ名>
```
