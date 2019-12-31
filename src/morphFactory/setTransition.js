import appendStyle from './appendStyle';

export default (gallery, target) => {
  // redefine molecules transition
  const transitionTargetText = target !== 'gallery' ? `${target}-` : '';
  const transitionName = `g-${gallery.id}_${transitionTargetText}transition`;
  // const transitionStyleTag = document.getElementById(`gallery-${gallery.id}-${target}-transition`);
  const transitionStyleTag = document.getElementById(transitionName);
  if (transitionStyleTag) transitionStyleTag.parentNode.removeChild(transitionStyleTag);

  // first transition is by default 'transform'
  // TODO: not shure about that now
  const firstTransition = gallery.state.transitions[target][0];

  // combine transitions for all properties in one string
  // transform-origin has to be set if transform is also transitioned and the script make transform first transition in the group by default
  const transitionCss = gallery.state.transitions[target].reduce((a, transition, i, transitions) => `
    ${a} ${transition.property} ${(transition.duration) / 1000}s ${transition.timing}${i < transitions.length - 1 ? ',' : ''}
  `, '');
  // const transitionCss = gallery.state.transitions[target].reduce((a, transition, i, transitions) => `
  //   ${a} ${transition.property} ${(transition.duration) / 1000}s ${transition.timing}${i < transitions.length - 1 ? ',' : ''}
  // `, `transform-origin ${firstTransition.duration / 1000}s ${firstTransition.timing},`);

  // append new style tag with transition css text
  appendStyle(`
      [data-louv-gallery-id="${gallery.id}"] .louv__${target} {
          transition: ${transitionCss}, transform-origin ${firstTransition.duration / 1000}s ${firstTransition.timing};
      }
  `, transitionName);
};
