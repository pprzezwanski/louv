import morph from '../morphFactory';

const propertyValue = ({ config }) => `${config.radiusPercentage}%`;

const additionalCss = () => 'overflow: hidden;';

export default morph('circles', {
  target: 'molecule',
  scope: 'global',
  property: 'border-radius',
  propertyValue,
  additionalCss,
  defaultConfig: {
    radiusPercentage: 50,
  }
});
