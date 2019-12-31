export default ({
  config: {
    duration,
    delay,
    endOffset,
    isOneByOne,
    onebyone: {
      interval,
      step,
    }
  },
  picture
}) => duration
    + delay
    + (
      isOneByOne
        ? interval * (
          step === 'line'
            ? picture.total.lines
            : picture.molecules.length
        )
        : 0
    )
    + endOffset;
