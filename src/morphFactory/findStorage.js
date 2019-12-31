import louvState from '../louvState';

export default (scope, picture, louv) => {
  const scopeObject = louvState.usedMorphsConfigs[`${scope}Scope`];
  if (scope !== 'global') {
    // if scope is 'gallery' property name will be i.e 'g-0'
    // if scope is 'picture' property name will be i.e 'g-0-p-0'
    const storageName = `g-${louv.id}${scope === 'picture' && `-p-${picture.id}`}`;
    if (!scopeObject[storageName]) scopeObject[storageName] = {};
    return scopeObject[storageName];
  }
  return scopeObject;
};
