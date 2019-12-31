import morph from '../morphFactory';

const propertyValue = (input) => {
  const { picture, config } = input;

  const absoluteGap = {
    x: config.absoluteGap.x != null ? config.absoluteGap.x : config.absoluteGap,
    y: config.absoluteGap.y != null ? config.absoluteGap.y : config.absoluteGap
  };

  const scaledGap = {
    x: config.scaledGap.x != null ? config.scaledGap.x : config.scaledGap,
    y: config.scaledGap.y != null ? config.scaledGap.y : config.scaledGap
  };

  const translateFunction = (m) => {
    const signX = Math.sign(m.fromCenter.x);
    const signY = Math.sign(m.fromCenter.y);

    const gap = {
      x: absoluteGap.x + scaledGap.x * m.size.x,
      y: absoluteGap.y + scaledGap.y * m.size.y,
    };

    const firstTotalIn = {
      x: picture.molecules[0].totalIn.x,
      y: picture.molecules[0].totalIn.y,
    };

    return !config.cornerOriented
      ? {
        x: gap.x * (
          m.totalIn && m.totalIn.x % 2 === 0
            ? (m.fromCenter.x - signX / 2)
            : m.fromCenter.x
        ),
        y: gap.y * (
          m.totalIn && m.totalIn.y % 2 === 0
            ? (m.fromCenter.y - signY / 2)
            : m.fromCenter.y
        )
      }
      : {
        x: -(firstTotalIn.y / 2 - m.fromCorner.x) * gap.x - m.size.x / 2,
        y: -(firstTotalIn.x / 2 - m.fromCorner.y) * gap.y - m.size.y / 2
      };
  };

  return (m) => {
    const translate = translateFunction(m);

    return `translateX(${translate.x}px)
            translateY(${translate.y}px)
            scale(${config.scale})
        `;
  };
};

const fragmentizeConfig = {
  target: 'molecule',
  property: 'transform',
  propertyValue,
  defaultConfig: {
    absoluteGap: 0,
    scaledGap: 0,
    scale: 0.2,
    cornerOriented: false,
  }
};

const fragmentize = morph('fragmentize', fragmentizeConfig);

export {
  fragmentizeConfig,
  fragmentize as default,
};
