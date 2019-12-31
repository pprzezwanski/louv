import morph from '../morphFactory';

const propertyValue = (input) => {
  const { config } = input;

  // return () => `${config.filter}`;
  return `${config.filter}`;
};

export default morph('filterize', {
  // target: 'molecule',
  property: 'filter',
  propertyValue,
  defaultConfig: {
    timingFunction: 'linear',
  }
});
