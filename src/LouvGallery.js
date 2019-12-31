import deepExtend from 'deep-extend';
import louvState from './louvState';
import fq from 'frame-q';
import { loadCss, resetMorphs } from './morphFactory';
import pictureFactory from './pictureFactory';

import getWindowWidth from './utils/getWindowWidth';
import getWindowHeight from './utils/getWindowHeight';
import EventObserver from './utils/EventObserver';
import incrementArrayIndex from './utils/incrementArrayIndex';
import decrementArrayIndex from './utils/decrementArrayIndex';
import leastCommonMultiple from './utils/leastCommonMultiple';
import durationPromiseRace from './utils/durationPromiseRace';
import analyseOptionalArguments from './utils/analyseOptionalArguments';
import initialScenario from './scenarios/example';

/*!
 * Louv v1.1.0
 * (c) 2019 Paweł Przezwański <pprzezwanski@gmail.com>
 * Released under the MIT License.
 * Repository and instructions: https://github.com/pprzezwanski/louv/
 */

/**
 * The API of Louv Gallery. Controlls creation of pictures,
 * morphs and their interactions
 * @author <a href="mailto:contact@ho-gi.com">Pawel Przezwanski</a>
 * @class
 * @param {object} options, object with options
 * @example const louv = new Louv({ selector: '.my-new-louv' })
 */

export default class Louv {
  constructor(options) {
    this.config = deepExtend({
      selector: '[data-louv]', // class name for main element
      width: 100, // for images: % of containers width
      height: 100, // for images: % of containers height
      initialWidth: null,
      initialHeight: null,
      passive: false,
      type: 'image',
      preloadAllPictures: true,
      preloadPictureCss: true,
      preloadAllCss: true,
      globalWaitAfterPresent: null,
      globalWaitAfterHide: null,
      loadingMessage: true,
      onWindowChange: {
        recalculate: true,
        firstRescale: false,
        onlyRescale: false,
      },
      debug: false,
      textOptions: {},
      imageOptions: {},
      upstream: false,
      morphDurationRace: true,
      morphDurationSafetyMargin: 500,
      scenarios: [initialScenario]
    }, options);
    this.id = null;
    this.name = options && options.name;
    this.element = options && options.element;
    this.initialized = false;
    this.width = null;
    this.height = null;
    this.originalWidth = null;
    this.originalHeight = null;
    this.sources = [];
    this.pictures = [];
    this.noDatasetScenarioPictures = [];
    this.scenariosAssignments = [];
    this.minGalleryLoops = null;
    this.promiseTo = {
      finishLoading: null,
      finishAnimating: new Promise(r => r()),
      loadAllPictures: null,
      continue: Promise.resolve(),
      beReady: null,
    };
    this.picturesPromises = [];
    this.state = {
      picture: null,
      scenario: null,
      scenarioId: 0,
      loop: 0,
      scenarioCounter: 0,
      transitions: {
        gallery: [],
        picture: [],
        molecule: [],
        atom: []
      },
      morphId: null,
      phase: null,
      removedMorphs: null,
      looped: false,
      unlooped: false,
      paused: false,
      continueFrom: null,
      lastRecalculateWidth: null,
      cssText: '',
    };
    this.previousState = {};
    this.observers = {
      currentMorphEnd: new EventObserver(),
      continue: new EventObserver(),
    };

    this.originalHtml = null;
    this.window = {
      timeout: null,
      hasChanged: false,
      previousWidth: null,
      previousHeight: null
    };

    this.onWindowChangeAction = this.onWindowChangeAction.bind(this);
    this.presentPicture = this.presentPicture.bind(this);

    if (!this.config.passive) this.init();
  }

  /**
     * @method
     * Pushes a 'this' instance to louvState.galleries array
     * and sets new id of tthe gallery
     */
  setGalleryId() {
    const id = louvState.galleries.push(this.element) - 1;
    this.id = this.name || id;
    if (this.config.debug) console.log('SETTING ID:', this.id, 'IN G', this);
  }

  /**
     * @method
     * Sets attribute 'data-louv-gallery-id' to gallery element
     */
  setGalleryDatasetId() {
    this.element.setAttribute('data-louv-gallery-id', this.id);
  }

  /**
     * @method
     * Stores gallery children elements as children of their parent
     */
  storeSources() {
    this.sources = Array.from(this.element.children);
  }

