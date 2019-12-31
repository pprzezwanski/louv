import morph from '../morphFactory';

const createTransformText = ({
  translate = {},
  rotate = 0,
  rotateVector,
  scale = 1,
  skew = {},
}) => {
  const initial = { x: '0', y: '0', z: '0' };

  const translate3d = { ...initial, ...translate };

  const rotate3d = rotateVector && {
    x: rotateVector[0],
    y: rotateVector[1],
    z: rotateVector[2],
    angle: rotate,
  };

  const scale3d = typeof scale === 'object' && {
    x: '1',
    y: '1',
    z: '1',
    ...scale
  };

  const skew2d = { x: '0', y: '0', ...skew };

  const scaleCss = scale3d
    ? `scale3d(${scale3d.x},${scale3d.y},${scale3d.z})`
    : `scale(${scale})`;
  const skewCss = `skew(${skew2d.x},${skew2d.y})`;
  const translateCss = `translate3d(${translate3d.x},${translate3d.y},${translate3d.z})`;
  const rotateCss = rotate3d
    ? `rotate3d(${rotate3d.x}, ${rotate3d.y}, ${rotate3d.z}, ${rotate3d.angle})`
    : `rotate(${rotate})`;

  return `${translateCss} ${rotateCss} ${scaleCss} ${skewCss}`;
};

const propertyValue = ({ config }) => createTransformText(config);

const additionalCss = ({ config }) => `transform-origin: ${config.transformOrigin};`;

export default morph('transform', {
  property: 'transform',
  propertyValue,
  additionalCss,
  defaultConfig: {
    transformOrigin: 'center',
  }
});
