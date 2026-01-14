import { getMetadata, loadScript } from './aem.js';
// eslint-disable-next-line import/no-cycle
import { getLocaleAsBCP47 } from './scripts.js';
import getOneTrustConfig from './otconfing.js';

function initDataLayer() {
  let author = '';
  if (window.location.host.includes('shredit')) {
    author = 'Shred-it';
  } else if (window.location.host.includes('stericycle')) {
    author = 'Stericycle';
  }

  window.digitalData = {
    page: {
      pageInfo: {
        pageID: window.location.pathname,
        brand: 'sid',
        pageName: getMetadata('og:title'),
        destinationURL: window.location.href,
        referringURL: document.referrer,
        sysEnv: '', // "desktop, tablet or mobile"
        author,
        language: getLocaleAsBCP47(),
        pageURL: window.location.href,
        currentPagePath: window.location.pathname,
        pageType: getMetadata('template') || '',
        pageDescription: getMetadata('og:description'),
        country: getLocaleAsBCP47().split('-')[1] || 'US',
      },
      category: {
        primaryCategory: '',
        subCategory: '',
      },
      attributes: {
        analytics: {
          event: {
            eventName: null,
            eventAction: null,
            eventPoints: null,
            type: null,
            timeStamp: new Date(),
            effect: null,
            category: {
              primaryCategory: null,
              subCategory: null,
            },
            attributes: {},
          },
        },
      },
    },
    events: [],
    version: '1.0',
  };

  window.digitalData.newEvent = (ev) => {
    const eventContainer = {};
    const event = {
      event: ev?.event !== undefined ? ev.event : null,
      formType: ev?.formType !== undefined ? ev.formType : null,
      formName: ev?.formName !== undefined ? ev.formName : null,
      formStep: ev?.formStep !== undefined ? ev.formStep : null,
      modalName: ev?.modalName !== undefined ? ev.modalName : null,
      triggerType: ev?.triggerType !== undefined ? ev.triggerType : null,
      formElement: ev?.formElement !== undefined ? ev.formElement : null,
      searchType: ev?.searchType !== undefined ? ev.searchType : null,
      searchTerm: ev?.searchTerm !== undefined ? ev.searchTerm : null,
      searchResultRange: ev?.searchResultRange !== undefined ? ev.searchResultRange : null,
      searchFilters: ev?.searchFilters !== undefined ? ev.searchFilters : null,
      timeStamp: ev?.timeStamp !== undefined ? ev.timeStamp : new Date(),
      quoteType: ev?.quoteType !== undefined ? ev.quoteType : null,
      serviceType: ev?.serviceType !== undefined ? ev.serviceType : null,
    };
    window.digitalData.events.push(event);
    window.digitalData.page.attributes.analytics.event = event;
    return eventContainer;
  };
}

async function initAdobeDataLayer() {
  await loadScript('/scripts/adobe-client-data-layer.min.js', { async: '', defer: '' });
}

/**
 * Initialize GTM dataLayer
 */
function initGTM() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    pageCategory: getMetadata('page-category') || '',
    pageService: getMetadata('page-service') || '',
    pageType: getMetadata('page-type') || '',
  });
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

function cmpLoaded() {
  window.adobeDataLayer = window.adobeDataLayer || [];
  window.adobeDataLayer.push({
    event: 'cmp:loaded',
  });
}

export async function initMartech(env) {
  initDataLayer();
  initGTM();
  await initAdobeDataLayer();
  await initLaunch(env);
  await cmpLoaded();
}

export async function addCookieBanner() {
  const otConfig = getOneTrustConfig(window.location.href);
  await loadScript(otConfig.script, { type: 'text/javascript'});
  await loadScript('https://cdn.cookielaw.org/scripttemplates/otSDKStub.js', { type: 'text/javascript', charset: 'UTF-8', 'data-domain-script': otConfig.domainScript });
}

/**
 * Push event to custom 3rd party dataLayer
 * @param ev event payload
 */
export function sendDigitalDataEvent(ev) {
  if (!window.digitalData) {
    return; // digitalData not initialized
  }
  window.digitalData.event = window.digitalData.event || [];
  window.digitalData.newEvent(ev);
}

/**
 * Push to GTM dataLayer
 * @param data payload
 */
export function pushToDataLayer(data) {
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  window.dataLayer.push(data);
}

/**
 * Decorate all CTA buttons with the analytics trigger classname.
 * @param {Element} element container element
 */
export async function decorateCtaButtons(element) {
  setTimeout(() => {
    element.querySelectorAll('.button:not(form):not(.exclude-from-cta-events):not(.quote-button)').forEach((a) => {
      a.classList.add('cmp-linkcalltoaction');
    });
  }, 100);
}

/**
 * Runs clarity tracking script.
 * See: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup
 * @returns {Promise<void>}
 */
export async function embedClarityTracking() {
  /* eslint-disable */
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "kv1gc51u0y");
  /* eslint-enable */
}