  /**
     * @method
     * Sets attribute 'data-louv-image' for every child of the gallery
     * with the value of its index in this.sources array
     */
  setSourcesId() {
    this.sources.forEach((el, i) => el.setAttribute('data-louv-image', i));
  }

  storeOriginalHtml() {
    this.originalHtml = this.element.innerHTML;
  }

  wait(ms) { return fq.wait(ms); }

  /**
     * @method
     * Hides gallery html element by setting inline style opacity to '0'
     * and transition duration to given duration
     * @param {number} duration, the duration of opacity css transition
     */
  hide(duration = 0, deactivate = false) {
    if (this.config.debug) console.log('HIDING G', this.id);
    if (!this.element) return this;
    this.element.style.transition = `opacity ${duration / 1000}s linear`;
    this.element.style.opacity = '0';
    // this.state.cssText = `
    //   transition: opacity ${duration / 1000}s linear;
    //   opacity: 0;
    // `;

    // this.element.cssText = this.state.cssText;
    return this;
  }

  /**
     * @method
     * Shows gallery html element by setting inline style opacity to '1'
     * and transition duration to given duration
     * @param {number}  duration, the duration of opacity css transition
     */
  show(duration = 0) {
    if (this.config.debug) console.log('SHOWING G', this.id);
    if (!this.element) return this;

    this.element.style.transition = `opacity ${duration / 1000}s linear`;
    // .99 is a hack for chrome preventing repaint on transition end to opacity: 1
    // this.element.style.opacity = '0.99';
    this.element.style.opacity = '1';
    // this.state.cssText = `transition: opacity ${duration / 1000}s linear; opacity: 1;`;
    // this.element.cssText = this.state.cssText;
    return this;
  }

  deactivate() {
    this.element.classList.add('is-inactive');
    return this;
  }

  activate() {
    this.element.classList.remove('is-inactive');
    return this;
  }

  setNextPicture(id, upstream = false) {
    this.previousState.picture = this.state.picture;
    let index;
    if (id != null) {
      index = id;
    } else {
      index = this.config.upstream || upstream
        ? decrementArrayIndex(this.state.picture.id, this.sources.length)
        : incrementArrayIndex(this.state.picture.id, this.sources.length);
    }
    this.state.picture = this.pictures[index];
    return this;
  }

  setScenario(id) {
    this.state.scenarioId = id;
    this.state.scenario = this.config.scenarios[this.state.scenarioId];
  }

  updateScenarioCounter() {
    this.state.scenarioCounter = this.config.upstream
      ? decrementArrayIndex(this.state.scenarioCounter, this.config.scenarios.length)
      : incrementArrayIndex(this.state.scenarioCounter, this.config.scenarios.length);
  }

  setNextScenario(picture, scenarioId) {
    if (scenarioId) {
      this.setScenario(scenarioId);
      return this;
    }

    const scenarioIds = this.scenariosAssignments[picture.id];

    if (scenarioIds.length === 1) [this.state.scenarioId] = scenarioIds;
    else {
      this.setScenario(this.state.scenarioCounter);
      this.updateScenarioCounter();
    }

    this.state.scenario = this.config.scenarios[this.state.scenarioId];

    return this;
  }

  pause() {
    if (this.config.debug) console.log('PAUSING G', this.id, 'CURRENT PHASE:', this.state.phase);

    this.state.paused = true;

    this.promiseTo.continue = new Promise((r) => {
      this.observers.continue.attach(() => { r(); });
    });

    return this;
  }

  continue({
    fromPicture,
  } = {}) {
    if (this.config.debug) {
      console.log('--> CONTINUE IN G', this.id, this.name ? `: ${this.name}` : '');
      if (this.state.morphId) {
        console.log('CONTINUING PHASE', this.state.phase, 'IN G', this.id, this.name ? `: ${this.name}` : '');
        console.log('NEXT MORPH:', this.state.scenario[this.state.phase][this.state.morphId]);
      }
    }

    if (fromPicture != null) {
      this.hidePicture(true);

      this.state.continueFrom = fromPicture;
    }

    this.state.paused = false;

    const continueAction = () => this.observers.continue.notify().clean();

    if (this.state.scheduledRecalculate) {
      this.recalculate().then(() => fq.add(() => {
        this.state.scheduledRecalculate = false;
        continueAction();
      }));
    } else {
      continueAction();
    }

    return this;
  }

