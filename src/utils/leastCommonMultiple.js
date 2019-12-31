// find greatest common divisor
const gcdFinder = (a, b) => (!b ? a : gcdFinder(b, a % b));

// find and export least common multiple
export default (a, b) => a * b / gcdFinder(a, b);
