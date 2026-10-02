#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LEVELS = new Set(['L0','L1','L2','L3']);
const REQUIRED = {
  L0: ['MISSION'],
  L1: ['MISSION','CURRENT STATE','TARGET STATE','SCOPE','ACCEPTANCE CRITERIA','TEST PLAN'],
  L2: ['MISSION','CURRENT STATE','TARGET STATE','CONTEXT MANIFEST','SOURCE OF TRUTH','PRE-FLIGHT','SCOPE','OUT OF SCOPE','ACCEPTANCE CRITERIA','TEST PLAN','DEFINITION OF DONE'],
  L3: ['MISSION','CURRENT STATE','TARGET STATE','CONTEXT MANIFEST','SOURCE OF TRUTH','PRE-FLIGHT','SCOPE','OUT OF SCOPE','EXECUTION PLAN','REUSE FIRST','DO NOT','ACCEPTANCE CRITERIA','TEST PLAN','DEFINITION OF DONE','FINAL REPORT'],
};
const TOKEN_WARN = { L0:700, L1:1800, L2:4000, L3:Infinity };

function normalizeHeading(s){
  return s.trim().replace(/^#+\s*/, '').replace(/[：:]+$/,'').trim().toUpperCase();
}

export function estimateTokens(text){ return Math.ceil(text.length / 4); }

export function lintPrompt(text,{level='L2',allowPlaceholders=false}={}){
  level = String(level).toUpperCase();
  if(!LEVELS.has(level)) throw new Error(`Invalid level ${level}`);
  const headings = new Set(text.split(/\r?\n/).filter(l=>/^#{1,3}\s+/.test(l)).map(normalizeHeading));
  const errors=[]; const warnings=[];
  for(const h of REQUIRED[level]) if(!headings.has(h)) errors.push(`missing required section: ${h}`);

  const secretPatterns = [
    /(?:API[_-]?KEY|ACCESS[_-]?TOKEN|BEARER|PASSWORD|SECRET)\s*[=:]\s*["']?[A-Za-z0-9_\-.]{12,}/ig,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  ];
  for(const rx of secretPatterns) if(rx.test(text)) errors.push('possible secret value embedded in prompt');

  if(!allowPlaceholders){
    const placeholder = /(\[COLE[^\]]*\]|\bTBD\b|\bTODO\b|<INSIRA[^>]*>|\{\{[^}]+\}\})/i;
    if(placeholder.test(text)) warnings.push('unresolved placeholder detected');
  }

  if(/carregue\s+(?:toda|todos).*?(?:docs|knowledge|reposit[oó]rio)/i.test(text)) warnings.push('possible broad-context loading instruction');
  if(/recrie|reescreva\s+do\s+zero/i.test(text) && !/não|nao/i.test(text.slice(Math.max(0,text.search(/recrie|reescreva/i)-30), text.search(/recrie|reescreva/i)))) warnings.push('possible rewrite-from-zero instruction; verify ADR/guardrails');

  const tokens=estimateTokens(text);
  if(tokens > TOKEN_WARN[level]) warnings.push(`estimated ${tokens} tokens exceeds ${level} guidance (${TOKEN_WARN[level]})`);

  if((level==='L2'||level==='L3') && !/required\s*:/i.test(text)) warnings.push('CONTEXT MANIFEST should declare required:');
  if((level==='L2'||level==='L3') && !/do_not_load\s*:/i.test(text)) warnings.push('CONTEXT MANIFEST should declare do_not_load:');

  return { level, tokens, errors, warnings, ok: errors.length===0 };
}

function cli(){
  const args=process.argv.slice(2);
  if(!args.length){
    console.log('Usage: node scripts/prompt-lint.mjs <prompt-file> [--level=L0|L1|L2|L3] [--allow-placeholders]');
    process.exit(0);
  }
  const file=args[0];
  const level=(args.find(a=>a.startsWith('--level='))||'--level=L2').split('=')[1];
  const allowPlaceholders=args.includes('--allow-placeholders');
  const text=fs.readFileSync(file,'utf8');
  const result=lintPrompt(text,{level,allowPlaceholders});
  console.log(`Prompt lint ${result.ok?'PASS':'FAIL'} — ${path.basename(file)} — ${result.level} — ~${result.tokens} tokens`);
  for(const e of result.errors) console.error(`ERROR ${e}`);
  for(const w of result.warnings) console.warn(`WARN ${w}`);
  if(!result.ok) process.exit(1);
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) cli();
