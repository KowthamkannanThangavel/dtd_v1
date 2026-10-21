import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import App from '../App';

test('placeholder root screen shows the "DairyToDoor" title', async () => {
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = create(<App />);
  });
  expect(tree.root.findByProps({ accessibilityRole: 'header' }).props.children).toBe('DairyToDoor');
});
