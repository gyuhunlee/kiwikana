// Stop hook: runs the fast logic tests for changed files (docs/testing.md section 4).
import { execSync, spawnSync } from 'node:child_process';

async function readHookInput() {
  if (process.stdin.isTTY) return {};
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

const hook = await readHookInput();
if (hook.stop_hook_active) process.exit(0);

const status = execSync('git status --porcelain -uall', { encoding: 'utf8' });
const touchedLogic = status
  .split('\n')
  .map((line) => line.slice(3).replace(/"/g, '').split(' -> ').pop() ?? '')
  .some((file) => file.startsWith('src/') && file.endsWith('.ts'));
if (!touchedLogic) process.exit(0);

// shell: true so npm resolves on Windows (npm.cmd).
const run = spawnSync('npm run -s test:changed', { shell: true, encoding: 'utf8' });
if (run.status === 0) process.exit(0);

process.stderr.write(`${run.stdout ?? ''}\n${run.stderr ?? ''}`);
process.exit(2);
