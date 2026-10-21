import appJson from '../app.json';

// Customer and delivery are separate installs on one phone (RULE-R-39), so the
// launcher name and Android package must stay distinct and exact.
test('app config declares the customer launcher name and Android package', () => {
  expect(appJson.expo.name).toBe('DairyToDoor');
  expect(appJson.expo.android.package).toBe('com.dairytodoor.customer');
});