  executeCurrentPhaseMorphs(sourceArray, morphAction, phase, startFrom = 0) {
    if (phase == null) throw new Error('executeCurrentPhaseMorphs needs to specify phase as third argument');

    return new Promise((r) => {
      const promisesArray = [];
      const lastIndex = sourceArray.length - 1;

      const executeMorph = (i) => {
        this.state.morphId = i;
        if (this.config.debug) console.log('this.state.morphId', this.state.morphId, 'in phase', phase, 'IN G', this.id, this.name ? `: ${this.name}` : '');

        this.promiseTo.continue
          .then(() => fq.add(() => {
            let morphPromise;

            if (
              this.state.continueFrom != null
              || (phase !== this.state.phase)
            ) {
              // if oposite phase was executed before current phase natural end we have to instantly resolve all morphs in this promise chain
              morphPromise = Promise.resolve();
            } else {
              const { promise, duration } = morphAction(i);

              morphPromise = this.config.morphDurationRace || i === lastIndex
                ? durationPromiseRace(duration, promise)
                : promise;
            }

            promisesArray.push(morphPromise);

            return morphPromise;
          }))
          .then(() => fq.add(() => {
            this.observers.currentMorphEnd.notify(i)/* .clean() */;
            const nextId = incrementArrayIndex(i, sourceArray.length);
            if (nextId !== 0) executeMorph(nextId);
            else {
              if (this.config.debug) console.log('END OF PHASE', this.state.phase, 'IN G', this.id, this.name ? `: ${this.name}` : '', 'SCENARIO', this.state.scenarioId);

              r(promisesArray);
              if (this.config.debug && phase !== this.state.phase) console.log('phase conflict for', phase, 'after all morphs finished');
              if (phase === this.state.phase) r(promisesArray);
            }
          }));
      };

      executeMorph(startFrom);
    });
  }

  // returns promise that waits for end
  // of the current scenario current phase nth morph
  promiseNthMorph(n) {
    return new Promise((r) => {
      this.observers.currentMorphEnd.attach((i) => {
        if (i === n - 1) r(i);
      });
    });
  }

  presentPicture(...args) {
    if (this.config.debug) console.log('--> --> presentPicture, current phase:', this.state.phase);

    const promise = new Promise((r) => {
      const [id, options] = analyseOptionalArguments(...args);

      if (id != null) this.setNextPicture(id);

      const { picture } = this.state;

      if (!picture) return;

      this.promiseTo.continue
        .then(() => fq.add(() => {
          if (this.state.phase !== 'hide') this.hide();

          this.state.phase = 'present';

          this.setNextScenario(picture, options.scenarioId);

          if (this.config.debug) console.log('PRESENTING PICTURE', picture.id, 'IN G', this.id, this.name ? `: ${this.name}` : '', 'WITH SCENARIO:', this.state.scenarioId, ':', this.state.scenario, 'startingFromMorph', options.startFromMorph);

          if (options.preCallback) options.preCallback(picture);

          return new Promise((res) => {
            fq.add(() => {
              if (this.config.preloadPictureCss && !this.config.preloadAllPictures) {
                this.preloadPictureCss(picture, [this.state.scenarioId]);
              }

              // we cannot make picture.show() here because it will blink at beginning of phase
              picture.activate();

              // execute 'present' phase of current scenario and resolve promise with this.executeCurrentPhaseMorphs promise
              res(this.executeCurrentPhaseMorphs(
                this.state.scenario.present,
                index => this.state.scenario.present[index].action(picture, this),
                this.state.phase,
                options.startFromMorph
              ));
            });
          });
        }))
        .then(promises => fq.add(() => Promise.all(promises)))
        .then(() => fq.add(() => {
          if (options.postCallback) options.postCallback(this);
          // this.state.phase = 'wait';
          r(this.state.picture.id);
        }));
    });

    this.promiseTo.finishAnimating = promise;
    return promise;
  }

