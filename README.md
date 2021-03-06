# [louv](https://ho-gi.com) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/pprzezwanski/louv/blob/master/LICENSE) [![Build Status](https://travis-ci.org/pprzezwanski/louv.svg?branch=master)](https://travis-ci.com/pprzezwanski/louv) [![Coverage Status](https://coveralls.io/repos/github/pprzezwanski/louv/badge.svg?branch=master)](https://coveralls.io/github/pprzezwanski/louv?branch=master)

Louv is a JavaScript library that simplifies production of image or text complex transformations that can be animated and chained while ensuring they are smooth, responsive and cross-browser

In most simple words Louv presents and hides sliced pictures (image or text type) with certain scenarios that consisit of chained (or parallel) configurable morphs that are css based transformations.

Louv library consists of the LouvGallery (default import), morphs, scenarios and for advanced users: morphFactory, pictureFactory.

Louv's morphFactory takes complicated things out of developers head while giving space to concentrate on the art of geometrical and time aspects. It helps prepare css class for complex transformations of picture molecules, atoms or picture itself. Every morph is a single css class.

Louv's pictureFactory is standalone module that will slice any image or text into molecules with usefull selectors that enable styling with css.

#### Battle tested with different use cases on [ho-gi.com](https://ho-gi.com).

## Documentation

