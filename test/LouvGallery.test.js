import Louv from '../src/LouvGallery';

const louvDefault = new Louv();

const louvCustom = new Louv({
  initialHeight: 200,
  initialWidth: 300,
});

describe('readInitialDimension method', () => {
  test('should set dimensions specified in the config', () => {
    louvCustom.readInitialDimensions();

    expect(louvCustom.dimensions).toEqual({
      height: 200,
      width: 300,
    });
  })

  test('should read dimensions from getBoundingClientRect if not specified in the config', () => {
    const getBoundingClientRectMock = jest.fn();

    getBoundingClientRectMock.mockReturnValue({
      height: 500,
      width: 500,
    });

    louvDefault.element = {
      getBoundingClientRect: getBoundingClientRectMock,
    };

    louvDefault.readInitialDimensions();

    expect(louvDefault.dimensions).toEqual({
      height: 500,
      width: 500,
    });
  })
})