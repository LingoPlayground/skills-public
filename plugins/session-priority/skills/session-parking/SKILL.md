---
name: session-parking
description: 切换会话名中的 [PARKED] 暂存状态：没有则添加，已有则移除。触发：暂存 / 稍后继续 / 恢复 / 取消暂存 / park session / unpark session。
---

# Session Parking

- 当前标题没有 `[PARKED]` 时直接添加，不提问。
- 当前标题已有 `[PARKED]` 时直接移除，不提问。
- 自动化、定时任务、后台执行等无人值守场景不得提问。
- 仅在具备读取和修改会话名工具时执行。
- 添加或移除时保留优先级和原标题。
- 标题顺序固定为 `[P0][PARKED] 标题`；没有优先级时为 `[PARKED] 标题`。
- 禁止重复标记。
