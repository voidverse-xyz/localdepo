import { promises as fs } from 'node:fs';
import { configPath, dataDir, uploadsDir } from './paths.js';
import { defaultConfig, migrate } from './schema.js';

/**
 * The only module that touches the config file. All reads/writes go through
 * here. Writes are serialized through a promise chain and committed atomically
 * (temp file + rename) so a crash mid-write can never corrupt config.json.
 */

let writeChain = Promise.resolve();

/** Run a task after all prior storage tasks, preserving chain on error. */
function enqueue(task) {
  const run = writeChain.then(task, task);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function ensureDirs() {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.mkdir(uploadsDir(), { recursive: true });
}

async function loadOrDefault() {
  try {
    const raw = await fs.readFile(configPath(), 'utf8');
    return migrate(JSON.parse(raw));
  } catch (err) {
    if (err.code === 'ENOENT') return defaultConfig();
    throw err;
  }
}

async function atomicWrite(config) {
  await ensureDirs();
  const file = configPath();
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(config, null, 2), 'utf8');
  await fs.rename(tmp, file);
  return config;
}

/** Read the current config, creating defaults on first run. */
export function readConfig() {
  return enqueue(async () => {
    await ensureDirs();
    const config = await loadOrDefault();
    return config;
  });
}

/** Overwrite the whole config atomically. */
export function writeConfig(config) {
  return enqueue(() => atomicWrite(migrate(config)));
}

/**
 * Atomic read-modify-write. The mutator receives a deep clone of the current
 * config and may mutate it in place or return a replacement.
 * @param {(config: import('../types.js').Config) => (void|object|Promise<void|object>)} mutator
 */
export function updateConfig(mutator) {
  return enqueue(async () => {
    const current = await loadOrDefault();
    const draft = structuredClone(current);
    const result = await mutator(draft);
    return atomicWrite(migrate(result || draft));
  });
}