  hidePicture(immediately = false) {
    if (this.config.debug) console.log('--> --> hidePicture, current phase:', this.state.phase);

    const promise = new Promise((r) => {
      const { picture } = this.state;

      if (!picture) return;

      this.promiseTo.continue
        .then(() => fq.add(() => {
          this.state.phase = 'hide';

          if (this.config.debug) console.log('HIDING PICTURE', picture.id, 'IN G', this.id, this.name ? `: ${this.name}` : '', 'WITH SCENARIO:', this.state.scenarioId, ':', this.state.scenario);

          const coreAction = () => {
            if (this.config.debug) console.log('hidePicture core action in G', this.id, this.name ? `: ${this.name}` : '');

            picture.hide().deactivate();
            resetMorphs(picture);
            this.state.phase = 'waitAfter';
          };

          if (immediately) {
            if (this.config.debug) console.log('IMMEDIATELY HIDE PICTURE AND GALLERY IN G', this.id, this.name ? `: ${this.name}` : '');
            this.hide();
            coreAction();
            r(this.state.picture.id);
          } else {
            fq.add(() => {
              this.executeCurrentPhaseMorphs(
                this.state.scenario.hide,
                index => this.state.scenario.hide[index].action(picture, this),
                this.state.phase,
              )
                .then(promises => fq.add(() => Promise.all(promises)))
                .then(() => fq.add(() => {
                  if (this.state.phase === 'hide') coreAction();
                  r(this.state.picture.id);
                }));
            });
          }
        }));
    });

    this.promiseTo.finishAnimating = promise;
    return promise;
  }

  next(...args) {
    if (this.config.debug) console.log('--> --> THIS.NEXT IN G', this.id, this.name ? `: ${this.name}` : '');

    const [id, options] = analyseOptionalArguments(...args);

    return new Promise((r) => {
      this.hidePicture()
        .then(() => fq.add(() => {
          this.state.phase = 'waitAfter';
          const waitAmount = this.config.globalWaitAfterHide != null
            ? this.config.globalWaitAfterHide
            : this.state.scenario.waitAfter || 0;

          return this.state.continueFrom != null
            ? Promise.resolve()
            : this.wait(waitAmount);
        }))
        .then(() => fq.add(() => this.promiseTo.finishLoading))
        .then(() => fq.add(() => {
          if (this.state.looped) this.state.loop += 1;
          if (this.state.continueFrom != null) this.state.continueFrom = null;

          this.setNextPicture(id, options.upstream);

          return this.presentPicture(id, options);
        }))
        .then(() => fq.add(() => { r(this.state.picture.id); }));
    });
  }

  loop(...args) {
    if (this.config.debug) console.log('--> --> THIS.LOOP NO', this.state.loop, 'IN G', this.id, this.name ? `: ${this.name}` : '');

    this.state.unlooped = false;

    // if loop is reapplied but this.state.loopedis true;
    if (this.state.looped) this.state.looped = false;

    const [id, options] = analyseOptionalArguments(...args);

    const loopedAction = () => {
      if (this.state.unlooped) return;

      const opts = this.state.loop !== 0
        ? {
          ...options,
          startFromMorph: 0,
          scenarioId: null
        }
        : { ...options };

      if (this.config.debug) console.log('~~ loop number:', this.state.loop);

      if (
        (this.state.looped && this.state.loop === 0) // to prevent twice callback on loop: 0;
        || this.state.loop < options.startInLoop
        || this.state.loop > options.endAfterLoop
      ) {
        if (opts.preCallback) opts.preCallback = null;
        if (opts.postCallback) opts.postCallback = null;
      }

      const nextId = typeof this.state.continueFrom === 'number'
        ? this.state.continueFrom
        : undefined; // if continueFrom is 'next' it will automatically set next picture when nextId is undefined

      const promise = this.state.looped
        ? this.next(nextId, opts)
        : this.presentPicture(id, opts);

      // this cannot be earlier because previous line reads it to make decision
      this.state.looped = true;

      promise
        .then(() => fq.add(() => {
          this.state.phase = 'wait';

          const waitAmount = this.config.globalWaitAfterPresent == null
            ? (this.state.scenario && this.state.scenario.wait) || 0
            : this.config.globalWaitAfterPresent;

          return this.state.continueFrom != null
            ? Promise.resolve()
            : this.wait(waitAmount);
        }))
        .then(() => fq.add(() => this.promiseTo.continue))
        .then(() => fq.add(() => { loopedAction(); }));
    };

    fq.add(() => loopedAction());

    return this.promiseTo.finishAnimating;
  }

  unloop() {
    this.state.unlooped = true;

    return this;
  }

  shrink() {
    if (this.config.debug) console.log('SHRINKING PICTURE', this.state.picture.id, 'IN G', this.id, this.name ? `: ${this.name}` : '');
    if (this.state.picture) {
      fq.add(() => {
        this.state.picture.element.classList.add('is-shrinked');
      });
    }
    return this;
  }

