import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

if (!fs.existsSync('.git')) {
  console.log('Hooks locais ignorados: ambiente sem diretório .git.');
  process.exit(0);
}

const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit', shell: false });
if (result.status !== 0) console.warn('Não foi possível configurar os hooks locais; execute npm run hooks:setup dentro de um repositório Git.');
