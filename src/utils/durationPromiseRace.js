import fq from 'frame-q';

export default (duration, promise) => Promise.race([
  promise,
  new Promise((res) => {
    fq.wait(duration)
      .then(() => fq.add(() => { res(); }));
  })
]);