  unshrink() {
    if (this.config.debug) console.log('UNSHRINKING PICTURE', this.state.picture.id, 'IN G', this.id, this.name ? `: ${this.name}` : '');
    if (this.state.picture) {
      fq.add(() => {
        this.state.picture.element.classList.remove('is-shrinked');
      });
    }
    return this;
  }

  flatten(shrink = true) {
    if (this.state.picture) {
      if (this.config.debug) console.log('FLATTENING PICTURE', this.state.picture.id, 'IN G', this.id, this.name ? `: ${this.name}` : '');

      fq.add(() => {
        this.state.picture.element.classList.add('is-flattened');
        if (shrink) this.shrink();
      });
    }
    return this;
  }

  unflatten() {
    if (this.state.picture) {
      if (this.config.debug) console.log('UNFLATTENING PICTURE', this.state.picture.id, 'IN G', this.id, this.name ? `: ${this.name}` : '');
      this.state.picture.element.classList.remove('is-flattened');
      this.state.picture.element.classList.remove('is-shrinked');
    }
    return this;
  }

  restoreInitialHtml() {
    this.element.innerHTML = this.originalHtml;
    this.sources = Array.from(this.element.children);
    this.sources.forEach((el, i) => {
      el.setAttribute('data-louv-picture', i);
    });
  }

  recalculatePicture(picture, reloadCss = true) {
    if (!picture) {
      console.log('recalculatePicture error in LouvGallery', { ...this });
    }

    const scenarios = this.scenariosAssignments[picture.id];

    let curMorphs = '';

    if (reloadCss) {
      this.applyToCurrentMorphs((morph) => { curMorphs += ` ${morph}`; });
    }

    louvState.usedMorphsConfigs.pictureScope[`g-${this.id}-p-${picture.id}`] = {};
    picture.maxHeight = this.height;
    picture.maxWidth = this.width;
    if (this.config.debug) console.log('RECALCULATING P', picture.id, 'TYPE: ', this.config.type, 'IN G', this.id, this.name ? `: ${this.name}` : '');

    return new Promise((r) => {
      picture.recalculate(!reloadCss, curMorphs).then(() => fq.add(() => {
        if (reloadCss) {
          // we will automatically remove old style tag and create a new one
          this.preloadPictureCss(picture, scenarios)
            .then(() => fq.add(() => {
              picture.show();
              r();
            }));
        } else {
          // remove picture related style tags because it will be automatically recreated during morphs loading when presenting next picture
          const pictureStyleTags = Array.from(
            document.querySelectorAll(`[id*="g${this.id}-p${picture.id}"]`)
          );

          pictureStyleTags.forEach((styleTag) => {
            styleTag.parentNode.removeChild(styleTag);
          });
          picture.deactivate();
          r();
        }
      }));
    });
  }

  applyToCurrentMorphs(callback) {
    const targetMorphs = Object.values(this.state.picture.currentMorphs);
    targetMorphs.forEach((val) => {
      const propertyMorphs = Object.values(val);
      propertyMorphs.forEach((morphs) => {
        morphs.forEach((morph) => { callback(morph); });
      });
    });
  }

  scaleGallery(ratio, duration = 1000) {
    return new Promise((r) => {
      this.element.style.transition = `transform ${duration}ms cubic-bezier(.2,0,.3,1)`;
      this.element.style.transform = `scale(${ratio})`;
      this.wait(duration + 100).then(() => fq.add(() => { r(); }));
    });
  }

