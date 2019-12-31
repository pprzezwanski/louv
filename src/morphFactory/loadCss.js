import createMorphClassName from './createMorphClassName';
import createCssText from './createCssText';
import appendStyle from './appendStyle';
import fq from 'frame-q';

export default input => new Promise((r) => {
  fq.add(() => createMorphClassName(input))
    .then(({ morphClassName, newConfigDetected }) => fq.add(() => {
      const cssText = createCssText({
        morphClassName, newConfigDetected, ...input
      });

      if (cssText) appendStyle(cssText, morphClassName);
      r(morphClassName);
    }));
});
