import morph from '../morphFactory';

const propertyValue = (input) => {
  const { config } = input;

  const distance = Math.max(window.innerHeight, window.innerWidth);
  const radians = config.angle * Math.PI / 180;

  return `translate(${Math.round(distance * Math.cos(radians))}px, ${Math.round(distance * Math.sin(radians))}px)`;
};

export default morph('offscreen', {
  target: 'molecule',
  property: 'transform',
  propertyValue,
  defaultConfig: {
    angle: 90, // in degrees
  }
});
