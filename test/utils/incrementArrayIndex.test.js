import incrementArrayIndex from '../../src/utils/incrementArrayIndex';

test('should increment array index', () => {
  const result = incrementArrayIndex(2, 4);
  expect(result).toBe(3);
});

test('should return 0 for last element in the array', () => {
  const result = incrementArrayIndex(3, 4);
  expect(result).toBe(0);
});
