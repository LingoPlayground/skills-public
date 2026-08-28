import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, test } from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..");
const pluginRoot = path.join(repoRoot, "plugins", "session-priority");
const scriptPath = path.join(pluginRoot, "scripts", "session-priority.mjs");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(pluginRoot, relativePath), "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(pluginRoot, relativePath), "utf8");
}

function runHook(input) {
  const result = spawnSync(process.execPath, [scriptPath], {
    input: JSON.stringify(input),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function runRegisteredCommand(command, input, env) {
  const result = spawnSync(command, {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: { ...process.env, ...env },
    shell: true,
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function assertReminderContract(context) {
  assert.match(context, /提问.*会话名|会话名.*提问/s);
  assert.match(context, /同时具备/);
  assert.match(context, /\[P0\]/);
  assert.match(context, /\[P1\]/);
  assert.match(context, /\[P2\]/);
  assert.match(context, /静默跳过/);
  assert.match(context, /替换.*优先级前缀|优先级前缀.*替换/s);
  assert.match(context, /自动化|定时任务/);
  assert.match(context, /无人值守/);
  assert.match(context, /不提问|禁止.*提问/);
}

describe("session-priority hook", () => {
  test("is published with host-specific hook manifests", () => {
    const claude = readJson(".claude-plugin/plugin.json");
    const codex = readJson(".codex-plugin/plugin.json");
    const cursor = readJson(".cursor-plugin/plugin.json");

    assert.equal(fs.existsSync(path.join(pluginRoot, "plugin.json")), false);
    for (const manifest of [codex, cursor]) {
      assert.equal(manifest.name, claude.name);
      assert.equal(manifest.version, claude.version);
      assert.equal(manifest.description, claude.description);
    }
    assert.equal(claude.hooks, "./hooks/hooks.json");
    assert.equal(codex.hooks, "./hooks/hooks.json");
    assert.equal(cursor.hooks, "./hooks/cursor-hooks.json");

    for (const marketplacePath of [
      ".claude-plugin/marketplace.json",
      ".agents/plugins/marketplace.json",
      ".cursor-plugin/marketplace.json",
    ]) {
      const marketplace = JSON.parse(
        fs.readFileSync(path.join(repoRoot, marketplacePath), "utf8"),
      );
      assert.ok(
        marketplace.plugins.some((plugin) => plugin.name === claude.name),
        `${marketplacePath} must publish ${claude.name}`,
      );
    }
  });

  test("registers only fresh-session events for each host protocol", () => {
    const sharedHooks = readJson("hooks/hooks.json");
    const sharedSessionStart = sharedHooks.hooks.SessionStart;
    assert.equal(sharedSessionStart.length, 1);
    assert.equal(sharedSessionStart[0].matcher, "startup");
    assert.match(sharedSessionStart[0].hooks[0].command, /CLAUDE_PLUGIN_ROOT/);

    const cursorHooks = readJson("hooks/cursor-hooks.json");
    assert.equal(cursorHooks.version, 1);
    assert.deepEqual(Object.keys(cursorHooks.hooks), ["sessionStart"]);
    assert.match(cursorHooks.hooks.sessionStart[0].command, /CURSOR_PLUGIN_ROOT/);
  });

  test("registered commands launch the shared script", () => {
    const sharedHooks = readJson("hooks/hooks.json");
    const sharedCommand = sharedHooks.hooks.SessionStart[0].hooks[0].command;
    const sharedOutput = runRegisteredCommand(
      sharedCommand,
      { hook_event_name: "SessionStart", source: "startup" },
      { CLAUDE_PLUGIN_ROOT: pluginRoot },
    );
    assertReminderContract(sharedOutput.hookSpecificOutput.additionalContext);

    const cursorHooks = readJson("hooks/cursor-hooks.json");
    const cursorCommand = cursorHooks.hooks.sessionStart[0].command;
    const cursorOutput = runRegisteredCommand(
      cursorCommand,
      { hook_event_name: "sessionStart", is_background_agent: false },
      { CURSOR_PLUGIN_ROOT: pluginRoot },
    );
    assertReminderContract(cursorOutput.additional_context);
  });

  test("returns Claude Code and Codex additional context", () => {
    const output = runHook({ hook_event_name: "SessionStart", source: "startup" });
    assert.equal(output.hookSpecificOutput.hookEventName, "SessionStart");
    assertReminderContract(output.hookSpecificOutput.additionalContext);
  });

  test("returns Cursor native additional context", () => {
    const output = runHook({
      hook_event_name: "sessionStart",
      cursor_version: "1.7.2",
      is_background_agent: false,
    });
    assertReminderContract(output.additional_context);
  });

  test("does not prompt from a Cursor background agent", () => {
    const output = runHook({
      hook_event_name: "sessionStart",
      cursor_version: "1.7.2",
      is_background_agent: true,
    });
    assert.deepEqual(output, {});
  });

  test("publishes one reversible parking skill", () => {
    const skill = readText("skills/session-parking/SKILL.md");

    assert.match(skill, /^---\nname: session-parking\n/m);
    assert.match(skill, /暂存|park/i);
    assert.match(skill, /恢复|unpark/i);
    assert.match(skill, /\[PARKED\]/);
    assert.match(skill, /没有.*\[PARKED\].*直接添加.*不提问/s);
    assert.match(skill, /已有.*\[PARKED\].*直接移除.*不提问/s);
    assert.match(skill, /\[P0\].*\[PARKED\]|优先级.*PARKED/s);
    assert.match(skill, /禁止重复标记/);
    assert.equal(fs.existsSync(path.join(pluginRoot, "skills", "session-parking", "AGENTS.md")), false);
    assert.equal(fs.existsSync(path.join(pluginRoot, "skills", "session-parking", "CLAUDE.md")), false);
  });

  test("publishes a priority skill with argument fast path", () => {
    const skill = readText("skills/set-session-priority/SKILL.md");

    assert.match(skill, /^---\nname: set-session-priority\n/m);
    assert.match(skill, /p0.*p1.*p2/is);
    assert.match(skill, /参数|argument/i);
    assert.match(skill, /不.*提问|直接.*改名/s);
    assert.match(skill, /替换.*优先级|修改.*优先级/s);
    assert.match(skill, /自动化|无人值守/);
    assert.equal(fs.existsSync(path.join(pluginRoot, "skills", "set-session-priority", "AGENTS.md")), false);
    assert.equal(fs.existsSync(path.join(pluginRoot, "skills", "set-session-priority", "CLAUDE.md")), false);
  });
});
