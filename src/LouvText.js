import deepExtend from 'deep-extend';
import LouvPicture from './LouvPicture';
import LouvMolecule from './LouvMolecule';
import fq from 'frame-q';

/**
 * Splits html element with text into spans with words (optionaly wrapped with lines) and optionally spans with letters. It has recalculate method that can be invoked after window change. For full responsiveness call it with louvGallery (default import from louv)
 * @param {html element} source - the block which text will be split into single-line div elements
 * @param {object} options - object with options
 * @param {string} options.targetSelector - main html element which ttext will be split
 * @param {boolean} options.splitChars - if true the text will be split into spans with chars (if false text will be splitted to words)
 */

class LouvText extends LouvPicture {
  constructor(input) {
    super(input);
    this.type = 'text';
    this.config = deepExtend({
      targetSelector: '[data-louv-text]',
      moleculesMargin: null, // { top: 0, right: 0, bottom: 0, left: 0 },
      // TODO: split lines / split words
      // splitLines: true,
      // splitWords: false,
      splitChars: true,
      makeLineElements: false,
      moleculeCssDisplayNotInline: false,
    }, input.options);
    this.sourceHTML = null;
    this.sourceSplitHTML = null;
    this.sourceWords = [];
    this.elements = { chars: [], words: [], lines: [] };
    this.emptySpace = { width: null, height: null };
    this.clonedElement = null;
    this.sourceRect = null;
    this.heightAfter = null;
    this.splittedHtml = null;
    this.windowJustChanged = false;
    this.atomize = this.atomize.bind(this);
  }

  static applyDisplayStyleToChildren(htmlEl, styleValue) {
    Array.from(htmlEl.children).forEach((node) => {
      node.style.display = styleValue; // eslint-disable-line
    });
  }

  createWordsArray() {
    const wordsArray = this.sourceHTML
      .toString()
      .replace(/&nbsp;/g, ' ')
      .replace(/( )\1{2,}/g, '')
      .replace(/↵/g, '')
      .replace(/\n/g, '')
      .replace(/ *<br> */g, ' <br> ')
      .replace(/(<span[^>]*>) */g, x => x.replace(/([:,;]) +/g, '$1'))
      .replace(/<span +/g, '<span')
      .replace(/  +/g, ' ')
      .replace(/ $/g, '')
      .replace(/-/g, !this.config.splitChars ? '&#x2011;' : '-')
      .replace(/<a.*>(.*)<\/a>/g, ' $1 ') // this kills all links (temporary solution)
      .split(' ')
      .map(p => p.replace(/nstyle=/g, 'n style='));

    this.sourceWords = wordsArray;
  }

  prepareSplittedHtml() {
    this.total.chars = 0;

    const breaklineIndexes = [];

    const splittedHtml = this.sourceWords
      .reduce((a, c, i, arr) => {
        const isBreaklineWord = c.match(/<br.*>/g);

        if (isBreaklineWord) breaklineIndexes.push(i);

        const targetIndex = i - breaklineIndexes.length;

        return `${a}${isBreaklineWord
          ? '<br>'
          : `<span data-word="${targetIndex}">${
            !this.config.splitChars
              ? `${c} </span>`
              : `${this.splitWordToCharsHtml(`${c} `, targetIndex, i === arr.length - 1)}</span>`
          }`
        }`;
      }, '');

    this.splittedHtml = splittedHtml;
  }

  splitWordToCharsHtml(word, wordId) {
    const chars = Array.from(word);
    let charsHtml = '';
    chars.forEach((char, index) => {
      charsHtml += `<span
        data-word-id="${wordId}" 
        data-word-char="${index}"
        data-char="${this.total.chars}"
      >${char}</span>`;
      
      this.total.chars += 1;
    });

    return charsHtml;
  }

  static getWindowWidth() {
    return (
      window.innerWidth
        || document.documentElement.clientWidth
        || document.body.clientWidth
        || 0
    );
  }

