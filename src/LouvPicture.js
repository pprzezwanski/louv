import fq from 'frame-q';

class LouvPicture {
  constructor(input) {
    this.id = input.id;
    this.gallery = input.gallery;
    this.source = input.source;
    this.parent = this.source.parentNode;
    this.type = input.type;
    this.element = null;
    this.scenarioId = null;
    this.molecules = [];
    this.currentMorphs = {};
    this.total = {
      lines: 0,
      molecules: 0
    };
    this.initialized = false;
    this.deactivated = false;
  }

  show() {
    if (this.gallery.config.debug) console.log('showing picture', this.id, 'in G', this.gallery.id);
    this.element.classList.remove('is-hidden');
    return this;
  }

  hide() {
    this.element.classList.add('is-hidden');
    return this;
  }

  activate() {
    this.element.classList.remove('is-inactive');
    this.deactivated = false;
    return this;
  }

  deactivate() {
    this.element.classList.add('is-inactive');
    this.deactivated = true;
    return this;
  }

  createPicture(initialClasses) {
    switch (this.type) {
    case 'image':
      this.element = document.createElement('div');
      break;
    case 'text':
      this.element = this.source.cloneNode(false);
      break;
    default:
      this.element = this.source.cloneNode(true);
    }

    this.element.removeAttribute('style');
    this.element.className += `
      louv__picture${initialClasses ? ` ${initialClasses}` : ''}
    `;

    this.element.setAttribute('data-louv-picture', this.id);

    return this;
  }

  appendPicture() {
    if (!this.source.parentNode) console.log('error in LouvPicture.js appendPicture: no parentNode for', this.source, `picture ${this.id} in gallery ${this.gallery.id}`, { ...this });

    this.source.parentNode.insertBefore(this.element, this.source.nextSibling);

    return this;
  }

  removeSource() {
    // remove source image after creating its picture
    this.source.parentNode.removeChild(this.source);

    return this;
  }

  appendMolecule(molecule) {
    this.element.appendChild(molecule);
  }

  setScenarioId() {
    // store scenarioId from src dataset before removing the source
    this.scenarioId = this.source.dataset && this.source.dataset.scenario;

    return this;
  }

  atomize() {
    this.height = this.source.height;
    this.width = this.source.width;

    return this;
  }

  setPictureInlineDimensions() {
    this.element.style.height = `${this.height}px`;
    this.element.style.width = `${this.width}px`;
    
    return this;
  }

  coreInit(hidden = true, initialClasses) {
    return new Promise((r) => {
      fq.add(() => this.createPicture(initialClasses).atomize())
        .then(() => fq.add(() => {
          if (hidden) this.hide().deactivate();
        }))
        .then(() => fq.add(() => {
          this
            .setPictureInlineDimensions()
            .setScenarioId()
            .appendPicture()
            .removeSource();

          this.initialized = true;
          r();
        }));
    });
  }
}

export default LouvPicture;
