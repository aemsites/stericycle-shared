import { getMetadata, loadScript } from './aem.js';
// eslint-disable-next-line import/no-cycle
import { getLocaleAsBCP47 } from './scripts.js';

function initDataLayer() {
  window.digitalData = {
    page: {
      pageInfo: {
        brand: 'sid',
        pageName: getMetadata('og:title'),
        destinationURL: window.location.href,
        referringURL: document.referrer,
        language: getLocaleAsBCP47(),
        pageURL: window.location.href,
        pageType: 'homepage', // TODO: parse pagetype dynamically?
        pageDescription: getMetadata('og:description'),
        country: 'US', // TODO: fetch country dynamically?
      },
    },
    events: [],
    version: '1.0',
  };
}

async function initLaunch(env) {
  const launchUrls = {
    dev: 'https://assets.adobedtm.com/69ddc3de7b21/022e4d026e4d/launch-d08b621bd166-development.min.js',
    stage: 'https://assets.adobedtm.com/69ddc3de7b21/022e4d026e4d/launch-930cbc9eaafb-staging.min.js',
    prod: 'https://assets.adobedtm.com/69ddc3de7b21/022e4d026e4d/launch-e21320e8ed46.min.js',
  };
  if (!Object.keys(launchUrls).includes(env)) {
    return; // unknown env -> skip martech initialization
  }
  await loadScript(launchUrls[env], { async: '' });
}

// eslint-disable-next-line import/prefer-default-export
export async function initMartech(env) {
  initDataLayer();
  await initLaunch(env);
}
