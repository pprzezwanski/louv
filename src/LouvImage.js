import deepExtend from 'deep-extend';

import fq from 'frame-q';
import LouvPicture from './LouvPicture';
import LouvMolecule from './LouvMolecule';

const absround = n => Math.sign(n) * Math.round(Math.abs(n));

class LouvImage extends LouvPicture {
  constructor(input) {
    super(input);
    this.type = 'image';
    this.maxWidth = input.options.maxWidth;
    this.maxHeight = input.options.maxHeight;
    this.config = deepExtend({
      moleculesAmount: 11,
      cropImage: false,
    }, input.options);
    this.molecules = [];
    this.moleculesAmount = {
      config: input.moleculesAmount,
      x: null,
      y: null
    };
    this.srcIsLoaded = false;
    this.instristicMoleculeSize = null;
    this.moleculeSize = null;
    this.isLandscape = null;
    this.srcset = [];
    this.src = null;
    this.center = { x: null, y: null };
    this.currentSource = null;
    this.rendered = false;
  }

  recalculate(hidden, initialClasses) {
    return new Promise((r) => {
      this.srcIsLoaded = false;
      const parent = this.element.parentNode;
      parent.insertBefore(this.source, this.source.nextSibling);
      parent.removeChild(this.element);
      const src = this.chooseSrc() || this.source.dataset.src;
      this.molecules = [];
      if (src !== this.currentSource) {
        this.source.removeAttribute('src');
        this.currentSource = src;
        this.waitForImageLoad(hidden, initialClasses)
          .then(() => fq.add(() => { r(); }));
        this.source.src = this.currentSource;
      } else {
        this.onSrcImgComplete(() => { r(); }, hidden, initialClasses);
      }
    });
  }

  calculateSmallerSide(greaterSide) {
    return Math.round(
      this.isLandscape
        ? greaterSide * this.aspectRatio
        : greaterSide / this.aspectRatio
    );
  }

  checkAspectRatio() {
    this.aspectRatio = this.source.naturalHeight / this.source.naturalWidth;
  }

  checkOrientation() {
    this.isLandscape = this.aspectRatio <= 1;
  }

  calculatePictureDimentions() {
    const greaterFrameSide = this.isLandscape ? this.maxWidth : this.maxHeight;
    const smallerFrameSide = this.isLandscape ? this.maxHeight : this.maxWidth;

    const calculatedSmallerSide = this.calculateSmallerSide(greaterFrameSide);

    if (this.config.cropImage) {
      return {
        greaterSide: greaterFrameSide,
        smallerSide: calculatedSmallerSide
      };
    }

    const ratio = smallerFrameSide / calculatedSmallerSide;

    const greaterSide = greaterFrameSide * (ratio < 1 ? ratio : 1);
    const smallerSide = this.calculateSmallerSide(greaterSide);

    return { greaterSide, smallerSide };
  }

  atomize() {
    const atomsPromises = [];

    this.checkAspectRatio();
    this.checkOrientation();

    const { greaterSide, smallerSide } = this.calculatePictureDimentions();

    this.moleculeSize = Math.ceil(greaterSide / this.config.moleculesAmount);

    if (this.isLandscape) {
      this.moleculesAmount.x = this.config.moleculesAmount;
      this.moleculesAmount.y = this.config.cropImage
        ? Math.floor(smallerSide / this.moleculeSize)
        : Math.ceil(smallerSide / this.moleculeSize);
    } else {
      this.moleculesAmount.y = this.config.moleculesAmount;
      this.moleculesAmount.x = this.config.cropImage
        ? Math.floor(smallerSide / this.moleculeSize)
        : Math.ceil(smallerSide / this.moleculeSize);
    }

    const instristicGreaterSide = Math.max(this.source.naturalWidth, this.source.naturalHeight);
    this.instristicMoleculeSize = Math.round(this.moleculeSize / greaterSide * instristicGreaterSide);

    this.center.x = this.moleculesAmount.x / 2 - 0.5;
    this.center.y = this.moleculesAmount.y / 2 - 0.5;

    for (let y = 0; y < this.moleculesAmount.y; y += 1) {
      for (let x = 0; x < this.moleculesAmount.x; x += 1) {
        const promise = fq.add(() => {
          // create molecule with canvas element inside
          const molecule = new LouvMolecule({
            picture: this,
            id: x + y * this.moleculesAmount.x,
            x,
            y,
          });

          const ctx = molecule.atom.getContext('2d');
          molecule.atom.setAttribute('width', this.moleculeSize);
          molecule.atom.setAttribute('height', this.moleculeSize);

          molecule.data.fromCenter = {
            x: absround(x - this.center.x),
            y: absround(y - this.center.y)
          };

          molecule.data.previousFromCenter = { x: molecule.id, y: molecule.id };

          if (molecule.data.fromCenter.x !== 0) {
            molecule.data.previousFromCenter.x = molecule.data.fromCenter.x > 0
              ? molecule.id - 1
              : molecule.id + 1;
          }

          if (molecule.data.fromCenter.y !== 0) {
            molecule.data.previousFromCenter.y = molecule.data.fromCenter.y > 0
              ? molecule.id - this.moleculesAmount.x
              : molecule.id + this.moleculesAmount.x;
          }

          ctx.drawImage(
            this.source,
            this.instristicMoleculeSize * x, // sx,
            this.instristicMoleculeSize * y, // sy
            this.instristicMoleculeSize, // sWidth,
            this.instristicMoleculeSize, // sHeight,
            0, // dx,
            0, // dy
            this.moleculeSize, // dWidth,
            this.moleculeSize // dHeight,
          );

          this.molecules.push(molecule.data);
          this.appendMolecule(molecule.element);
        });

        atomsPromises.push(promise);
      }
    }
    if (this.config.cropImage) {
      this.height = this.moleculeSize * this.moleculesAmount.y;
      this.width = this.moleculeSize * this.moleculesAmount.x;
    } else {
      this.height = this.isLandscape ? smallerSide : greaterSide;
      this.width = this.isLandscape ? greaterSide : smallerSide;
    }

    return Promise.all(atomsPromises);
  }

