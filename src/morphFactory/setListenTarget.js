export default ({
  target,
  listenToMolecule,
  picture,
  gallery
}) => {
  let listenTarget;

  switch (target) {
  case 'gallery':
    listenTarget = gallery.element;
    break;
  case 'picture':
    listenTarget = picture.element;
    break;
  default:
    listenTarget = listenToMolecule === 'last'
      ? picture.molecules[picture.molecules.length - 1].element
      : picture.molecules[0].element;
  }

  return listenTarget;
};
