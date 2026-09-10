import { getMetadata, loadScript } from './aem.js';
// eslint-disable-next-line import/no-cycle
import { getLocaleAsBCP47 } from './scripts.js';

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
      // Per updated BR.430 AC: event === eventName on the pushed event.
      eventName: ev?.eventName !== undefined ? ev.eventName : null,
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
      // BR.430 Lead Form Submission data points (STERICMS-1011). `formType` is already
      // whitelisted above. PII fields (FN/LN/Email/Phone) carry Y/N presence flags only,
      // never raw values. Field names/casing pending analytics confirmation.
      formSource: ev?.formSource !== undefined ? ev.formSource : null,
      leadId: ev?.leadId !== undefined ? ev.leadId : null,
      eCommEntryPoint: ev?.eCommEntryPoint !== undefined ? ev.eCommEntryPoint : null,
      zipCode: ev?.zipCode !== undefined ? ev.zipCode : null,
      serviceLine: ev?.serviceLine !== undefined ? ev.serviceLine : null,
      requestType: ev?.requestType !== undefined ? ev.requestType : null,
      frequency: ev?.frequency !== undefined ? ev.frequency : null,
      FN: ev?.FN !== undefined ? ev.FN : null,
      LN: ev?.LN !== undefined ? ev.LN : null,
      Email: ev?.Email !== undefined ? ev.Email : null,
      Phone: ev?.Phone !== undefined ? ev.Phone : null,
      // BR.410 eComm entry-point data points (STERICMS-1026/1027/1028). Flattened from the
      // spec's eventInfo/page nesting under this flat data-layer model (see sendEcommEntryPointEvent).
      digitalPropertyID: ev?.digitalPropertyID !== undefined ? ev.digitalPropertyID : null,
      pageUrl: ev?.pageUrl !== undefined ? ev.pageUrl : null,
      urlSubdirectory: ev?.urlSubdirectory !== undefined ? ev.urlSubdirectory : null,
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

// eslint-disable-next-line no-unused-vars
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
// eslint-disable-next-line no-unused-vars
async function initWMLaunch(env) {
  const wmLaunchUrls = {
    dev: 'https://assets.adobedtm.com/3010f46ab2ec/a3cbfcd83a52/launch-01b1cb6f5edd-development.min.js',
    prod: 'https://assets.adobedtm.com/3010f46ab2ec/a3cbfcd83a52/launch-4688d17a7429.min.js',
  };
  if (!Object.keys(wmLaunchUrls).includes(env)) {
    return;
  }
  await loadScript(wmLaunchUrls[env], { async: '' });
}

function buildPagePayload() {
  const locale = getLocaleAsBCP47();
  const language = locale.split('-')[0];
  const country = (locale.split('-')[1] || 'US').toUpperCase();
  const currencyMap = { US: 'USD', CA: 'CAD' };
  const pathParts = window.location.pathname.split('/').filter(Boolean);

  return {
    baseUrl: window.location.origin,
    pageUrl: window.location.href,
    countryLanguage: language,
    currencyCode: currencyMap[country] || 'USD',
    device: window.matchMedia('(max-width: 767px)').matches ? 'm' : 'd',
    pageName: getMetadata('og:title') || document.title,
    pagenameConcat: pathParts.slice(1).join(':'),
    pageType: getMetadata('template') || getMetadata('page-type') || '',
    previousPageName: document.referrer,
    siteSection: pathParts[1] || '',
    lobType: getMetadata('lob-type') || '',
    templateName: getMetadata('template') || '',
    gisIds: getMetadata('gis-ids') || '',
    channel: getMetadata('channel') || '',
    digitalPropertyID: 'SHR',
  };
}

function pushPageLoadEvents() {
  window.adobeDataLayer = window.adobeDataLayer || [];
  // `landed` must be the first event in the ACDL sequence: Launch rules and data
  // elements read page/visitor values via _satellite.getVar() when they execute,
  // so the payload has to be in the data layer before any other event.
  window.adobeDataLayer.push({
    event: 'landed',
    eventInfo: { eventName: 'landed' },
    page: buildPagePayload(),
    visitor: {
      experienceCloudId: '',
      isRepeat: 'no',
      lob: '',
      userId: '',
      isLoggedIn: 'no',
      customerType: '',
      wmCustomerId: '',
      isBot: 'no',
      marketingCloudVisitorID: '',
      serviceLine: '',
      sessionId: '',
    },
  });
  window.adobeDataLayer.push({ event: 'cmp:loaded' });
}

// eslint-disable-next-line no-unused-vars
export async function initMartech(env) {
  initDataLayer();
  initGTM();
  await initAdobeDataLayer();
  pushPageLoadEvents();
  // STERICMS-1043 removingfor testing: await initLaunch(env);
  await initWMLaunch(env);
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
 * serviceLine (normalized) -> BR.410 eComm entry-point event name.
 */
const ENTRY_POINT_EVENTS = {
  purge: 'shrEcommPurgeEntryPoint',
  protectplus: 'shrEcommProtectPlusEntryPoint',
  dropoff: 'shrEcommDropOffEntryPoint',
};

/**
 * The top-level site section of the current page (locale prefix stripped), e.g.
 * 'secure-shredding-services', 'service-locations', 'resource-center'.
 * @returns {string}
 */
function getUrlSubdirectory() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments[0] && /^[a-z]{2}-[a-z]{2}$/i.test(segments[0])) segments.shift();
  return segments[0] || '';
}

/**
 * Fire a BR.410 eComm entry-point event (STERICMS-1026/1027/1028):
 * shrEcommProtectPlusEntryPoint / shrEcommPurgeEntryPoint / shrEcommDropOffEntryPoint.
 * Only fires when `eCommEntryPoint === 'Y'` and `serviceLine` maps to a known event.
 * PII (FN/LN/Email/Phone) are Y/N presence flags only.
 *
 * Uses the existing flat window.digitalData / newEvent model (confirmed by analytics — no WM
 * adobeDataLayer/clicks.object_content mirroring). BR.410's eventInfo/page fields are emitted flat.
 * @param {{serviceLine:string, eCommEntryPoint?:('Y'|'N'), zipCode?:string,
 *   leadId?:(string|null), FN?:string, LN?:string, Email?:string, Phone?:string}} data
 */
export function sendEcommEntryPointEvent(data = {}) {
  const {
    serviceLine,
    eCommEntryPoint = 'Y',
    zipCode = '',
    leadId = null,
    FN = 'N',
    LN = 'N',
    Email = 'N',
    Phone = 'N',
  } = data;
  if (eCommEntryPoint !== 'Y') return;
  const key = String(serviceLine ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  const event = ENTRY_POINT_EVENTS[key];
  if (!event) return;
  sendDigitalDataEvent({
    event,
    eventName: event,
    digitalPropertyID: 'SHR',
    eCommEntryPoint,
    serviceLine,
    zipCode,
    leadId,
    FN,
    LN,
    Email,
    Phone,
    pageUrl: window.location.href,
    urlSubdirectory: getUrlSubdirectory(),
  });
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
      a.classList.add('cmp-linkcalltoaction', 'a-taggable');
      const analyticsLabel = a.getAttribute('aria-label') || a.textContent.trim() || a.title;
      if (analyticsLabel) a.setAttribute('analytics', analyticsLabel);
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
