# LingoPlayground Public Skills

LingoPlayground 面向公众的 Claude Code、Codex 与 Cursor 插件仓库，是团队私有技能仓库的公开姊妹仓库。

本仓库只发布适合公开分发的插件与技能；内部方法论、团队上下文和私有工作流继续留在私有仓库。

## Plugins

### [session-priority](plugins/session-priority/) — 会话优先级与暂存标记

全新会话开始时，通过 Hook 条件式询问 `[P0]`、`[P1]`、`[P2]`；另提供技能随时设置或修改优先级，以及切换 `[PARKED]` 暂存状态。兼容 Claude Code、Codex 与 Cursor 本地智能体。

## Standalone Skills

`skills/` 用于公开分发自包含的单点 skill，目前只保留[目录规范](skills/README.md)，尚未发布具体 skill。它们不进入 marketplace，可直接拷贝或通过 `npx skills add` 安装。

## 安装

### Claude Code

```bash
/plugin marketplace add LingoPlayground/skills-public
/plugin install session-priority@lp-skills-public
```

### Codex

```bash
codex plugin marketplace add LingoPlayground/skills-public
# 然后在 Codex plugin directory 中安装 session-priority
```

### Cursor

Cursor 可从仓库的 `.cursor-plugin/marketplace.json` 发现插件；本地开发时也可把目标插件目录链接到 `~/.cursor/plugins/local/`。

## 仓库结构

```text
skills-public/
├── .claude-plugin/marketplace.json
├── .agents/plugins/marketplace.json
├── .cursor-plugin/marketplace.json
├── AGENTS.md / CLAUDE.md
├── plugins/session-priority/
├── skills/
│   └── README.md
└── tests/
```

## License

[MIT](LICENSE)
