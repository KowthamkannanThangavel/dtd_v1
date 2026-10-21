#!/usr/bin/env node
// Dependency-free secret scan over git-tracked files (DEF-DTD-003).
// Only actions/checkout may run in CI (APR-DTD-DEF-002), so this replaces a third-party scanner action.
// shortcut: fixed high-signal patterns only (no entropy analysis or git history scan); adopt a dedicated
// scanner (e.g. gitleaks binary) if the repo starts handling real provider credentials.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const PATTERNS = [
  { id: 'private-key', re: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/ },
  { id: 'aws-access-key-id', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { id: 'github-token', re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})\b/ },
  { id: 'npm-token', re: /\bnpm_[A-Za-z0-9]{36}\b/ },
  { id: 'slack-token', re: /\bxox[abposr]-[A-Za-z0-9-]{10,}/ },
  { id: 'google-api-key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { id: 'stripe-secret-key', re: /\b[sr]k_live_[0-9A-Za-z]{16,}\b/ },
  // user:password@host inside a URL; placeholder passwords are allowed (see isPlaceholder).
  { id: 'url-credentials', re: /[a-z][a-z0-9+.-]*:\/\/[^\s:/@'"]+:([^\s@/'"]+)@/i, group: 1 },
];

const PLACEHOLDER = /^(?:change_?me|changeit|password|passwd|secret|example|x+|\*+|<[^>]*>|\$\{[^}]*\}|\$[A-Z_]+)$/i;

export function isPlaceholder(value) {
  return PLACEHOLDER.test(value);
}

// Real env files must never be tracked; .env.example (placeholders only) is the documented exception.
export function isForbiddenPath(path) {
  const name = path.split('/').pop();
  return /^\.env(?:\..+)?$/.test(name) && !/^\.env\.(?:example|sample|template)$/.test(name);
}

// Returns findings without the secret value itself, so CI logs never echo a leaked credential.
export function scanText(path, text) {
  const findings = [];
  text.split(/\r?\n/).forEach((line, i) => {
    for (const { id, re, group } of PATTERNS) {
      const m = re.exec(line);
      if (m && !(group && isPlaceholder(m[group]))) findings.push({ path, line: i + 1, rule: id });
    }
  });
  return findings;
}

export function scanRepo(cwd = process.cwd()) {
  const files = execFileSync('git', ['ls-files', '-z'], { cwd, encoding: 'utf8' }).split('\0').filter(Boolean);
  const findings = [];
  for (const path of files) {
    if (isForbiddenPath(path)) findings.push({ path, line: 0, rule: 'tracked-env-file' });
    let buf;
    try {
      buf = readFileSync(join(cwd, path));
    } catch {
      continue; // tracked but deleted in the working tree: nothing to scan
    }
    if (buf.includes(0)) continue; // binary
    findings.push(...scanText(path, buf.toString('utf8')));
  }
  return { files: files.length, findings };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { files, findings } = scanRepo();
  for (const f of findings) console.error(`secret-scan: ${f.rule} at ${f.path}:${f.line}`);
  console.log(`secret-scan: ${files} tracked files, ${findings.length} finding(s)`);
  process.exit(findings.length ? 1 : 0);
}