* [Table of contents](https://github.com/pprzezwanski/louv/wiki)
* [10 minutes quick start tutorial](https://github.com/pprzezwanski/louv/wiki/quick-start-tutorial)

## Use cases:

* **design complex animated transformations:** thanks to its built in morphs and morphFactory tool for new morphs creation louv is comfortable tool to design any kind of injected css based transformations, including ones that seems to be impossible
* **create gallery** louv has build in a gallery mechanism with methods: presentPicture, hidePicture, next, loop 
* **slice image or text into molecules** louv's picture factory is a tool to split html img element into canvas molecules or split html text into span elements containing words or chars.

## Features:

* **Smooth, efficient, optimized:** Louv is written performance-wise - it uses hardware acceleration, injected single-class css and frame-q tasks scheduler to minimize repaints and reflows during animations which overal gives smooth framerate results.
* **Developer friendly API:** Louv delivers asynchronous control over animations progress at any stage, cross-instances state managment, window size recalculations, preloading styles options, lazy-loading with srcset or src detection, pausing add continuing, looping, breaking asynchronous processes and other. With morphFactory on the other hand write your own image or text morphing functions, take advantage of its built in options, and don't bother with any aspect of styles, html or event listeners injecting, awaiting animations, iterating thru particles, which all will be done for you. 
* **User friendly:** Just write your scenario and Louv will play it.
* **Ultimately asynchronous:** In Louv everything is a promise that awaits asynchronous events like loading or animating.
* **Several loading options:** Louv is lazy-loading images by its own. But there is more to load and yuser can choos not to preload anything, to preload just pictures, to preload all calculated css for certain picture or to preload all items and all calculated css for them.
* **Multi-instance:** louvState is a single word of truth for all Louv instances in aspects where collisions are possible.
* **Component-Based:** Use components you wish: Louv, pictureFactory, morphFactory to create anything you wish.
* **Cross-browser:** Louv is compatibile even with IE11 when used with polyfills and consciousness of some css limitations. All major latest browsers are covered: Chrome, Safari, Edge, Firefox.
* **Responsive:** when window size changes louv recalculates pictures and css even when in the middle of asynchronous process. 

## Components

Louv consists of several tools:
* **LouvGallery (default import):** the heart of louv - the engine that takes full advantage of all components to present images or texts. You can have many instances and nest one gallery inside of another.
* **morphs (in 'morphs' subfolder)** configurable transormations of pictures. Morph needs to instantiated with configuration to be valid object with .action method. Beofre that it is a morph object factory.
* **scenarios (in 'scenarios' subfolder)** ready scenarios for those want to start quickly. If you like some scenario goodd solution is to copy its code into your project and adjust configuration to your taste.
* **morphFactory:** a factory function that lets you produce custom morph transforming LouvImage or LouvText. It has built in options like 'one-by-one' or 'line-by-line' transitions delay but also controlls injecting css, transition stack for every possible target (gallery, picture, molecule), morphs processing scope, listening to transitionend or alternatively setTimeout and calculating overall duration.
* **pictureFactory:** creates LouvPicture of certain type (image or text) with optionally sliced element derived from given source. Can be used as standalone to lazy-load and/or split source into molecules.

## Core concepts

### Scenario object:

Scenario is core concept of the api simplification idea. It consits of 4 phases: 'present', 'wait', 'hide', 'waitAfter'. Each phase is an array of morphs which are implemented in given order - waiting one for another or in parallel.

Scenarios is an array of object that is obliatory part of LouvGallery (default import from louv) config but defaults to 'example' from scenarios.

### Morph object:

Morph is an object to has 'duration' property and 'action' method which is some kind of transformation of the LouvPicture (image or text) which is using the fact that the content is splitted into molecules. Morph is made with morphFactory. Morph takes as first argument duration and as second one config object that can have many properties among which are those supplied by morphFactory (delay, parallel, oneByOne, to name a few) and those supplied by morphConfig feeding morphFactory function.

## Installation

```
yarn add louv
```

and for importing sass file from node_modules we have to add sass config:
```
includePaths: ['node_modules']
```

than in style.scss we write: `@import 'louv/lib/louv'`;

You can also manually copy the file from this repo from [here](https://github.com/pprzezwanski/louv/blob/master/src/louv.scss).

(currently only sass file is supplied)

## Usage

#### html:

```
<div class="js-some-louv louv">
    <img
        src=""
        data-srcset="
            images/img1-300w.jpg 300w,
            images/img1-600w.jpg 600w,
            images/img1-900w.jpg 900w"
        data-src="images/img1-300w.jpg"
        alt="img1"
    >
    <img
        src=""
        data-srcset="
            images/img2-300w.jpg 300w,
            images/img2-600w.jpg 600w,
            images/img2-900w.jpg 900w"
        data-src="images/img2-300w.jpg"
        alt="img2"
    >
</div>

```

#### minimal (will use default scenario): 

```javascript
import Louv from 'louv;

const louvInstance = new Louv({ selector: '.js-some-louv' })
louvInstance.init();
```

#### complex example:

Below we import default Louv which is the gallery engine & api. Named import below are morphs. It is the easiest way to import a morph.
Please note however that more optimized (shorter build time in development) are imports of morphs directly from node_modules (import from 'louv/lib/morphs') but in this case node_modules/louv should not be excluded in a babel or other parser because of use of  es6 'import'. When exluding node_modules you should ommit louv: '/node_modules(?!(\/|\\)louv)/' 

```javascript
import Louv, {
  cylinderize,
  fragmentize,
  restructure,
  transform,
  fadeinGallery as fadein,
  fadeoutGallery as fadeout,
} from 'louv;

const scenario1 = {
  present: [
    fragmentize(0, { shrinkedScaling: 0.2 }),
    fadein(1000, {
      timingFunction: 'cubic-bezier(1, 0, 1, 1)',
    }),
    restructure(2500),
    cylinderize(2700, {
      parallel: true,
      angleInRadians: Math.PI / 14,
    }),
    transform(2700, {
      target: 'picture',
      rotate: '80deg',
      rotateVector: [-1, 1, 0],
      translate: { x: '12%', y: '18%', z: '-200px' },
      timingFunction: 'cubic-bezier(.4, 0, .2, 1)',
    }),
  ],
  wait: 1000,
  hide: [
    transform(2700, {
      target: 'picture',
      rotate: '250deg',
      rotateVector: [-1, 1, 0],
      translate: { x: '-5vw', y: '-5vh', z: '-200px' },
      timingFunction: 'cubic-bezier(.5, 0, .3, 1)',
    }),
    fadeout(2500, {
      delay: 2000,
    }),
    fragmentize(2500, {
      shrinkedScaling: 0.1,
      delay: 2000,
    }),
  ],
  waitAfter: 500
};
const scenario2 = {
  present: [
    fragmentize(0, { shrinkedScaling: 0.2 }),
    fadein(1000, {
      timingFunction: 'cubic-bezier(1, 0, 1, 1)',
    }),
    restructure(initialRestructureDuration),
    cylinderize(cylinderizeDuration, {
      parallel: true,
      sType: true,
      angleInRadians: Math.PI / 13,
      timingFunction: 'cubic-bezier(.2, 0, .2, 1)',
    }),
    transform(2500, {
      target: 'picture',
      rotate: '-70deg',
      rotateVector: [-1, 1, 0],
      translate: { x: '7%', z: '-200px' },
      timingFunction: 'cubic-bezier(.4, 0, .2, 1)',
    }),
    transform(4500, {
      target: 'picture',
      delay: 1500,
      translate: { x: '7%', z: '-200px' },
      rotate: '-73deg',
      rotateVector: [-1.2, 0.1, 0.8],
      timingFunction: 'cubic-bezier(.5, 0, .3, 1)',
    }),
  ],
  wait: 1000,
  hide: [
    transform(4500, {
      target: 'picture',
      translate: { x: '7%', z: '-200px' },
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
      translate: { x: '7%', z: '-200px' },
      rotate: '-240deg',
      rotateVector: [-1.2, 0.8, 0.8],
      timingFunction: 'cubic-bezier(.5, 0, 1, 1)',
    }),
  ],
  waitAfter: 500
}


const louvInstance = new Louv({
  selector: '.something',
  passive: true,
  imageOptions: {
    cropImage: true,
    moleculesAmount: isMobileOrTablet ? 11 : 13,
  },
  preloadAll: !isMobileOrTablet,
  scenarios: [scenario1, scenario2],
})

louvInstance.init()
  .then(() => louvInstance.presentPicture())
  .then(() => promiseSmthElse())
  .then(() => louvInstance.next);

// or:

smthElse
  .then(() => {
    louvInstance.init();
    anotherThing();
    return louvInstance.promiseTo.beReady
  })
  .then(() => louvInstance.loop())
  .then(() => promiseSmthElse())
  .then(() => louvInstance.next);
```

## Contributing

The main purpose of this repository is to continue to evolve louv and create more morphs and scenarios. So there is a big field to contribute. Also the engine can benefit from new features. The author will be gratefull to the community for any suggestions and contributing (fork/pull requests workflow).

## License

Louv is [MIT licensed](./LICENSE).
Copyright (c) 2018-2019 Pawel Przezwanski <[https://ho-gi.com/](https://ho-gi.com/)>
