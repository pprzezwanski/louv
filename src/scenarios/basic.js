import fragmentize from '../morphs/fragmentize';
import restructure from '../morphs/restructure';
import fadein from '../morphs/fadein-gallery';
import fadeout from '../morphs/fadeout-gallery';

export default {
  present: [
    fragmentize(0, {
      scale: 0,
      scaledGap: 0.1,
    }),
    fadein(500, {
      timingFunction: 'cubic-bezier(1, 0, 1, 1)',
    }),
    restructure(1400, {
      delay: 0,
      onebyoneInterval: 6,
      startFrom: 'last',
      timingFunction: 'cubic-bezier(.8,0,.1,1)',
    }),
  ],
  wait: 3000,
  hide: [
    fadeout(1000, {
      delay: 1000,
    }),
    fragmentize(1000, {
      scale: 0,
      scaledGap: 0.1,
      onebyoneInterval: 10,
      timingFunction: 'cubic-bezier(.3,0,.1,1)',
    }),
  ],
  waitAfter: 1000
};
