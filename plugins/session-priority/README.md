# Session Priority Plugin

在全新会话开始时，为智能体注入一条条件式提醒：只有当前运行时同时提供结构化提问工具和会话改名工具，才询问用户选择 `[P0]`、`[P1]` 或 `[P2]`，并更新当前会话名。

插件还提供两个技能，不包含 MCP 服务：

- `set-session-priority`：设置或修改 `[P0]`、`[P1]`、`[P2]`。调用输入已经明确包含 `p0`、`p1` 或 `p2` 时直接改名，不再提问。
- `session-parking`：添加或移除 `[PARKED]`，表示会话暂时停放、近期可能继续，但还不需要归档。

## 运行要求

- Node.js 18 或更高版本。
- `node` 命令必须位于宿主进程可见的 `PATH` 中。

三家 Hook 协议都支持执行外部命令，但不保证宿主自带独立的 Node.js 运行时。安装前请在启动 Claude Code、Codex 或 Cursor 的同一终端环境中运行 `node --version` 确认。

## 行为

1. 仅在全新会话触发；恢复会话、清空或压缩上下文时不重复询问。
2. 自动化、定时任务、心跳检查、后台执行或其他无人值守场景不发起提问，也不修改会话名。
3. 智能体确认有人值守后再检查当前可调用工具。缺少结构化提问或会话改名中的任意一种时，静默跳过。
4. 用户选择后，保留原标题并添加对应前缀。
5. 原标题已有 `[P0]`、`[P1]` 或 `[P2]` 时直接替换，避免重复叠加。
6. 会话尚无标题时，智能体根据首个用户请求生成简短标题后再添加前缀。

Hook 只注入提醒，不直接提问或修改标题；真正的交互仍由宿主内的智能体和工具完成。

## 主动使用技能

需要在会话中途修改优先级时，调用 `set-session-priority` 并直接给出目标等级，例如 `p0`。技能会将已有优先级替换为目标值；只有未指定或输入冲突时才询问。

调用 `session-parking` 会直接切换暂存状态，不再提问：标题没有 `[PARKED]` 时添加，已有时移除。两个标记共存时，标题固定为 `[P1][PARKED] 标题`。

自动化、定时任务、后台执行或其他无人值守场景下，两个技能都不会为了补充信息而发起提问。

## 兼容性

| 宿主 | Hook 接入 | 完整行为的运行时前提 |
|---|---|---|
| Claude Code | `SessionStart` + `additionalContext` | 同时公开结构化提问与智能体可调用的会话改名工具 |
| Codex | `SessionStart` + `additionalContext` | 同时公开结构化提问与会话改名工具 |
| Cursor 本地智能体 | 原生 `sessionStart` + `additional_context` | 同时公开结构化提问与会话改名工具；后台智能体会跳过 |

“兼容”表示插件与 Hook 能被对应宿主正确加载；是否执行询问与改名仍以当前会话实际暴露的工具为准。宿主补齐工具后无需修改 Hook。Cursor Cloud 当前不运行 `sessionStart`，不在支持范围内。

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

本地测试或个人安装可将插件目录链接到 Cursor 的本地插件目录：

```bash
ln -s /path/to/skills-public/plugins/session-priority ~/.cursor/plugins/local/session-priority
```

随后重启 Cursor，或执行 `Developer: Reload Window`。

## 文件分层

- `.claude-plugin/plugin.json`、`.codex-plugin/plugin.json`：Claude Code 与 Codex 宿主清单，共用 `hooks/hooks.json`。Codex 清单显式声明该文件；Claude Code 自动加载标准位置，清单不再声明，否则会报重复加载。
- `.cursor-plugin/plugin.json`：Cursor 宿主清单，使用原生 `hooks/cursor-hooks.json`。
- `scripts/session-priority.mjs`：三端共用的提醒内容与输出协议适配。
- `skills/set-session-priority/`：主动设置或修改会话优先级。
- `skills/session-parking/`：暂存或恢复会话。

本插件暂不提供 Agent Plugins 1.0.0 根 `plugin.json`。Codex 当前会把带该根清单的插件识别为 Agent Plugin，并跳过其中的生命周期 Hook；待通用标准与 Codex 均支持 Hook 后再恢复。
