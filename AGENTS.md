# AGENTS.md

本文件指导 Claude Code、Codex 和 Cursor 在本公开仓库中工作。

## 仓库定位

本仓库是团队私有技能仓库的公开姊妹仓库，只承载适合公开分发的插件与技能。不得加入内部方法论、私有仓库路径、凭据、个人信息或团队专属运行上下文。

仓库采用双轨结构：`plugins/` 承载可通过 marketplace 安装的组件，`skills/` 承载自包含、无需 plugin 包装的 standalone skill。当前提供 `plugins/session-priority/` 和 `skills/git-for-everyone/`。

## 结构约束

- `AGENTS.md` 是真实文件，`CLAUDE.md` 是指向它的兼容软链接。
- 三个市场入口分别是 `.claude-plugin/marketplace.json`、`.agents/plugins/marketplace.json` 和 `.cursor-plugin/marketplace.json`。
- 三份宿主清单的共有元数据保持一致；版本变化时同步更新 Claude Code 市场条目。
- `session-priority` 含 Hook，暂不提供 Agent Plugins 根 `plugin.json`，避免 Codex 跳过生命周期 Hook。
- skill 目录只放 `SKILL.md`、`agents/` 及必要资源，不放 `AGENTS.md` 或 `CLAUDE.md`。

## Standalone Skill 规范

- 新 standalone skill 放在 `skills/<skill-name>/`，目录名使用 kebab-case，必备文件为 `SKILL.md`。
- standalone skill 必须自包含；需要跨 skill 路由、Plugin 级约束或 Hook 时，应改放 `plugins/<plugin-name>/`。
- standalone skill 不进入 marketplace；安装方式和完整目录约定见 [`skills/README.md`](./skills/README.md)。

## 验证

修改插件清单、Hook 或 skill 后运行：

```bash
node --test tests/*.test.mjs
```
