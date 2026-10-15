'use strict';
const path = require('node:path');
const {globSync} = require('glob');

// An explicit AIOX subset, not a drop-in implementation of every fast-glob API.
const supported = new Set(['cwd', 'onlyFiles', 'absolute', 'dot', 'unique', 'ignore', 'followSymbolicLinks']);
function checked(pattern) {
  if (typeof pattern !== 'string' || !pattern) throw new TypeError('Expected non-empty glob strings');
  if (pattern.length > 4096) throw new RangeError('DUTRA glob pattern length exceeds 4096');
  let braces = 0, parentheses = 0, escaped = false;
  for (const ch of pattern) {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '{') braces++;
    if (ch === '(') parentheses++;
    if (ch === '}') braces = Math.max(0, braces - 1);
    if (ch === ')') parentheses = Math.max(0, parentheses - 1);
    if (braces + parentheses > 32) throw new RangeError('DUTRA glob pattern nesting exceeds 32');
  }
  return pattern;
}
function sync(patterns, options = {}) {
  for (const key of Object.keys(options)) {
    if (!supported.has(key)) throw new TypeError(`DUTRA glob adapter: unsupported option ${key}`);
  }
  if (options.unique === false) throw new TypeError('DUTRA glob adapter requires unique results');
  if (options.ignore !== undefined && !Array.isArray(options.ignore)) throw new TypeError('ignore must be an array');
  const inputs = Array.isArray(patterns) ? patterns : [patterns];
  const positive = [], negative = (options.ignore || []).map(checked);
  for (const pattern of inputs) {
    checked(pattern);
    if (pattern.startsWith('!') && !pattern.startsWith('!(')) negative.push(pattern.slice(1));
    else positive.push(pattern);
  }
  const cwd = path.resolve(options.cwd || process.cwd());
  const found = new Set();
  for (const pattern of positive) {
    const matches = globSync(pattern, {
      cwd, nodir: options.onlyFiles !== false, dot: options.dot === true,
      absolute: options.absolute === true, follow: options.followSymbolicLinks !== false,
      ignore: negative, windowsPathsNoEscape: false,
    });
    for (const match of matches) found.add(match.replaceAll('\\', '/'));
  }
  // Dynamic patterns share a breadth-first traversal in the pinned consumers.
  const relative = p => path.relative(cwd, path.resolve(cwd, p)).replaceAll('\\', '/');
  return [...found].sort((a, b) => {
    const ar = relative(a), br = relative(b);
    return ar.split('/').length - br.split('/').length || (ar < br ? -1 : ar > br ? 1 : 0);
  });
}
module.exports = {sync};
