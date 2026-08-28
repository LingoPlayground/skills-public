# AGENTS.md

本文件指导 Claude Code、Codex 和 Cursor 在本公开仓库中工作。

## 仓库定位

本仓库是团队私有技能仓库的公开姊妹仓库，只承载适合公开分发的插件与技能。不得加入内部方法论、私有仓库路径、凭据、个人信息或团队专属运行上下文。

当前只发布 `plugins/session-priority/`。该插件同时支持 Claude Code、Codex 与 Cursor，并包含生命周期 Hook 和两个标准 skill。

## 结构约束

- `AGENTS.md` 是真实文件，`CLAUDE.md` 是指向它的兼容软链接。
- 三个市场入口分别是 `.claude-plugin/marketplace.json`、`.agents/plugins/marketplace.json` 和 `.cursor-plugin/marketplace.json`。
- 三份宿主清单的共有元数据保持一致；版本变化时同步更新 Claude Code 市场条目。
- `session-priority` 含 Hook，暂不提供 Agent Plugins 根 `plugin.json`，避免 Codex 跳过生命周期 Hook。
- skill 目录只放 `SKILL.md`、`agents/` 及必要资源，不放 `AGENTS.md` 或 `CLAUDE.md`。

## 验证

修改插件清单、Hook 或 skill 后运行：

```bash
node --test tests/*.test.mjs
```
