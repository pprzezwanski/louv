import deepExtend from 'deep-extend';

export default (...args) => {
  let id;
  let opts = {};

  if (args) {
    args.forEach((arg) => {
      if (typeof arg === 'number') id = arg;
      else if (typeof arg === 'object') opts = arg;
      else if (typeof arg === 'function') opts.preCallback = arg;
    });
  }

  const options = deepExtend({
    startInLoop: 0,
    upstream: false,
    startFromMorph: 0,
  }, opts);

  if (options.endAfterLoop == null) options.endAfterLoop = options.startInLoop;

  return [id, options];
};
