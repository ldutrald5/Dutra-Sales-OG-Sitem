import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const model = require('../apps/sistema-og/operations-model.js');
const [command = 'help', ...args] = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}

function writeJson(file, value) {
  const target = path.resolve(file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return target;
}

function usage() {
  console.log(`Sistema OG — operações (schema v${model.SCHEMA_VERSION})

Uso:
  npm run og:ops -- init --output <arquivo>
  npm run og:ops -- migrate --input <arquivo> [--output <arquivo>] [--dry-run]
  npm run og:ops -- validate --input <arquivo>
  npm run og:ops -- summary --input <arquivo>`);
}

if (command === 'help') usage();
else if (command === 'init') {
  const output = option('--output');
  if (!output) throw new Error('Informe --output');
  console.log(`Criado: ${writeJson(output, model.createEmptyOperations())}`);
} else if (command === 'migrate') {
  const input = option('--input');
  if (!input) throw new Error('Informe --input');
  const migrated = model.migrateOperations(readJson(input));
  const validation = model.validateOperations(migrated);
  if (!validation.valid) throw new Error(validation.errors.join('\n'));
  if (args.includes('--dry-run')) console.log(JSON.stringify(model.summarizeOperations(migrated), null, 2));
  else console.log(`Migrado: ${writeJson(option('--output') || input, migrated)}`);
} else if (command === 'validate') {
  const input = option('--input');
  if (!input) throw new Error('Informe --input');
  const validation = model.validateOperations(readJson(input));
  if (!validation.valid) { console.error(validation.errors.join('\n')); process.exitCode = 1; }
  else console.log('Operations schema: VALID');
} else if (command === 'summary') {
  const input = option('--input');
  if (!input) throw new Error('Informe --input');
  console.log(JSON.stringify(model.summarizeOperations(readJson(input)), null, 2));
} else {
  usage();
  process.exitCode = 1;
}

