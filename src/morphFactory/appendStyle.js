export default (css, id) => {
  const existingStyleTag = document.getElementById(id);

  if (existingStyleTag) {
    existingStyleTag.innerHTML = css;
  } else {
    const style = document.createElement('style');
    style.id = id;
    style.type = 'text/css';

    // WebKit hack
    style.appendChild(document.createTextNode(''));

    // add styles
    style.innerHTML = css;

    // Add the <style> element to the page
    document.head.appendChild(style);
    // document.getElementsByTagName('head')[0].appendChild(style);
  }
};