  calculateMissingTotals() {
    this.total.lines = this.moleculesAmount.y;
  }

  setSrcset() {
    const datasetSrcset = this.source.dataset.srcset;
    if (!datasetSrcset) return;
    const srcset = datasetSrcset.replace(/,/g, '').split(' ');
    const l = srcset.length;
    for (let i = 0; i < l - 1; i += 2) {
      this.srcset.push({
        img: srcset[i],
        width: srcset[i + 1].slice(0, -1)
      });
    }
  }

  chooseSrc() {
    if (this.srcset.length === 0) return false;
    const l = this.srcset.length;

    for (let i = l - 1; i >= 0; i -= 1) {
      if (this.maxWidth > this.srcset[i].width) return this.srcset[i].img;
    }

    return this.srcset[0].img;
  }

  onSrcImgComplete(callback, hidden, initialClasses) {
    fq.add(() => {
      if (this.gallery.config.debug) console.log('onSrcImgComplete for G', this.gallery.id, 'for picture', this.id);
      if (this.srcIsLoaded) return;
      this.srcIsLoaded = true;

      if (!this.maxHeight) this.maxHeight = this.source.naturalHeight;
      if (!this.maxWidth) this.maxWidth = this.source.naturalWidth;

      // create picture built from molecules
      this.coreInit(hidden, initialClasses)
        .then(() => fq.add(() => {
          this.calculateMissingTotals();
          if (callback) callback();
        }));
    });
  }

  waitForImageLoad(hidden, initialClasses) {
    const promise = new Promise((r) => {
      const onLoadFn = () => {
        this.onSrcImgComplete(
          () => {
            this.source.removeEventListener('load', onLoadFn);
            r();
          },
          hidden,
          initialClasses
        );
      };

      setTimeout(() => {
        this.source.addEventListener('load', onLoadFn);
      }, 0);
    });

    return promise;
  }

  load() {
    return new Promise((r) => {
      // when source image will load
      this.waitForImageLoad()
        .then(() => fq.add(() => {
          if (this.gallery.config.debug) console.log('src has been loaded for picture', { ...this });
          r();
        }));

      // also if source image has attribute src and is already completed
      if (
        this.source.getAttribute('src') !== ''
        && this.source.complete
      ) {
        if (this.gallery.config.debug) console.log('src was already completed for picture', { ...this });
        this.onSrcImgComplete(r);
      }

      // destructure dataset from source image
      const { dataset } = this.source;
      if (!dataset.srcset && !dataset.src) {
        throw new Error('no data-src, data-srcset and src attribute is empty');
      }

      // if there is data-srcset we store it in this.srcset
      if (dataset.srcset) this.setSrcset();

      fq.add(() => {
        // finally we choose the right source for screen width
        // of if no srcset is empty we take data-src
        this.currentSource = this.chooseSrc() || this.source.dataset.src;
        this.source.src = this.currentSource;

        // we need this if the image is already loaded in other place of the website, because load event will not fire;
        if (this.source.complete) {
          if (this.gallery.config.debug) console.log('src was already loaded in other place of website for picture', { ...this });
          this.onSrcImgComplete(r);
        }
      });
    });
  }

  // to do alternative version of load()
  // load() {
  //     return new Promise((r) => {
  //         // // when source image will load
  //         // this.waitForImageLoad().then(() => {
  //         //     if (this.gallery.config.debug) console.log('src has been loaded for picture', { ...this });
  //         //     r();
  //         // });

  //         if (
  //             // if source image has attribute src and is already completed
  //             this.source.getAttribute('src') !== ''
  //             && this.source.complete
  //         ) {
  //             if (this.gallery.config.debug) console.log('src was already completed for picture', { ...this });
  //             this.onSrcImgComplete(r);
  //         } else {
  //             // when source image will load
  //             this.waitForImageLoad().then(() => {
  //                 if (this.gallery.config.debug) console.log('src has been loaded for picture', { ...this });
  //                 r();
  //             });
  //         }

  //         // destructure dataset from source image
  //         const { dataset } = this.source;

  //         if (!dataset.srcset && !dataset.src) {
  //             throw new Error('no data-src, data-srcset and src attribute is empty');
  //         }

  //         // if there is data-srcset we store it in this.srcset
  //         if (dataset.srcset) this.setSrcset();

  //         // finally we choose the right source for screen width and if srcset is empty we take data-src
  //         this.currentSource = this.chooseSrc() || this.source.dataset.src;

  //         fq.add(() => {
  //             this.source.src = this.currentSource;

  //             // we need this if the image is already loaded in other place of the website, because load event will not fire;
  //             if (this.source.complete) {
  //                 if (this.gallery.config.debug) console.log('src was already loaded in other place of website for picture', { ...this });
  //                 this.onSrcImgComplete(r);
  //             }
  //         });
  //     });
  // }
}

export default LouvImage;
