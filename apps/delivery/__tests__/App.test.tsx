import { StyleSheet } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import App from '../App';

test('placeholder root screen shows the "DairyToDoor Delivery" title', async () => {
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = create(<App />);
  });
  expect(tree.root.findByProps({ accessibilityRole: 'header' }).props.children).toBe('DairyToDoor Delivery');
});

test('placeholder uses design tokens: Text #23313A on Canvas #F5F9FC', async () => {
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = create(<App />);
  });
  const header = tree.root.findByProps({ accessibilityRole: 'header' });
  expect(StyleSheet.flatten(header.props.style)).toMatchObject({ color: '#23313A', fontSize: 28, lineHeight: 36 });
  expect(StyleSheet.flatten(header.parent!.props.style).backgroundColor).toBe('#F5F9FC');
});
