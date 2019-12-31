export default () => window.innerHeight
  || document.documentElement.clientHeight
  || document.body.clientHeight
  || 0;
