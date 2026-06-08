import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

async function isDirectory(targetPath) {
  try {
    const stat = await fs.stat(targetPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export async function findPresentationsSkillDir() {
  const override = process.env.CODEX_PRESENTATIONS_SKILL_DIR;
  if (override) {
    const resolved = path.resolve(override);
    if (!(await isDirectory(resolved))) {
      throw new Error(`CODEX_PRESENTATIONS_SKILL_DIR does not exist: ${resolved}`);
    }
    return resolved;
  }

  const cacheRoot = path.join(
    os.homedir(),
    ".codex",
    "plugins",
    "cache",
    "openai-primary-runtime",
    "presentations",
  );

  let versions;
  try {
    versions = await fs.readdir(cacheRoot, { withFileTypes: true });
  } catch (error) {
    throw new Error(
      [
        `Could not read Codex Presentations cache at ${cacheRoot}.`,
        "Make sure the Presentations plugin is installed in this Codex environment.",
        error.message || String(error),
      ].join("\n"),
    );
  }

  const candidates = versions
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      version: entry.name,
      skillDir: path.join(cacheRoot, entry.name, "skills", "presentations"),
    }))
    .sort((left, right) => right.version.localeCompare(left.version, undefined, { numeric: true }));

  for (const candidate of candidates) {
    if (await isDirectory(candidate.skillDir)) {
      return candidate.skillDir;
    }
  }

  throw new Error(`No Presentations skill directory found under ${cacheRoot}.`);
}