  recalculate(windowWidth) {
    if (this.config.debug) console.log('RECALCULATE IN G', this.id, this.name ? `: ${this.name}` : '', 'currentPicture:', this.state.picture, 'current phase:', this.state.phase);

    this.pause();
    const currentPicture = this.state.picture;

    return new Promise((r) => {
      fq.add(() => {
        this.readInitialDimensions();
      }).then(() => fq.add(() => {
        this.calculateScaledDimensions();

        let ratio;
        if (this.config.type === 'image') {
          ratio = this.state.picture.isLandscape
            ? this.width / this.originalWidth
            : this.height / this.originalHeight;
        } else {
          ratio = this.width / this.originalWidth;
        }

        if (
          this.config.onWindowChange.onlyRescale
          || (
            this.config.onWindowChange.firstRescale
              && this.config.type === 'image'
              && ratio < 1.2
          )
        ) {
          this.scaleGallery(ratio).then(() => fq.add(() => r()));
        } else {
          this.storeOriginalDimensions();

          let i = currentPicture.id;

          const updateCurrentPicture = new Promise((res) => {
            this.recalculatePicture(currentPicture)
              .then(() => fq.add(() => {
                i += 1;
                res();
              }));
          });

          updateCurrentPicture
            .then(() => fq.add(() => {
              const recalculatePromises = [];
              const l = this.pictures.length + this.state.picture.id;
              for (i; i < l; i += 1) {
                const index = i < this.pictures.length ? i : i - this.pictures.length;
                if (this.pictures[index]) { // todo: check: when picture is not loaded but started to load
                  recalculatePromises.push(this.recalculatePicture(this.pictures[index], false));
                }
              }
              return Promise.all(recalculatePromises);
            }))
            .then(() => fq.add(() => {
              this.state.lastRecalculateWidth = windowWidth;
              this.continue();
              r();
            }));
        }
      }));
    });
  }

  onWindowChangeAction(easeTime = 0) {
    if (this.config.debug) console.log('WINDOW CHANGE DETECTED IN G', this.id, this.name ? `: ${this.name}` : '', 'this.window.hasChanged', this.window.hasChanged);

    const wasAlreadyPaused = this.state.paused;

    this.pause();
    fq.wait(10).then(() => fq.add(() => {
      if (this.window.hasChanged) return;
      const windowWidth = getWindowWidth();
      const windowHeight = getWindowHeight();
      if (windowWidth === this.window.previousWidth/*  && windowHeight === this.window.previousHeight */) {
        this.continue();
        return;
      }
      this.window.previousWidth = windowWidth;
      this.window.previousHeight = windowHeight;
      this.window.hasChanged = true;

      const lastWidth = this.state.lastRecalculateWidth;

      this.state.scheduledRecalculate = wasAlreadyPaused;

      const recalculatePromise = (!wasAlreadyPaused && (!lastWidth || lastWidth !== windowWidth))
        ? this.recalculate(windowWidth)
        : Promise.resolve();

      recalculatePromise.then(() => fq.add(() => {
        if (!wasAlreadyPaused) this.continue();
        this.window.previousWidth = undefined;
        this.window.previousHeight = undefined;
        this.window.hasChanged = false;
        this.activateWindowResizeListeners();
      }));
    }));
  }

  setInitialState(config = {
    id: 0,
    scenarioId: 0,
    loop: 0
  }) {
    const { id, scenarioId, loop } = config;
    if (this.config.debug) console.log('SETTING CURRENT STATE IN G', this.id, this.name ? `: ${this.name}` : '', 'WITH CONFIG:', config);
    this.state.picture = this.pictures[id];
    this.state.scenarioId = scenarioId;
    this.state.scenario = this.config.scenarios[scenarioId];
    this.state.loop = loop;
  }

  createLoadingMessage() {
    if (louvState.loadingMessage) return this;

    louvState.loadingMessage = document.createElement('DIV');
    louvState.loadingMessage.classList.add('louv__loading');
    if (this.config.debug) console.log('APPENDING LOADING MESSAGE');
    document.body.appendChild(louvState.loadingMessage);
    louvState.loadingMessageAppended = true;
    return this;
  }

  showLoadingMessage() {
    if (this.config.debug) console.log('SHOW LOADING MESSAGE IN G', this.id, this.name ? `: ${this.name}` : '');
    louvState.currentlyLoading.push(this.id);
    louvState.loadingMessage.classList.add('is-visible');
  }

  hideLoadingMessage() {
    if (this.config.debug) console.log('HIDE LOADING MESSAGE IN G', this.id, this.name ? `: ${this.name}` : '');
    louvState.currentlyLoading = louvState.currentlyLoading.filter(c => c !== this.id);

    if (louvState.currentlyLoading.length === 0) {
      louvState.loadingMessage.classList.remove('is-visible');
    }
  }

