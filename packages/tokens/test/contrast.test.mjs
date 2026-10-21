// WCAG 2.1 contrast of key token pairs (Design System spec §03). Ratios are computed, never hardcoded.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { colors, deliveryStatus } from '../generated/tokens.ts';

const AA_TEXT = 4.5;

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('contrast() matches WCAG reference points', () => {
  assert.ok(Math.abs(contrast('#FFFFFF', '#000000') - 21) < 1e-9);
  assert.equal(contrast('#777777', '#777777'), 1);
  assert.ok(Math.abs(contrast('#FFFFFF', '#767676') - 4.54) < 0.01);
});

const textPairs = {
  'White (content.inverse) on Primary Blue': [colors.content.inverse, colors.brand.blue],
  'Text (content.primary) on Canvas (background.page)': [colors.content.primary, colors.background.page],
  'content.primary on background.surface': [colors.content.primary, colors.background.surface],
  'content.secondary on background.surface': [colors.content.secondary, colors.background.surface],
  'content.link on background.surface': [colors.content.link, colors.background.surface],
  'Accessible Green (brand.greenDeep) on background.surface': [colors.brand.greenDeep, colors.background.surface],
  ...Object.fromEntries(Object.entries(colors.feedback).map(([k, v]) => [`feedback.${k}.text on bg`, [v.text, v.bg]])),
  ...Object.fromEntries(Object.entries(deliveryStatus).map(([k, v]) => [`deliveryStatus.${k}.text on bg`, [v.text, v.bg]])),
};

for (const [name, [fg, bg]] of Object.entries(textPairs)) {
  test(`AA normal text: ${name} >= 4.5:1`, () => {
    const ratio = contrast(fg, bg);
    assert.ok(ratio >= AA_TEXT, `${fg} on ${bg} = ${ratio.toFixed(2)}:1`);
  });
}

test('White on Leaf Green fails AA and is not exposed as any text-on-surface pair', () => {
  assert.ok(contrast(colors.content.inverse, colors.brand.leafGreen) < AA_TEXT);
  const pairs = [...Object.values(colors.feedback), ...Object.values(deliveryStatus)];
  for (const { text, bg } of pairs) {
    assert.notEqual(bg, colors.brand.leafGreen);
    assert.notEqual(text, colors.brand.leafGreen); // Leaf Green is decorative, never meaningful text
  }
});
