import durationPromiseRace from '../../src/utils/durationPromiseRace';

test('should create duration promise and resolve it faster then other promise that takes more time', () => {
  const promise = new Promise((r) => { setTimeout(() => { r(); }, 3000); })

  const storedTime = performance.now();

  return durationPromiseRace(1000, promise)
    .then(() => {
      const timePassed = performance.now() - storedTime;
      expect(timePassed).toBeLessThan(3000)
    })
});
