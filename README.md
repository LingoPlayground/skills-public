# LingoPlayground Public Skills

LingoPlayground 面向公众的 Claude Code、Codex 与 Cursor 插件仓库，是团队私有技能仓库的公开姊妹仓库。

本仓库只发布适合公开分发的插件与技能；内部方法论、团队上下文和私有工作流继续留在私有仓库。

## Plugins

### [session-priority](plugins/session-priority/) — 会话优先级与暂存标记

全新会话开始时，通过 Hook 条件式询问 `[P0]`、`[P1]`、`[P2]`；另提供技能随时设置或修改优先级，以及切换 `[PARKED]` 暂存状态。兼容 Claude Code、Codex 与 Cursor 本地智能体。

## Standalone Skills

独立技能自包含，不进入插件市场，可直接拷贝或通过技能安装工具获取。[目录规范](skills/README.md)

### [git-for-everyone](skills/git-for-everyone/SKILL.md) — 人人可用的版本管理

为非技术用户代办版本保存、历史比较、恢复、同步和共享，所有命令由智能体执行，用户只需做内容选择和确认。首次遇到版本记录、修改申请和冲突时，结合当前内容通俗解释。

- **本地即可使用**：保存、比较、恢复只需要 Git，不需要 GitHub 账号、组织成员身份、远端仓库或 `gh`。缺少 Git 时由智能体安装；提交署名只用于本地记录。
- **协作按需启用**：既支持个人项目，也支持团队项目。需要 GitHub 协作时，由智能体安装工具、发起浏览器授权并验证权限，用户无须执行终端命令。
- **主动照看修改前后**：本地项目检查状态并推进保存；协作项目改前安全同步最新版，改后推进共享申请与合并。尚未授权的共享或合并先给出具体预览供确认。

公开安装不要求加入本仓库所属组织。可让智能体执行以下安装命令，用户只需选择实际使用的智能体和安装范围：

```bash
npx skills add LingoPlayground/skills-public --skill git-for-everyone
```

安装后开启新会话，确认技能列表包含 `git-for-everyone`，可以说“帮我把这个文件夹开始做版本管理，只放本地”“把文案改好并存一版”或“把这次修改提交给同事确认”。技能支持自动调用：Codex 已显式开启隐式调用，Claude Code 未禁止自动调用；最终是否加载仍由宿主和模型决定，独立技能不能保证每次必定触发。可用“看看当前文件有哪些改动，先不要保存或上传”检查加载情况；漏触发时，在 Codex 中使用 `$git-for-everyone`，在 Claude Code 中使用 `/git-for-everyone`。调用机制见 [Codex 技能说明](https://developers.openai.com/codex/skills)与 [Claude Code 技能说明](https://code.claude.com/docs/en/skills)。

需要固定路由时，可由项目维护者在已有智能体指令中加入“涉及版本管理，或在版本库中开始、完成修改时，先使用已安装的 git-for-everyone 技能”。技能不会自行修改项目指令或宿主配置，也不承诺离开会话后监控所有编辑。

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
│   ├── README.md
│   └── git-for-everyone/
└── tests/
```

## License

[MIT](LICENSE)
