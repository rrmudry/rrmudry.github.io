const { shuffleArray } = require('../Apollo13/script');

test('returns array with same elements', () => {
  const arr = [1, 2, 3, 4];
  const result = shuffleArray(arr);
  expect(result).toEqual(expect.arrayContaining(arr));
  expect(result).toHaveLength(arr.length);
});

test('does not modify original array', () => {
  const arr = [1, 2, 3, 4];
  const copy = arr.slice();
  shuffleArray(arr);
  expect(arr).toEqual(copy);
});