  measureEmptySpaceFactor() {
    const emptySpace = this.elements.chars[this.elements.chars.length - 1];
    const emptySpaceRect = emptySpace.getBoundingClientRect();
    const emptySpaceStyle = emptySpace.currentStyle || window.getComputedStyle(emptySpace);
    const verticalMargin = parseFloat(emptySpaceStyle.marginTop) + parseFloat(emptySpaceStyle.marginBottom);
    const horizontalMargin = parseFloat(emptySpaceStyle.marginLeft) + parseFloat(emptySpaceStyle.marginRight);

    return {
      width: emptySpaceRect.width + horizontalMargin,
      height: emptySpaceRect.height + verticalMargin
    };
  }

  appendMolecule(molecule) {
    if (!this.config.makeLineElements) {
      this.element.appendChild(molecule);
    } else {
      this.elements.lines[this.elements.lines.length - 1]
        .appendChild(molecule);
    }
  }

  createMolecule(source, counters, callback) {
    const molecule = new LouvMolecule({
      source,
      picture: this,
      id: counters.molecule,
      x: parseInt(counters.line.molecule, 10),
      y: counters.line.id,
      margin: this.config.moleculesMargin,
    });

    if (callback) callback(molecule);

    molecule.data.line = { x: null, y: counters.line.id };
    molecule.element.setAttribute('data-line-id', counters.line.id);
    molecule.element.setAttribute('data-line-word', counters.line.word);
    counters.line.molecule += 1;
    counters.molecule += 1;

    return molecule;
  }

  atomize() {
    const counters = {
      molecule: 0,
      line: {
        id: 0,
        word: 0,
        molecule: 0
      },
    };

    const atomsPromises = [];

    let newLine = true;
    let lastWordInLine = false;
    let newLineElement;

    this.total.height = 0;
    this.total.width = 0;

    this.emptySpace = this.config.splitChars
      ? this.measureEmptySpaceFactor()
      : { height: 0, width: 0 };

    return new Promise((r) => {
      this.elements.words.forEach((word, i/* , words */) => {
        const promise = fq.add(() => {
          const wordRect = word.getBoundingClientRect();

          const nextWordRect = i !== this.elements.words.length - 1
            ? this.elements.words[i + 1].getBoundingClientRect()
            : null;

          if (newLine) {
            if (/* this.config.splitLines ||  */this.config.makeLineElements) {
              newLineElement = document.createElement('div');
              newLineElement.classList.add(`line-${counters.line.id}`);
              newLineElement.classList.add('louv__text-line');
              this.elements.lines.push(newLineElement);
            }
            counters.line.molecule = 0;
            counters.line.word = 0;
            lastWordInLine = false;
            newLine = false;
          }

          if (
            // if it is last word check if it exceeds total width
            i === this.elements.words.length - 1
            // if it is not last word check if next word is in new line
            || (
              i !== this.elements.words.length - 1
                && (
                  wordRect.left >= nextWordRect.left
                  || wordRect.top < nextWordRect.top
                )
            )
          ) { lastWordInLine = true; }

          // produce molecules and append them to this.element
          if (this.config.splitChars) {
            this.elements.chars
              .filter(c => parseInt(c.dataset.wordId, 10) === i)
              .forEach((char, index, chars) => {
                const lastCharInWord = index === chars.length - 1;

                if (
                  lastCharInWord
                  && (
                    lastWordInLine
                    || wordRect.right > this.total.width
                  )
                ) return;

                const molecule = this.createMolecule(char, counters, (m) => {
                  if (lastCharInWord) m.atom.classList.add('louv-text-empty-space');

                  m.atom.setAttribute('data-line-char', counters.line.molecule);
                });

                this.molecules.push(molecule.data);
                this.appendMolecule(molecule.element);
              });
          } else {
            const molecule = this.createMolecule(word, counters);

            this.molecules.push(molecule.data);
            this.appendMolecule(molecule.element);
          }

          // when we have whole line we will update some molecules data related to lines
          if (lastWordInLine) {
            const lineCenter = counters.line.molecule / 2 - 0.5;
            const lineMolecules = this.molecules
              .filter(m => m.fromCorner.y === counters.line.id);
            let linePixelWidth = 0;
            let linePixelHeight = 0;

            lineMolecules.forEach((m) => {
              // how much molecules are in this line
              m.totalIn = { x: counters.line.molecule, y: null };

              // from center is tricky for even m.inline
              const diff = m.fromCorner.x - lineCenter;
              const fromCenterX = diff > 0 ? Math.round(diff) : Math.floor(diff);
              m.fromCenter = { x: fromCenterX, y: null };
              if (m.fromCenter.x === 0) {
                m.previousFromCenter = {
                  x: m.id,
                  y: null
                };
              } else {
                m.previousFromCenter = {
                  x: m.fromCenter.x > 0 ? m.id - 1 : m.id + 1,
                  y: null
                };
              }
              linePixelWidth += m.size.x;
              linePixelHeight = Math.max(linePixelHeight, m.size.y);
            });

            if (this.config.makeLineElements) {
              this.element.appendChild(newLineElement);
            }

            // update picture width
            this.total.width = Math.max(this.total.width, linePixelWidth);

            counters.line.id += 1;

            // information for next iteration to create new line element for the next line
            newLine = true;
          }

          counters.line.word += 1;
        });

        atomsPromises.push(promise);
      });

      Promise.all(atomsPromises)
        .then(() => fq.add(() => {
          this.total.lines = counters.line.id/*  - 1 */;

          for (let i = 0; i < this.total.lines; i += 1) {
            const centerY = Math.floor(this.total.lines / 2);

            this.molecules
              .filter(m => m.fromCorner.y === i)
              .forEach((m) => {
                m.totalIn.y = this.total.lines;
                m.fromCenter.y = m.fromCorner.y - centerY;
                m.previousFromCenter.y = m.fromCenter.y > 0
                  ? m.id - m.totalIn.x
                  : m.id + m.totalIn.x;
              });
          }

          const lastMolecule = this.molecules[this.molecules.length - 1];
          this.height = lastMolecule.position.top + lastMolecule.size.y;

          this.width = this.config.moleculeCssDisplayNotInline
            ? this.total.width
            : this.sourceRect.width;

          r();
        }));
    });
  }

