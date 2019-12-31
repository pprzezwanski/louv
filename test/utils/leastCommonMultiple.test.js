import leastCommonMultiple from '../../src/utils/leastCommonMultiple';

test('should return least common multiple', () => {
  const result = leastCommonMultiple(2, 3);
  expect(result).toBe(6)
})
