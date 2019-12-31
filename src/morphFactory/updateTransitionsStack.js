export default ({
  gallery,
  config: { duration, timingFunction: timing },
  options: { property },
  target
}) => {
  if (!gallery.state.transitions[target]) console.log(target, gallery.state.transitions[target], { ...gallery });

  const index = gallery.state.transitions[target].findIndex(t => t.property === property);

  const newTransition = { property, duration, timing };
  
  if (index !== -1) gallery.state.transitions[target].splice(index, 1, newTransition);
  else gallery.state.transitions[target].push(newTransition);
};