  storeWordsAndCharsElements() {
    this.elements.words = Array.from(this.source.querySelectorAll('[data-word]'));
    if (this.config.splitChars) {
      this.elements.chars = Array.from(this.source.querySelectorAll('[data-char]'));
    }
  }

  calculateMissingTotals() {
    this.total.words = this.elements.words.length;
  }

  recalculate(hidden, initialClasses) {
    return new Promise((r) => {
      const parent = this.element.parentNode;
      parent.insertBefore(this.source, this.source.nextSibling);
      parent.removeChild(this.element);
      if (this.deactivated) this.activate();

      fq.add(() => {
        this.calculateSourceRect();
      })
        .then(() => fq.add(() => {
          this.storeWordsAndCharsElements();
          this.molecules = [];
          return this.coreInit(hidden, initialClasses);
        }))
        .then(() => r());
    });
  }

  splitSource() {
    this.source.innerHTML = '';
    this.source.insertAdjacentHTML('beforeend', this.splittedHtml);
  }

  calculateSourceRect() {
    this.sourceRect = this.source.getBoundingClientRect();
  }

  load() {
    return new Promise((r) => {
      if (!this.source) return;

      const frame1 = () => {
        this.sourceHTML = this.source.innerHTML;
        this.createWordsArray();
        this.prepareSplittedHtml();
        this.splitSource();
        this.sourceSplitHTML = this.source.innerHTML;
        this.storeWordsAndCharsElements();
        this.calculateMissingTotals();
        this.calculateSourceRect();
      };

      const frame2 = () => this.coreInit();

      fq.add(frame1)
        .then(() => fq.add(frame2))
        .then(() => r());
    });
  }
}

export default LouvText;
