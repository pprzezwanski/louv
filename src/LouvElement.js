import deepExtend from 'deep-extend';
import LouvPicture from './LouvPicture';
import LouvMolecule from './LouvMolecule';
import fq from 'frame-q';

class LouvElement extends LouvPicture {
  constructor(input) {
    super(input);
    this.type = 'element';
    this.sourceHTML = null;
    this.config = deepExtend({
      dontAtomize: true,
    }, input.options);
  }

  calculateSourceRect() {
    this.sourceRect = this.source.getBoundingClientRect();
  }

  atomize() {
    // return new Promise(r => fq.add(() => {
    if (this.config.dontAtomize) {
      const molecule = new LouvMolecule({
        picture: this,
        id: 0,
        x: 0,
        y: 0,
        source: this.element,
      });

      molecule.fromCenter = { x: 0, y: 0 };

      molecule.previousFromCenter = { x: 0, y: 0 };

      molecule.totalIn = { x: 1, y: 1 };

      this.molecules.push(molecule.data);
      this.element.innerHTML = '';
      this.element.style.padding = '0';
      this.appendMolecule(molecule.element);
      this.total.lines = 1;
    } else {
      this.children = Array.from(this.element.children);

      this.children.forEach((child, i) => {
        const molecule = new LouvMolecule({
          picture: this,
          id: i,
          x: 0,
          y: 0,
          source: child,
        });

        molecule.fromCenter = { x: 0, y: 0 };

        molecule.previousFromCenter = { x: 0, y: 0 };

        molecule.totalIn = { x: 1, y: 1 };

        molecule.lineHeight = { x: 0, y: 0 };

        this.molecules.push(molecule.data);
        this.appendMolecule(molecule.element);
        this.element.removeChild(child);
      });
    }

    this.height = this.source.height;
    this.width = this.source.width;

    return Promise.resolve();
  }

  load() {
    return new Promise((r) => {
      if (!this.source) return;
      fq.add(() => this.calculateSourceRect())
        .then(() => fq.add(() => this.coreInit()))
        .then(() => r());
    });
  }
}

export default LouvElement;
