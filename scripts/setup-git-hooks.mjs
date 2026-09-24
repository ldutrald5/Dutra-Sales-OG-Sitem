import { spawnSync } from 'node:child_process';

const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit', shell: false });
if (result.status !== 0) console.warn('Não foi possível configurar os hooks locais; execute npm run hooks:setup dentro de um repositório Git.');