  /**
     * @method
     * Creates a single object called 'picture' using special class
     * based on type that has been set in Louv class options object
     * property called 'type'
     * @param {number} number, the id of the gallery item
     * that is the source for new obect creation
     * @returns {promise} promise, that is resolved when 'picture'
     * is created (often after loading some resources, like image)
     * and hidden (opacity: 0) and deactivated (display: none)
     */
  createPicture(id) {
    const picture = pictureFactory({
      type: this.config.type,
      id,
      source: this.sources[id],
      gallery: this,
      options: {
        ...this.config[`${this.config.type}Options`],
        maxWidth: this.width,
        maxHeight: this.height
      }
    });

    const promise = new Promise((r) => {
      if (this.config.debug) console.log('--- loading P', picture.id, 'IN G', this.id, this.name ? `: ${this.name}` : '');
      picture.load().then(() => fq.add(() => {
        if (this.config.debug) console.log('--- loaded P', picture.id, 'IN G', this.id, this.name ? `: ${this.name}` : '');
        r(picture);
      }));
    });

    return promise;
  }

  storePicturesPromises(startFromId = 0) {
    if (this.config.debug) console.log('STORING ALL PICTURES IN G', this.id, this.name ? `: ${this.name}` : '');

    const loadAllPicturesPromise = new Promise((r) => {
      const storePicturePromise = (i) => {
        if (this.config.debug) console.log('STORING PICTURE', i, 'IN G', this.name ? `: ${this.name}` : '');

        const promise = this.createPicture(i);
        this.promiseTo.finishLoading = promise;
        this.picturesPromises[i] = promise;
        promise
          .then(picture => fq.add(() => {
            this.pictures[i] = picture;

            const nextId = i === this.sources.length - 1
              ? 0
              : i + 1;

            if (nextId !== startFromId) {
              this.promiseTo.finishAnimating
                .then(() => fq.add(() => {
                  storePicturePromise(nextId);
                }));
            } else {
              if (this.config.debug) console.log(this.name, 'all pictures loaded');
              r();
            }
          }));
      };

      const l = this.sources.length;

      for (let i = 0; i < l; i += 1) {
        this.picturesPromises.push(new Promise(() => {}));
      }

      this.pictures = new Array(this.sources.length);
      storePicturePromise(startFromId);
    });

    return loadAllPicturesPromise;
  }

  assignScenariosFromSources() {
    if (this.config.debug) console.log('ASSIGNING SCENARIOS FOMR SOURCES IN G', this.id, this.name ? `: ${this.name}` : '', 'sources:', this.sources);

    const noScenario = []; // pictures with no dataset scenario

    this.sources.forEach((source, i) => {
      const datasetScenarioId = source.dataset && source.dataset.scenario;
      this.scenariosAssignments.push(datasetScenarioId != null ? [datasetScenarioId] : []);
      if (datasetScenarioId == null) noScenario.push(i);
    });

    const sL = this.config.scenarios.length;

    // get number of gallery loops that have to pass until a picture with no dataset id will have the same scenario as before
    this.minGalleryLoops = (leastCommonMultiple(noScenario.length, sL) / noScenario.length) || 1;

    let counter = 0;
    for (let i = 0; i < this.minGalleryLoops; i += 1) {
      for (let j = 0; j < noScenario.length; j += 1) {
        this.scenariosAssignments[noScenario[j]].push(counter);
        counter = incrementArrayIndex(counter, this.config.scenarios.length);
      }
    }
  }

  preloadPictureCss(picture, scenarioIds) {
    if (this.config.debug) console.log('PRELOADING CSS FOR PICTURE: ', picture.id, { ...picture }, 'WITH SCENARIO(S): ', scenarioIds, 'IN G', this.id, this.name ? `: ${this.name}` : '');

    const pictureCssPromises = [];

    scenarioIds.forEach((scenarioId) => {
      const scenario = this.config.scenarios[scenarioId];

      const allMorphsOfTheScenario = [...scenario.present, ...scenario.hide];

      allMorphsOfTheScenario.forEach((morph) => {
        const morphCssPromise = loadCss({
          morphName: morph.name,
          options: morph.options,
          config: morph.config,
          picture,
          gallery: this
        });

        pictureCssPromises.push(morphCssPromise);
      });
    });

    return Promise.all(pictureCssPromises);
  }

  preloadAllCss() {
    if (this.config.debug) console.log('PRELOADING ALL CSS IN G', this.id, this.name ? `: ${this.name}` : '');

    const promise = new Promise((r) => {
      this.promiseTo.loadAllPictures
        .then(() => fq.add(() => Promise.all(
          this.pictures.map((p, i) => (
            this.preloadPictureCss(p, this.scenariosAssignments[i])
          ))
        )))
        .then(() => fq.add(() => {
          if (this.config.debug) console.log('RESOLVING PRELOAD ALL CSS PROMISE IN G', this.id, this.name ? `: ${this.name}` : '');

          r();
        }));
    });

    return promise;
  }

