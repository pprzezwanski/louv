import deepEqual from 'fast-deep-equal';
import findStorage from './findStorage';

export default ({
  morphName, options, config, picture, gallery
}) => {
  const configsStorage = findStorage(options.scope, picture, gallery);
  if (!configsStorage[morphName]) configsStorage[morphName] = [];

  const indexOfTheSameConfig = configsStorage[morphName]
    .findIndex(c => deepEqual(c, config));

  const newConfigDetected = indexOfTheSameConfig === -1;

  const morphId = newConfigDetected
    ? configsStorage[morphName].push(config) - 1
    : indexOfTheSameConfig;

  const morphClassName = `louv-morph_g-${gallery.id}_p${picture.id}_${morphName}-${morphId}`;

  return { morphClassName, newConfigDetected };
};
