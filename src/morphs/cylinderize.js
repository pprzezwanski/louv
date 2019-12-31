import morph from '../morphFactory';

const absround = n => Math.sign(n) * Math.round(Math.abs(n));

const propertyValue = input => (m) => {
  const { picture, config } = input;

  const { sType, angleInRadians } = config;

  // determine which part of the image
  const sign = m.fromCenter.x >= 0 ? 1 : -1;

  const previous = picture.molecules[m.previousFromCenter.x];

  m.yRotation = angleInRadians * m.fromCenter.x * (sType ? sign : 1); // radians
  m.xShrink = (1 - Math.cos(m.yRotation)) * m.size.x;
  m.xTranslation = ((-previous.xShrink / 2 + previous.xTranslation) || 0) - m.xShrink / 2;
  m.zDimension = Math.sin(m.yRotation) * m.size.x;
  if (m.fromCenter.x === 0) m.zTranslation = 0;
  if (Math.abs(m.fromCenter.x) === 1) m.zTranslation = -m.zDimension / 2;
  else m.zTranslation = -previous.zDimension / 2 + previous.zTranslation - m.zDimension / 2;
  m.yTranslation = 0;

  // pixel rounding correction
  m.xTranslation = absround(m.xTranslation) - 1;
  m.zTranslation = absround(m.zTranslation) + (sType ? 1 : sign);
  m.yTranslation = -m.fromCenter.y;

  return `
        translate3d(${m.xTranslation * sign}px, ${m.yTranslation}px, ${m.zTranslation * sign}px) rotateY(${m.yRotation}rad)
    `;
};

const centeredIteration = (fn, picture) => {
  // we use two 'for' loops instead of forEach
  // because we have to apply the function from the center column to side columns
  // in order two have valid 'previousFromCenter' values
  const numberOfLines = picture.molecules[0].totalIn.y;
  let moleculesCounter = 0;

  for (let j = 0; j < numberOfLines; j += 1) {
    const moleculesAmountInLine = picture.molecules.find(m => m.fromCorner.y === j).totalIn.x;
    const horizontalCenter = moleculesAmountInLine / 2;
    for (let i = 0; i <= horizontalCenter; i += 1) {
      const idToLeft = Math.floor(horizontalCenter) - i + moleculesCounter;
      fn(idToLeft);
      const idToRight = Math.round(horizontalCenter) + i + moleculesCounter;
      // necessary condition for even values of picture.moleculesAmount
      if (idToRight < picture.molecules.length) {
        fn(idToRight);
      }
    }
    moleculesCounter += moleculesAmountInLine;
  }
};

const cylinderizeConfig = {
  target: 'molecule',
  propertyValue,
  customIteration: centeredIteration,
};

const cylinderize = morph('cylinderize', cylinderizeConfig);

export {
  cylinderizeConfig,
  cylinderize as default,
};
