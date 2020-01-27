import fragmentize from '../morphs/fragmentize';
import cylinderize from '../morphs/cylinderize';
import transform from '../morphs/transform';
import restructure from '../morphs/restructure';
import fadein from '../morphs/fadein-gallery';
import fadeout from '../morphs/fadeout-gallery';

const cylinderizeDuration = 2700;
const cylinderizeTiming = 'cubic-bezier(.2, 0, .1, 1)';

const rotationTranslate = {
  x: '7%',
  y: '0',
  z: '-200px',
};

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
    cylinderize(cylinderizeDuration, {
      parallel: true,
      sType: true,
      angleInRadians: Math.PI / 13,
      timingFunction: cylinderizeTiming,
    }),
    transform(cylinderizeDuration, {
      target: 'picture',
      translate: rotationTranslate,
      rotate: '-70deg',
      rotateVector: [-1, 1, 0],
      timingFunction: 'cubic-bezier(.4, 0, .1, 1)',
    }),
    transform(4500, {
      target: 'picture',
      delay: 1500,
      translate: rotationTranslate,
      rotate: '-73deg',
      rotateVector: [-1.2, 0.1, 0.8],
      timingFunction: 'cubic-bezier(.5, 0, .3, 1)',
    }),
  ],
  wait: 1000,
  hide: [
    transform(4500, {
      target: 'picture',
      translate: rotationTranslate,
      rotate: '-140deg',
      rotateVector: [-1.2, 0.8, 0.8],
      timingFunction: 'cubic-bezier(.5, 0, .3, 1)',
    }),
    fadeout(2500, {
      delay: 2000,
    }),
    cylinderize(2500, {
      parallel: true,
      delay: 2100,
      sType: true,
      angleInRadians: Math.PI / 20,
    }),
    transform(4500, {
      target: 'picture',
      delay: 2100,
      translate: rotationTranslate,
      rotate: '-240deg',
      rotateVector: [-1.2, 0.8, 0.8],
      timingFunction: 'cubic-bezier(.5, 0, 1, 1)',
    }),
  ],
  waitAfter: 500
};
