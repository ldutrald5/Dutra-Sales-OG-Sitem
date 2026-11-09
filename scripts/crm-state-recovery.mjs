/* Explicit offline operator command. No default data directory, no live restore. */
import path from 'node:path';
import store from '../apps/sistema-og/server-state-store.cjs';
const [action,...args]=process.argv.slice(2);
try {
  if (process.env.RAILWAY_ENVIRONMENT_ID || process.env.RAILWAY_PROJECT_ID || process.env.RAILWAY_PUBLIC_DOMAIN || process.env.OG_PUBLIC_DOMAIN || process.env.NODE_ENV==='production') throw Error('Comando permitido somente em ambiente local isolado.');
  const options={};
  for(let index=0;index<args.length;index++) {
    const key=args[index];
    if(key==='--confirm-local'){options[key]=true;continue;}
    if(!['--source-dir','--backup-file','--target-dir'].includes(key) || !args[index+1] || args[index+1].startsWith('--') || options[key]) throw Error('Argumentos inválidos.');
    options[key]=path.resolve(args[++index]);
  }
  if(!options['--confirm-local'] || !options['--backup-file']) throw Error('Selecione backup e confirme --confirm-local.');
  let result;
  if(action==='export' && options['--source-dir'] && !options['--target-dir']) result=store.exportBackup(options['--source-dir'],options['--backup-file']);
  else if(action==='restore' && options['--target-dir'] && !options['--source-dir']) result=store.restoreBackup(options['--backup-file'],options['--target-dir']);
  else throw Error('Use export --source-dir ou restore --target-dir, com --backup-file e --confirm-local.');
  console.log(JSON.stringify(result));
} catch(error) { console.error(error.code || error.message); process.exitCode=1; }
