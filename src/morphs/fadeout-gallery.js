import morph from '../morphFactory';

const callback = (input) => {
  const { gallery, config } = input;

  gallery.hide(config.duration);
};

export default morph('fadeout-gallery', {
  target: 'gallery',
  scope: 'global',
  property: 'opacity',
  callback,
  defaultConfig: {
    parallel: true,
  }
});
