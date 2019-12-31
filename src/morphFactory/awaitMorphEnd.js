import fq from 'frame-q';

export default ({
  morphDuration,
  afterTransitionEnd,
  listenTarget,
  shouldListen,
}) => {
  if (shouldListen) {
    const listeningOptions = {
      passive: true,
      capture: false,
    };

    const onTransitionEnd = (e) => {
      if (e.target !== listenTarget) return;
      listenTarget.removeEventListener('transitionend', onTransitionEnd, listeningOptions);
      afterTransitionEnd();
    };

    fq.add(() => {
      listenTarget.addEventListener('transitionend', onTransitionEnd, listeningOptions);
    });
  } else {
    fq.wait(
      morphDuration/*  ? morphDuration + 200 : 0 */
    ).then(() => {
      fq.add(() => {
        // if (gallery.config.debug) console.log(`@ MORPH END DETECTED IN: ${morphClassName}, method: calculateEnd`);

        afterTransitionEnd();
      });
    });
  }
};
