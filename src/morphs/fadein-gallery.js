import morph from '../morphFactory';

const callback = (input) => {
  const { picture, gallery, config } = input;
  picture.show();
  gallery.show(config.duration);
};

export default morph('fadein-gallery', {
  target: 'gallery',
  property: 'opacity',
  scope: 'global',
  callback,
  defaultConfig: {
    parallel: true,
  }
});
