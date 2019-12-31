export default (data, morphClassName) => (i, m, callback) => {
  const {
    options, config, picture, gallery
  } = data;

  let idMatch;
  let delayCss = '';
  let durationCss = '';

  const callbackCss = callback ? `${options.property}:${callback(m)};` : '';

  switch (options.scope) {
  case 'global':
    idMatch = `m${m.id}`;
    break;
  case 'gallery':
    idMatch = `p${picture.id}_m${m.id}`;
    break;
  default:
    idMatch = `louv_g-${gallery.id}_p${picture.id}_m${m.id}`;
  }

  const { onebyone, isOneByOne } = config;

  if (isOneByOne) {
    const {
      step,
      interval,
      startFrom,
      duration,
      delay
    } = onebyone;
    const l = picture.molecules.length;
    const counter = step === 'molecule' ? i : m.line.y;

    const stepAmount = interval * (
      startFrom === 'last' ? (l - counter) : counter
    );

    if (delay) delayCss = `transition-delay: ${stepAmount / 1000}s !important;`;
    if (duration) durationCss = `transition-duration: ${(config.duration + stepAmount) / 1000}s, ${duration / 1000}s !important;`;
  }

  const resultCss = `
        .${morphClassName} [id$="${idMatch}"]${options.target === 'atom' ? ' .louv__atom' : ''} { 
            ${delayCss}
            ${durationCss}
            ${callbackCss} 
        }
    `;

  return resultCss;
};
