import { getMetadata, loadCSS } from '../../scripts/aem.js';

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  let navMeta = getMetadata('nav') || 'nav';
  if (navMeta.indexOf('/') >= 0) {
    navMeta = navMeta.split('/').pop();
  }

  try {
    const cssLoaded = loadCSS(
      `${window.hlx.codeBasePath}/blocks/header/${navMeta}.css`,
    );
    const jsLoaded = new Promise((resolve) => {
      (async () => {
        try {
          const mod = await import(
            `${window.hlx.codeBasePath}/blocks/header/${navMeta}.js`
          );

          if (mod.default) {
            await mod.default(block);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(`failed to load sub-module for ${navMeta}`, error);
        }
        resolve();
      })();
    });
    await Promise.all([cssLoaded, jsLoaded]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`failed to load header ${navMeta}`, error);
  }
}
