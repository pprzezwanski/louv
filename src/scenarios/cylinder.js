import fragmentize from '../morphs/fragmentize';
import cylinderize from '../morphs/cylinderize';
import transform from '../morphs/transform';
import restructure from '../morphs/restructure';
import fadein from '../morphs/fadein-gallery';
import fadeout from '../morphs/fadeout-gallery';

export default {
  present: [
    fragmentize(0, {
      scale: 0.2,
      scaledGap: 0.2,
    }),
    fadein(1000, {
      timingFunction: 'cubic-bezier(1, 0, 1, 1)',
    }),
    restructure(2500),
    cylinderize(2700, {
      parallel: true,
      angleInRadians: Math.PI / 14,
      timingFunction: 'cubic-bezier(.2, 0, .1, 1)',
    }),
    transform(2700, {
      target: 'picture',
      translate: { x: '12%', y: '18%', z: '-200px' },
      rotate: '80deg',
      rotateVector: [-1, 1, 0],
      timingFunction: 'cubic-bezier(.4, 0, .1, 1)',
    }),
  ],
  wait: 1000,
  hide: [
    transform(4500, {
      target: 'picture',
      translate: { x: '-10%', y: '-10%', z: '-200px' },
      rotate: '250deg',
      rotateVector: [-1, 1, 0],
      timingFunction: 'cubic-bezier(.5, 0, .3, 1)',
    }),
    fadeout(2500, {
      delay: 2000,
    }),
    fragmentize(2500, {
      scale: 0.1,
      scaledGap: 0.1,
      delay: 2000,
    }),
  ],
  waitAfter: 500
};
