import LouvImage from './LouvImage';
import LouvText from './LouvText';
import LouvElement from './LouvElement';
import phantomGallery from './phantomGallery';

let counter = 0;

/**
 * @function
 * a facade that creates a LouvPicture object
 * using different classes depending on 'type'
 * @param {object} config must supply at least
 * source and optionally: id, gallery, type and options 
 * @returns {object} html element sliced to molecules
 */
export default ({
  type,
  source,
  id = counter,
  gallery = phantomGallery,
  options = {},
}) => {
  if (
    !source
    || !(
      source instanceof Element || source instanceof HTMLDocument
    )
  ) {
    throw new Error(`pictureFactory has to have specified source in its config object and there was not such in gallery ${gallery.name || gallery.id} in picture ${id} where source is ${{ ...source }}`);
  }

  if (
    (type !== 'image' && source.nodeName === 'IMG')
    || (type === 'image' && source.nodeName !== 'IMG')
  ) throw new Error(`type and source do not match in pictureFactory: type is ${text} and source is ${source.nodeName}  `);

  if (id === counter) counter += 1;

  const config = {
    source,
    id,
    gallery,
    options
  };
  
  switch (type) {
  case 'text':
    return new LouvText(config);
  case 'element':
    return new LouvElement(config);
  default:
    return new LouvImage(config);
  }
}
