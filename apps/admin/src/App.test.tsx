import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import App from './App';

test('placeholder shell renders the admin heading', () => {
  expect(renderToStaticMarkup(<App />)).toContain('<h1>DairyToDoor Admin</h1>');
});
