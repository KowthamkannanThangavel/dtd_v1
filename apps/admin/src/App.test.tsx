import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import App from './App';

test('placeholder shell renders the admin heading', () => {
  expect(renderToStaticMarkup(<App />)).toContain('<h1>DairyToDoor Admin</h1>');
});

// Values of these properties are asserted against tokens.json in packages/tokens/test/generate.test.mjs.
test('placeholder shell styles use @dtd/tokens CSS custom properties, not hardcoded colors', () => {
  const html = renderToStaticMarkup(<App />);
  expect(html).toContain('background:var(--color-background-page)');
  expect(html).toContain('color:var(--color-content-primary)');
  expect(html).toContain('font-family:var(--font-sans)');
  expect(html).not.toMatch(/#[0-9A-Fa-f]{6}/);
});
