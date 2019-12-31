import iteratedCssFactory from './iteratedCssFactory';

export default (input) => {
  const {
    morphClassName,
    newConfigDetected,
    options,
    config,
    picture,
    gallery
  } = input;

  const target = options.target || config.target;

  const { propertyValue } = options;

  if (gallery.config.debug) {
    if (newConfigDetected) console.log('--- loading css for morph:', morphClassName);
    else console.log('--- css for morph:', morphClassName, 'already exists');
  }

  let cssText = '';

  const propertyValueResult = propertyValue && propertyValue({
    picture, gallery, morphClassName, config
  });

  if (
    newConfigDetected
    && (
      (propertyValueResult && typeof propertyValueResult === 'function')
      || config.isOneByOne
    )
  ) {
    // if there was onebyone we will not call callback but add transition modifications
    const iterable = typeof propertyValueResult === 'function' ? propertyValueResult : null;

    const iteratedCssFn = iteratedCssFactory(input, morphClassName);

    const iterator = (iteratedFn) => {
      if (options.customIteration) {
        options.customIteration((i) => {
          const molecule = picture.molecules[i];
          cssText += iteratedCssFn(i, molecule, iteratedFn);
        }, picture);
      } else {
        // we use for loop instead of forEach for better performance
        const l = picture.molecules.length;
        for (let i = 0; i < l; i += 1) {
          const molecule = picture.molecules[i];
          cssText += iteratedCssFn(i, molecule, iteratedFn);
        }
      }
    };

    iterator(iterable);
  }

  const stringResult = propertyValueResult && typeof propertyValueResult === 'string';

  if (
    newConfigDetected
        && (
          stringResult
            || options.additionalCss
        )
  ) {
    const innerSelectorText = (target === 'molecule' || target === 'atom')
      ? ` .louv__${target}`
      : '';

    const mainPropertyCss = stringResult ? propertyValueResult : '';

    const additionalCss = options.additionalCss
      ? options.additionalCss({
        picture, gallery, morphClassName, config
      })
      : '';

    if (mainPropertyCss || additionalCss) {
      const fragment = `.${morphClassName}${innerSelectorText} {
                ${options.property}: ${mainPropertyCss};
                ${additionalCss}
            }`;

      cssText += fragment;
    }
  }

  return cssText;
};
