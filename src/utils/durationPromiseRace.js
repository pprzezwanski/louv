import fq from 'frame-q';

export default (duration, promise, safetyMargin) => Promise.race([
  promise,
  new Promise((res) => {
    fq.wait(duration + safetyMargin)
      .then(() => fq.add(() => { res(); }));
  })
]);
