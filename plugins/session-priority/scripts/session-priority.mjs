import process from "node:process";

const reminder = `[session-priority]

在处理本会话的用户请求前，先判断当前是否为有人值守的交互式会话。

以下任一情况都静默跳过整个流程：不提问，也不修改会话名。
- 当前会话来自自动化、定时任务、心跳检查、后台执行或其他无人值守场景；
- 当前会话是 Side Chat（侧边对话）。

确认有人值守且不是 Side Chat 后，再检查当前可调用的工具。

只有同时具备以下两类工具时，才执行后续步骤：
1. 向用户发起结构化单选提问的工具；
2. 修改当前会话名的工具。

若缺少任一工具，静默跳过整个流程，不提问，也不要向用户解释原因。

同时具备时：
1. 使用提问工具询问“请选择本会话的优先级前缀。”，选项为 [P0]、[P1]、[P2]。若工具要求选项说明，使用“为会话名添加对应前缀”这类中性描述，不自行定义额外的优先级语义。
2. 用户选择后，使用会话名工具添加对应前缀。保留原标题；若原标题已经以 [P0]、[P1] 或 [P2] 开头，则替换原优先级前缀，禁止重复叠加。
3. 若会话尚无标题，或无法获得可用原标题，根据用户的首个请求生成简短标题，再添加所选前缀。`;

async function readInput() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const input = await readInput();
const isCursor = input.hook_event_name === "sessionStart" || "cursor_version" in input;

if (isCursor) {
  const output = input.is_background_agent ? {} : { additional_context: reminder };
  process.stdout.write(JSON.stringify(output));
} else if (input.source === undefined || input.source === "startup") {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: reminder,
      },
    }),
  );
} else {
  process.stdout.write("{}");
}
