import morph from '../morphFactory';

// const propertyValue = (input) => {
//     const { morphClassName } = input;

//     return `
//         .louv__picture.${morphClassName} .louv__molecule {
//             transform: none !important;
//         }
//     `;
// };

export default morph('restructure', {
  // propertyValue,
  scope: 'global',
  defaultConfig: {
    // target: 'molecule',
    // property: 'transform',
    // clearAll: true
  }
});
