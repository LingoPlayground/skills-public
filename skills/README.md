# Standalone Skills

存放 **standalone skill**——不属于成体系工作流的自包含单点工具。当前目录只保留规范，尚未发布具体 skill。

## 何时放这里 vs 放进 plugin

| 标准 | standalone skill（本目录） | plugin（`../plugins/<name>/skills/`） |
|---|---|---|
| 是否依赖其他 skill | 否，完全自包含 | 可在 plugin 工作流中协同 |
| 是否需要 plugin 级约束或 Hook | 否 | 是 |
| 安装方式 | 直接拷贝 / `npx skills add LingoPlayground/skills-public --skill <name>` | 通过对应宿主的 marketplace 安装 |

单个 `SKILL.md` 能完整描述并执行的能力放在 `skills/`；需要多个 skill 协同、跨 skill 路由或宿主 Hook 时打包成 plugin。

## 目录布局

每个 standalone skill 一个目录：

```text
skills/
└── <skill-name>/
    ├── SKILL.md           # frontmatter + 工作流
    ├── references/        # 方法论参考（可选）
    ├── template.md        # 填充模板（可选）
    └── examples/          # 示例（可选）
```

`SKILL.md` 的 frontmatter 必须包含 `name` 和 `description`；按需使用 `disable-model-invocation`、`argument-hint`、`allowed-tools` 等 Claude Code 标准字段，不添加宿主专有自定义字段。skill 目录不放 `AGENTS.md` 或 `CLAUDE.md`。

## 与 marketplace 的关系

marketplace 只列 plugin，不列 standalone skill。standalone skill 可手动拷贝到 Agent 的 skill 目录，或使用支持从 GitHub 仓库安装 skill 的工具拉取。

如果 standalone skill 后来需要其他 skill、plugin 级约束或 Hook，应迁移到 `plugins/<name>/skills/` 并补齐 plugin manifest。
