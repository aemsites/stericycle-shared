import { loadCSS } from '../../scripts/aem.js';

export default async function decorate(block) {
  let type = 'default';
  if (block.classList.contains('wrap-mobile')) {
    type = 'wrap-mobile';
  }

  try {
    const cssLoaded = loadCSS(`${window.hlx.codeBasePath}/blocks/columns/${type}.css`);
    const jsLoaded = new Promise((resolve) => {
      (async () => {
        try {
          const mod = await import(`${window.hlx.codeBasePath}/blocks/columns/${type}.js`);
          if (mod.default) {
            await mod.default(block);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(`failed to load sub-module for ${type}`, error);
        }
        resolve();
      })();
    });
    await Promise.all([cssLoaded, jsLoaded]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`failed to load header ${type}`, error);
  }

  // Move default-content-wrappers into the columns-wrapper
  document.querySelectorAll('.section.two-column.form-container.columns-container').forEach((section) => {
    const columnsWrapper = section.querySelector('.columns-wrapper');
    if (!columnsWrapper) return;

    const children = Array.from(section.children);
    const before = [];
    const after = [];

    let beforeWrapper = true;

    children.forEach((child) => {
      if (child === columnsWrapper) {
        beforeWrapper = false;
      } else if (child.classList.contains('default-content-wrapper')) {
        (beforeWrapper ? before : after).push(child);
      }
    });

    // Move elements into the columns-wrapper
    before.forEach((el) => columnsWrapper.insertBefore(el, columnsWrapper.firstChild));
    after.forEach((el) => columnsWrapper.appendChild(el));
  });
}
