export default (picture, target, property) => {
  // if config is not set all morph classes will be removed
  if (!target || !property) {
    const removedMorphs = [];
    const morphTargets = Object.keys(picture.currentMorphs);
    morphTargets.forEach((morphTarget) => {
      const morphProperties = Object.keys(picture.currentMorphs[morphTarget]);
      morphProperties.forEach((morphProperty) => {
        const classNames = picture.currentMorphs[morphTarget][morphProperty];
        classNames.forEach((className, i, arr) => {
          picture.element.classList.remove(className);
          removedMorphs.push(className);
        });
        picture.currentMorphs[morphTarget][morphProperty] = [];
      });
    });
    return removedMorphs;
  }

  if (picture.currentMorphs[target] && picture.currentMorphs[target][property]) {
    const removedMorphs = picture.currentMorphs[target][property];
    picture.currentMorphs[target][property].forEach((m, i, arr) => {
      // console.log('REMOVING MORPH:', m, 'because property is:', property, 'and target is:', target);
      picture.element.classList.remove(m);
    });
    picture.currentMorphs[target][property] = [];
    return removedMorphs;
  }

  return null;
};
