import { loadCSS } from '../../scripts/aem.js';

export default async function decorate(block) {
  let type = 'default';
  if (block.classList.contains('fetch')) {
    type = 'fetch';
  }

  try {
    const cssLoaded = loadCSS(`${window.hlx.codeBasePath}/blocks/tabs/${type}.css`);
    const jsLoaded = new Promise((resolve) => {
      (async () => {
        try {
          const mod = await import(`${window.hlx.codeBasePath}/blocks/tabs/${type}.js`);
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
}