  readInitialDimensions() {
    if (this.config.debug) console.log('readInitialDimensions IN G', this.id, this.name ? `: ${this.name}` : '');

    const {
      initialWidth,
      initialHeight,
    } = this.config;

    this.dimensions = (initialWidth && initialHeight)
      ? {
        height: initialHeight,
        width: initialWidth,
      }
      : this.element.getBoundingClientRect();
  }

  calculateScaledDimensions() {
    if (this.config.debug) console.log('CALCULATE DIMENTIONS IN G', this.id, this.name ? `: ${this.name}` : '');
    const { height, width } = this.dimensions;
    this.width = this.config.width / 100 * width;
    this.height = this.config.height / 100 * height;
    if (this.config.debug) console.log('WIDTH', this.width);
    if (this.config.debug) console.log('HEIGHT', this.height);
  }

  storeOriginalDimensions() {
    this.originalWidth = this.width;
    this.originalHeight = this.height;
  }

  detachSources() {
    this.sources.forEach((source) => {
      source.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0;';
    });
  }

  activateWindowResizeListeners() {
    window.addEventListener('resize', () => { this.onWindowChangeAction(); }, { passive: false });
    window.addEventListener('orientationchange', () => { this.onWindowChangeAction(); }, { passive: false });
  }

  deactivateWindowResizeListeners() {
    window.removeEventListener('resize', () => { this.onWindowChangeAction(); }, { passive: false });
    window.removeEventListener('orientationchange', () => { this.onWindowChangeAction(); }, { passive: false });
  }

  init() {
    if (this.initialized) return false;

    if (this.config.preloadAllCss) this.config.preloadAllPictures = true;

    const frame1 = () => {
      if (!this.element) {
        // if (this.config.debug) console.log('NO ELEMENT, I WILL USE SELECTOR, IN G', this);
        this.element = document.querySelector(`${this.config.selector}`);
      }
      if (!this.element) {
        if (this.config.debug) console.log('PROBLEMS WITH SELECTOR, IN G', this);
      }

      this.readInitialDimensions();
      this.hide(0);
    };

    const frame2 = () => {
      this.storeOriginalHtml();
      if (this.config.loadingMessage && !louvState.loadingMessage) {
        this.createLoadingMessage();
      }
    };

    const frame3 = () => {
      this.deactivate();
    };

    const frame4 = () => {
      this.calculateScaledDimensions();
      this.storeOriginalDimensions();
      this.storeSources();
      this.detachSources();
      this.assignScenariosFromSources();
      this.setGalleryId();
      this.setSourcesId();

      // modify DOM
      this.setGalleryDatasetId();
      if (this.config.loadingMessage) this.showLoadingMessage();
      this.activate();
    };

    const initReadyPromise = () => new Promise((r) => {
      this.promiseTo.loadAllPictures = this.storePicturesPromises();

      this.promiseTo.loadNecessaryPictures = this.config.preloadAllPictures
        ? this.promiseTo.loadAllPictures
        : this.picturesPromises[0];

      this.promiseTo.loadNecessaryPictures
        .then(() => (this.config.preloadAllCss
          ? this.preloadAllCss()
          : Promise.resolve()
        ))
        .then(() => fq.add(() => {
          this.setInitialState();

          if (this.config.loadingMessage) this.hideLoadingMessage();

          if (!this.config.passive) {
            if (this.sources.length > 1) this.loop();
            else this.presentPicture();
          }

          if (this.config.onWindowChange.recalculate) this.activateWindowResizeListeners();

          this.initialized = true;

          if (this.config.debug) console.log(`--> --> LOUV: ${this.id} IS READY`, this.name ? `: ${this.name}` : '', this);

          r();
        }));
    });

    const hasElement = fq.add(frame1);

    if (hasElement) {
      this.promiseTo.beReady = new Promise((r) => {
        hasElement
          .then(() => fq.add(frame2))
          .then(() => fq.add(frame3))
          .then(() => fq.add(frame4))
          .then(() => fq.add(initReadyPromise))
          .then(() => fq.add(() => { r(); }));
      });

      return this.promiseTo.beReady;
    }

    return false;
  }
}
