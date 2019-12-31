import deepExtend from 'deep-extend';
import fq from 'frame-q';
import resetMorphs from './resetMorphs';
import setTransition from './setTransition';
import phantomGallery from './phantomGallery';
import loadCss from './loadCss';
import setListenTarget from './setListenTarget';
import awaitMorphEnd from './awaitMorphEnd';
import updateTransitionsStack from './updateTransitionsStack';
import calculateMorphDuration from './calculateMorphDuration';

export default (morphName, morphOptions) => (duration = 0, configuration) => {
  const options = deepExtend({
    scope: 'picture', // available: 'global', 'gallery', 'picture'
    target: undefined, // we cannot make default value for target because restructure sets target in its instance cofiguration inside of scenario
    property: 'transform',
    propertyValue: null, // function returning a cssText for property value or returning a function that iterated thru molecules will return unique cssText for every molecule
    customIteration: null,
    additionalCss: null, // function returning css rules as text which are independent from main property and cannot be transitioned (animated)
    callback: null, // function to be executed apart from adding css
    externalClasses: [],
    defaultConfig: {
      transitions: [],
      target: 'molecule',
      parallel: false,
      overwritePrevious: true,
      transforms: [],
      timingFunction: 'ease',
      removeSelfAfter: false,
      delay: 0,
      onEndCallback: null,
      calculateEnd: false,
      endOffset: 0,
      onebyone: {
        interval: 50,
        step: 'molecule',
        startFrom: 'first',
        delay: false,
        duration: false,
      },
    },
  }, morphOptions);

  const config = deepExtend(options.defaultConfig, configuration);

  const { property, propertyValue } = options;
  const { parallel, delay, onebyone } = config;

  const isOneByOne = (onebyone.delay || onebyone.duration) && onebyone.interval;
  
  // const target = options.target || config.target;
  const definedTarget = options.target || config.target;

  if (!definedTarget) throw new Error('Morth should have specified property "target". Either in its configuration object for morphFactory function or in config of its instance in scenario.');

  if (definedTarget && !(['gallery', 'picture', 'molecule', 'atom'].find(c => c === definedTarget))) throw new Error('There is probably typo error in morph instance (in scenario) "target" property. Check your scenarios.');

  const target = (isOneByOne && definedTarget === 'picture')
    ? 'molecule'
    : (definedTarget || 'molecule'); // TODO: make it separate function

  config.duration = duration;
  config.isOneByOne = isOneByOne;

  if (
    propertyValue
    && (typeof propertyValue !== 'string')
    && (typeof propertyValue !== 'function')
  ) throw new Error('morphFactory function second arguments property named "propertyValue" should be typeof function or string. String should not be empty. If typeof function it will be iterated for every molecule');
  
  // prevent bugs when scope is gallery or global and we have differences in trasition-delay or transition-duration between molecules
  if (isOneByOne) options.scope = 'picture';
  // if (onebyone) options.scope = 'picture';

  const forcedListening = duration === 0 && isOneByOne;

  const listenToMolecule = (isOneByOne && onebyone.startFrom === 'last')
    ? 'first'
    : 'last';

  let removedMorphs;

  return {
    name: morphName,
    options,
    config,
    delay,
    parallel,
    action: (picture, gallery = phantomGallery) => {
      const data = {
        morphName, options, config, picture, gallery
      };

      const morphDuration = calculateMorphDuration({ config, picture });

      return {
        duration: morphDuration,
        promise: new Promise((r) => {
          let morphClassName;

          if (gallery.config.debug) {
            console.log(`${morphName.toUpperCase()} for picture:`, picture.id, 'in gallery:', gallery.id);
          }

          if (!picture.molecules[picture.molecules.length - 1]) console.log('morphFactory error for G', gallery.id, gallery.name, { ...gallery });

          // set bolean for transitionEnd event listening
          const awaitTransitionEnd = (duration || forcedListening) && !config.parallel;

          loadCss(data).then(name => fq.add(() => {
            morphClassName = name;

            if (awaitTransitionEnd) {
              const isEdge = /Edge/.test(navigator.userAgent); // edge 17 no transitionend

              const shouldListen = !isEdge
                                && !config.calculateEnd
                                && !gallery.config.calculateMorphEnd;

              const listenTarget = shouldListen && setListenTarget({
                target,
                listenToMolecule,
                picture,
                gallery
              });

              const afterTransitionEnd = () => {
                if (gallery.config.debug) console.log(`@ MORPH END DETECTED IN: ${morphClassName}, by ${shouldListen ? 'LISTENING TO TRANSITION END' : 'AWAITING MORPH DURATION'}`);

                if (options.removeSelfAfter) picture.element.classList.remove(morphClassName);
                if (config.onEndCallback) config.onEndCallback({ gallery, picture });
                fq.add(() => r({ picture, removedMorphs }));
              };

              awaitMorphEnd({
                afterTransitionEnd,
                shouldListen,
                listenTarget,
                morphDuration,
              });
            }

            updateTransitionsStack({ target, ...data });
          }))
            .then(() => fq.add(() => {
              const interactWithTheBrowser = () => {
                if (config.overwritePrevious) {
                  setTransition(gallery, target);

                  // remove previous morph classes and store them in array: removedMorphs
                  removedMorphs = resetMorphs(picture, target, property);
                }

                // add current morph class
                picture.element.classList.add(morphClassName);

                // update picture state with morphClassName
                if (!picture.currentMorphs[target]) {
                  picture.currentMorphs[target] = {};
                }
                if (!picture.currentMorphs[target][property]) {
                  picture.currentMorphs[target][property] = [];
                }
                picture.currentMorphs[target][property].push(morphClassName);

                // add additional classes
                if (options.externalClasses) {
                  options.externalClasses.forEach((c) => {
                    picture.element.classList.add(c);
                  });
                }

                // apply callback that cannot be changed or set by end-user
                if (options.callback) options.callback(data);

                // apply callback that can be set by end-user from morph config
                if (config.callback) config.callback(data);
              };

              if (config.delay) fq.wait(config.delay).then(() => fq.add(interactWithTheBrowser));

              else fq.add(() => interactWithTheBrowser());

              if (!awaitTransitionEnd) {
                r({ picture, removedMorphs, morphDuration });
              }
            }));
        })
      };
    }
  };
};
