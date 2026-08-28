import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..");
const schemaUri = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
const portableFields = new Set([
  "$schema",
  "name",
  "version",
  "description",
  "author",
  "homepage",
  "repository",
  "license",
  "keywords",
  "extensions",
]);
const nativeManifestPaths = [
  ".claude-plugin/plugin.json",
  ".codex-plugin/plugin.json",
  ".cursor-plugin/plugin.json",
];
const nativeOnlyPluginNames = new Set(["session-priority"]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertOptionalString(manifest, field, label) {
  if (field in manifest) {
    assert.equal(typeof manifest[field], "string", `${label}.${field} must be a string`);
  }
}

function assertPortableManifest(manifest, label) {
  assert.ok(isPlainObject(manifest), `${label} must be a JSON object`);
  assert.deepEqual(
    Object.keys(manifest).filter((field) => !portableFields.has(field)),
    [],
    `${label} contains fields outside the closed Agent Plugins 1.0.0 schema`,
  );
  assert.equal(manifest.$schema, schemaUri, `${label} must target Agent Plugins 1.0.0`);
  assert.equal(typeof manifest.name, "string", `${label}.name must be a string`);
  assert.match(
    manifest.name,
    /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/,
    `${label}.name must satisfy the Agent Plugins name pattern`,
  );
  assert.ok(manifest.name.length <= 64, `${label}.name must be at most 64 characters`);

  for (const field of ["version", "description", "homepage", "repository", "license"]) {
    assertOptionalString(manifest, field, label);
  }

  if ("author" in manifest) {
    assert.ok(isPlainObject(manifest.author), `${label}.author must be an object`);
    assert.deepEqual(
      Object.keys(manifest.author).filter((field) => !["name", "email", "url"].includes(field)),
      [],
      `${label}.author contains unknown fields`,
    );
    for (const [field, value] of Object.entries(manifest.author)) {
      assert.equal(typeof value, "string", `${label}.author.${field} must be a string`);
    }
  }

  if ("keywords" in manifest) {
    assert.ok(Array.isArray(manifest.keywords), `${label}.keywords must be an array`);
    for (const keyword of manifest.keywords) {
      assert.equal(typeof keyword, "string", `${label}.keywords entries must be strings`);
    }
  }

  if ("extensions" in manifest) {
    assert.ok(isPlainObject(manifest.extensions), `${label}.extensions must be an object`);
    for (const [namespace, value] of Object.entries(manifest.extensions)) {
      assert.ok(isPlainObject(value), `${label}.extensions.${namespace} must be an object`);
    }
  }
}

function marketplacePlugins() {
  const marketplace = readJson(path.join(repoRoot, ".claude-plugin/marketplace.json"));
  return marketplace.plugins.map((entry) => ({
    ...entry,
    root: path.resolve(repoRoot, entry.source),
  }));
}

function discoveredSkills(pluginRoot) {
  const skillsRoot = path.join(pluginRoot, "skills");
  if (!fs.existsSync(skillsRoot)) return [];
  return fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(skillsRoot, entry.name, "SKILL.md")))
    .map((entry) => entry.name)
    .sort();
}

function assertPackagePathsStayInside(pluginRoot) {
  const resolvedRoot = fs.realpathSync(pluginRoot);

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        const resolved = fs.realpathSync(entryPath);
        assert.ok(
          resolved === resolvedRoot || resolved.startsWith(`${resolvedRoot}${path.sep}`),
          `${entryPath} resolves outside its plugin root`,
        );
      } else if (entry.isDirectory()) {
        visit(entryPath);
      }
    }
  }

  visit(pluginRoot);
}

describe("Agent Plugins 1.0.0 package contract", () => {
  test("host marketplace inventories stay aligned", () => {
    const claudeNames = marketplacePlugins().map((plugin) => plugin.name).sort();
    const codexMarketplace = readJson(
      path.join(repoRoot, ".agents", "plugins", "marketplace.json"),
    );
    const codexNames = codexMarketplace.plugins.map((plugin) => plugin.name).sort();
    assert.deepEqual(codexNames, claudeNames);

    const cursorMarketplace = readJson(
      path.join(repoRoot, ".cursor-plugin", "marketplace.json"),
    );
    for (const plugin of cursorMarketplace.plugins) {
      assert.ok(claudeNames.includes(plugin.name), `${plugin.name} must also be in the main marketplace`);
      assert.ok(
        fs.existsSync(path.join(repoRoot, "plugins", plugin.name, ".cursor-plugin", "plugin.json")),
        `${plugin.name} must provide a Cursor manifest`,
      );
    }
  });

  test("portable marketplace plugins have a valid and aligned root manifest", () => {
    for (const plugin of marketplacePlugins()) {
      if (nativeOnlyPluginNames.has(plugin.name)) continue;
      const manifestPath = path.join(plugin.root, "plugin.json");
      assert.ok(fs.existsSync(manifestPath), `${plugin.name}/plugin.json must exist`);
      assert.ok(fs.lstatSync(manifestPath).isFile(), `${plugin.name}/plugin.json must be a file`);

      const portable = readJson(manifestPath);
      assertPortableManifest(portable, `${plugin.name}/plugin.json`);
      assert.equal(portable.name, plugin.name);
      assert.equal(portable.version, plugin.version);

      for (const nativePath of nativeManifestPaths) {
        const manifestPath = path.join(plugin.root, nativePath);
        if (!fs.existsSync(manifestPath)) continue;
        const native = readJson(manifestPath);
        for (const field of [
          "name",
          "version",
          "description",
          "author",
          "license",
          "keywords",
        ]) {
          assert.deepEqual(
            native[field],
            portable[field],
            `${plugin.name}.${field} must stay aligned in ${nativePath}`,
          );
        }
      }
    }
  });

  test("hook plugins stay native-only until Agent Plugin hooks are supported", () => {
    for (const plugin of marketplacePlugins().filter(({ name }) => nativeOnlyPluginNames.has(name))) {
      assert.equal(
        fs.existsSync(path.join(plugin.root, "plugin.json")),
        false,
        `${plugin.name} must not expose an Agent Plugin root manifest while Codex skips its hooks`,
      );
      const codexManifest = readJson(path.join(plugin.root, ".codex-plugin/plugin.json"));
      assert.equal(codexManifest.hooks, "./hooks/hooks.json");
      assert.ok(fs.existsSync(path.join(plugin.root, "hooks", "hooks.json")));
    }
  });

  test("optional standard skills are immediate and package paths stay contained", () => {
    for (const plugin of marketplacePlugins()) {
      const skills = discoveredSkills(plugin.root);
      if (fs.existsSync(path.join(plugin.root, "skills"))) {
        assert.ok(skills.length > 0, `${plugin.name}/skills must expose an immediate standard skill`);
      }
      assertPackagePathsStayInside(plugin.root);
    }
  });

  test("the public marketplace stays focused and licensed", () => {
    assert.deepEqual(marketplacePlugins().map((plugin) => plugin.name), ["session-priority"]);
    assert.ok(fs.existsSync(path.join(repoRoot, "LICENSE")));
    assert.ok(fs.statSync(path.join(repoRoot, "skills")).isDirectory());
    assert.ok(fs.existsSync(path.join(repoRoot, "skills", "README.md")));

    const pluginRoot = path.join(repoRoot, "plugins", "session-priority");
    for (const manifestPath of nativeManifestPaths) {
      const manifest = readJson(path.join(pluginRoot, manifestPath));
      assert.equal(manifest.repository, "https://github.com/LingoPlayground/skills-public");
      assert.equal(manifest.license, "MIT");
    }
  });
});
