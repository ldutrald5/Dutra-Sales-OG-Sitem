import { spawnSync } from 'node:child_process';
import process from 'node:process';

const steps = [
  ['og:check'],
  ['og:sales-desk:test'],
  ['og:prospecting:test'],
  ['og:call-ai:test'],
  ['og:communication:test'],
  ['og:product:test'],
  ['og:ops:test'],
  ['og:library:test'],
  ['og:packages:test'],
  ['og:performance:test'],
  ['aiox:config-check']
];

for (const [script] of steps) {
  console.log(`\n[validate] npm run ${script}`);
  const result = process.platform === 'win32'
    ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `npm.cmd run ${script}`], { stdio: 'inherit', shell: false })
    : spawnSync('npm', ['run', script], { stdio: 'inherit', shell: false });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log('\nValidation suite: PASS');
