import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';

import { generate, run } from '../scripts/generate.mjs';

const pkg = new URL('../', import.meta.url);
const sourceText = readFileSync(new URL('tokens.json', pkg), 'utf8');
const source = JSON.parse(sourceText);
const sha = createHash('sha256').update(sourceText).digest('hex');
const outputs = generate(sourceText);
const css = outputs['generated/tokens.css'];
const cssVar = (name) => css.match(new RegExp(`^  --${name}: (.+);$`, 'm'))?.[1];

test('committed generated outputs match regeneration from tokens.json', () => {
  assert.deepEqual(run({ check: true }), []);
});

test('both outputs record the sha256 of tokens.json', () => {
  assert.equal(sha.length, 64);
  assert.ok(outputs['generated/tokens.ts'].includes(`export const sourceSha256 = '${sha}';`));
  assert.ok(css.includes(`--tokens-source-sha256: "${sha}";`));
});

test('TS module values equal the source (colors, status, px -> number)', async () => {
  const t = await import('../generated/tokens.ts');
  assert.equal(t.sourceSha256, sha);
  assert.deepEqual(t.colors, source.color);
  assert.deepEqual(t.deliveryStatus, source.deliveryStatus);
  assert.deepEqual(t.typography, source.typography);
  for (const [k, v] of Object.entries(source.spacing)) assert.equal(t.spacing[k], Number.parseInt(v, 10), k);
  for (const [k, v] of Object.entries(source.radius)) assert.equal(t.radii[k], Number.parseInt(v, 10), k);
  assert.equal(t.sizing.touchMin, 44);
  assert.equal(t.radii.pill, 999);
});

test('CSS custom properties equal the source and keep the design-system names', () => {
  assert.equal(cssVar('color-brand-blue'), source.color.brand.blue);
  assert.equal(cssVar('color-background-page'), source.color.background.page);
  assert.equal(cssVar('color-content-primary'), source.color.content.primary);
  assert.equal(cssVar('color-feedback-danger-text'), source.color.feedback.danger.text);
  assert.equal(cssVar('status-missed-bg'), source.deliveryStatus.missed.bg);
  assert.equal(cssVar('space-4'), '16px');
  assert.equal(cssVar('radius-pill'), '999px');
  assert.equal(cssVar('text-h1-size'), '28px');
  assert.equal(cssVar('font-sans'), source.typography.family.primary);
  assert.equal(cssVar('motion-standard'), '200ms');
  assert.ok(!css.includes('icon'), 'icon names are not CSS values');
});

test('output is deterministic', () => {
  assert.deepEqual(generate(sourceText), outputs);
});

const mutate = (fn) => {
  const copy = structuredClone(source);
  fn(copy);
  return JSON.stringify(copy);
};

for (const [name, text, message] of [
  ['invalid JSON', '{ "color": ', /not valid JSON/],
  ['non-object root', '[]', /at \$: expected an object/],
  ['missing section', mutate((t) => delete t.spacing), /at spacing: missing section/],
  ['bad hex color', mutate((t) => (t.color.brand.blue = 'blue')), /at color\.brand\.blue: expected #RRGGBB/],
  ['short hex color', mutate((t) => (t.color.content.primary = '#233')), /at color\.content\.primary/],
  ['bad status color', mutate((t) => (t.deliveryStatus.paid.text = undefined)), /deliveryStatus\.paid\.text/],
  ['non-px spacing', mutate((t) => (t.spacing['4'] = '16')), /at spacing\.4: expected <n>px/],
  ['rem radius', mutate((t) => (t.radius.md = '1rem')), /at radius\.md/],
  ['non-numeric font size', mutate((t) => (t.typography.styles.h1.size = '28px')), /typography\.styles\.h1\.size/],
]) {
  test(`rejects malformed input: ${name}`, () => {
    assert.throws(() => generate(text), message);
  });
}

test('--check reports drift and missing outputs without writing; write mode repairs them', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dtd-tokens-'));
  const root = pathToFileURL(dir + '/');
  try {
    cpSync(new URL('tokens.json', pkg), join(dir, 'tokens.json'));
    cpSync(new URL('generated', pkg), join(dir, 'generated'), { recursive: true });
    assert.deepEqual(run({ check: true, root }), []);

    writeFileSync(join(dir, 'generated/tokens.css'), css.replace(source.color.brand.blue, '#000000'));
    rmSync(join(dir, 'generated/tokens.ts'));
    assert.deepEqual(run({ check: true, root }).sort(), ['generated/tokens.css', 'generated/tokens.ts']);

    run({ root });
    assert.deepEqual(run({ check: true, root }), []);

    // Editing the source without regenerating is drift too.
    writeFileSync(join(dir, 'tokens.json'), mutate((t) => (t.color.brand.blue = '#0758A8')));
    assert.deepEqual(run({ check: true, root }).sort(), ['generated/tokens.css', 'generated/tokens.ts']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
