import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { isForbiddenPath, scanText } from './secret-scan.mjs';

// Fake secrets are assembled at runtime so this file never matches the scanner itself.
const FAKE = {
  'private-key': '-----BEGIN ' + 'RSA PRIVATE KEY-----',
  'aws-access-key-id': 'AKIA' + 'ABCDEFGHIJKLMNOP',
  'github-token': 'ghp' + '_' + 'a'.repeat(36),
  'npm-token': 'npm' + '_' + 'b'.repeat(36),
  'slack-token': 'xox' + 'b-1234567890-abcdef',
  'google-api-key': 'AIza' + 'c'.repeat(35),
  'stripe-secret-key': 'sk' + '_live_' + 'd'.repeat(24),
  'url-credentials': 'postgresql://dtd_app:' + 'hunter2real' + '@localhost:5432/db',
};

for (const [rule, secret] of Object.entries(FAKE)) {
  test(`flags ${rule}`, () => {
    const findings = scanText('src/config.ts', `const ok = 1;\nconst x = "${secret}";\n`);
    assert.deepEqual(findings, [{ path: 'src/config.ts', line: 2, rule }]);
  });
}

test('findings never contain the secret value', () => {
  const out = JSON.stringify(scanText('a.ts', FAKE['github-token']));
  assert.ok(!out.includes(FAKE['github-token']));
});

test('ignores ordinary source, design tokens and lockfile integrity hashes', () => {
  const text = [
    "import { StyleSheet } from 'react-native';",
    'color: #0758A7; --color-brand-blue: #0758A7;',
    '"integrity": "sha512-' + 'Q'.repeat(86) + '=="',
    'https://registry.npmjs.org/react/-/react-19.2.3.tgz',
    'const tokens = { spacing: 4 };',
  ].join('\n');
  assert.deepEqual(scanText('x.ts', text), []);
});

test('allows placeholder URL passwords as used in .env.example', () => {
  for (const pw of ['CHANGE_ME', 'changeme', '<password>', '${DB_PASSWORD}', 'xxxx']) {
    assert.deepEqual(scanText('.env.example', `DATABASE_URL=postgresql://dtd_app:${pw}@localhost:5432/dtd_dev`), [], pw);
  }
});

test('tracked .env files are forbidden, examples are allowed', () => {
  for (const p of ['.env', 'apps/admin/.env', '.env.local', '.env.production']) assert.ok(isForbiddenPath(p), p);
  for (const p of ['.env.example', 'apps/api/.env.sample', '.env.template', 'env.ts', 'src/.environment.ts']) {
    assert.ok(!isForbiddenPath(p), p);
  }
});

test('CLI exits 1 on a planted key or tracked .env and 0 on a clean repo', () => {
  const script = fileURLToPath(new URL('./secret-scan.mjs', import.meta.url));
  const dir = mkdtempSync(join(tmpdir(), 'secret-scan-'));
  const run = () => spawnSync(process.execPath, [script], { cwd: dir, encoding: 'utf8' });
  const git = (...args) => execFileSync('git', args, { cwd: dir });
  try {
    git('init', '-q');
    writeFileSync(join(dir, 'ok.ts'), 'export const a = 1;\n');
    git('add', 'ok.ts');
    assert.equal(run().status, 0);

    writeFileSync(join(dir, 'leak.ts'), `export const k = '${FAKE['aws-access-key-id']}';\n`);
    git('add', 'leak.ts');
    const leak = run();
    assert.equal(leak.status, 1);
    assert.match(leak.stderr, /aws-access-key-id at leak\.ts:1/);
    assert.ok(!leak.stderr.includes(FAKE['aws-access-key-id']));

    git('rm', '-q', '--cached', 'leak.ts');
    writeFileSync(join(dir, '.env'), 'A=1\n');
    git('add', '-f', '.env');
    assert.match(run().stderr, /tracked-env-file at \.env/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
