

class LouvMolecule {
  constructor(input) {
    this.source = input.source;
    this.picture = input.picture;
    this.id = input.id;
    this.x = input.x;
    this.y = input.y;
    this.height = input.height;
    this.width = input.width;
    this.lineHeight = input.lineHeight;
    this.hasMargin = !!input.margin;
    this.margin = input.margin || {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0
    };
    this.hasMargins = input.hasMargins || true;
    this.callback = input.callback || (() => {});
    this.extraCallback = input.extraCallback || (() => {});
    this.emptySpace = input.picture.emptySpace || { height: 0, width: 0 };
    this.element = null;
    this.rect = null;
    this.style = null;
    this.data = {};
    this.passive = false;
    this.size = null;

    if (!this.passive) this.init();
  }

  getSourceRect() {
    if (this.picture.type !== 'image') {
      this.rect = this.source.getBoundingClientRect();
    }
  }

  getComputedStyle() {
    this.style = window.getComputedStyle(this.source);
  }

  getNecessaryDimentions() {
    if (this.picture.type !== 'image') {
      this.getSourceRect();

      if (this.hasMargins) {
        this.getComputedStyle();

        this.margin = {
          top: parseFloat(this.style.marginTop),
          right: parseFloat(this.style.marginRight),
          bottom: parseFloat(this.style.marginBottom),
          left: parseFloat(this.style.marginLeft)
        };
      }

      if (this.picture.type === 'text' && !this.lineHeight) {
        if (!this.style) this.getComputedStyle();
        this.lineHeight = parseFloat(this.style.lineHeight);
      }
    }
  }

  createMolecule() {
    this.element = document.createElement('div');
    this.element.classList.add('louv__molecule');
  }

  createAtom() {
    this.atom = this.picture.type === 'image'
      ? document.createElement('canvas')
      : this.source.cloneNode(true); // clone with child node (text node)

    this.atom.classList.add('louv__atom');
  }

  appendAtomToMolecule() {
    this.element.appendChild(this.atom);
  }

  calculatePositionTop() {
    return this.picture.type === 'image'
      ? Math.round(this.picture.moleculeSize * this.y)
      : this.rect.top - this.picture.sourceRect.top - this.margin.top;
  }

  calculatePositionLeft() {
    return this.picture.type === 'image'
      ? Math.round(this.picture.moleculeSize * this.x)
      : this.rect.left - this.picture.sourceRect.left - this.margin.left;
  }

  calculateSize() {
    return this.picture.type === 'image'
      ? {
        x: this.picture.moleculeSize,
        y: this.picture.moleculeSize
      } : {
        x: this.rect.width + this.margin.left + this.margin.right,
        y: (this.lineHeight || this.rect.height) + this.margin.top + this.margin.bottom
      };
  }

  calculateInLine() {
    return this.picture.type === 'image'
      ? {
        x: this.picture.moleculesAmount.x,
        y: this.picture.moleculesAmount.y
      } : null;
  }

  setData() {
    this.data = {
      element: this.element,
      id: this.id,
      position: {
        top: this.calculatePositionTop(),
        left: this.calculatePositionLeft(),
      },
      fromCorner: {
        x: this.x,
        y: this.y
      },
      fromCenter: { x: null, y: null },
      previousFromCenter: { x: null, y: null },
      totalIn: this.calculateInLine(),
      size: this.calculateSize(),
    };
  }

  setAttributes() {
    this.element.id = `louv_g-${this.picture.gallery.id}_p${this.picture.id}_m${this.id}`;
    this.element.style.top = `${this.data.position.top}px`;
    this.element.style.left = `${this.data.position.left}px`;
    this.element.style.width = `${this.data.size.x}px`;
    this.element.style.height = `${this.data.size.y}px`;
  }

  setImageTypeDataset() {
    this.element.dataset.louvPictureSide = this.data.fromCenter.x > 0 ? 'right' : 'left';
  }

  init() {
    this.createMolecule();
    this.createAtom();
    this.appendAtomToMolecule();
    this.getNecessaryDimentions();
    this.setData();
    this.setAttributes();
    if (this.extraCallback) this.extraCallback(this);
    if (this.callback) this.callback(this);
    return this;
  }
}

export default LouvMolecule;
