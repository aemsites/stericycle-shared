import {
  buildBlock,
  decorateBlocks,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateTemplateAndTheme,
  getMetadata,
  loadBlocks,
  loadCSS,
  loadFooter,
  loadHeader,
  sampleRUM,
  waitForLCP,
  toClassName,
  decorateBlock,
  loadBlock,
  loadSection,
} from './aem.js';
import * as domHelper from './dom-helpers.js';
import ffetch from './ffetch.js';
// eslint-disable-next-line import/no-cycle
import { decorateCtaButtons, initMartech } from './martech.js';

export const BREAKPOINTS = {
  mobile: window.matchMedia('(max-width: 767px)'),
  tablet: window.matchMedia('(min-width: 768px)'),
  desktop: window.matchMedia('(min-width: 992px)'),
};

export function convertExcelDate(excelDate) {
  const secondsInDay = 86400;
  const excelEpoch = new Date(1899, 11, 31);
  const excelEpochAsUnixTimestamp = excelEpoch.getTime();
  const missingLeapYearDay = secondsInDay * 1000;
  const delta = excelEpochAsUnixTimestamp - missingLeapYearDay;
  const excelTimestampAsUnixTimestamp = excelDate * secondsInDay * 1000;
  const parsed = excelTimestampAsUnixTimestamp + delta;
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

/**
 * Formats a phone number for displaying.
 * @param {String} num phone number to format
 * @param {Boolean} parens whether to wrap the area code in parens
 */
export function formatPhone(num, parens = false) {
  const match = num?.match(/(\d{3})(\d{3})(\d{4})/);
  if (!match) {
    return num || '';
  }
  const [area, prefix, line] = match.slice(1);
  return parens ? `(${area}) ${prefix}-${line}` : `${area}-${prefix}-${line}`;
}

/**
 * Creates a link to a post.
 * @param {Object} post post object
 * @returns {Element} anchor element
 */
export function createPostLink(post) {
  const anchor = document.createElement('a');
  if (post) {
    anchor.setAttribute('aria-label', post.title);
    anchor.href = post.path;
  }
  return anchor;
}

/**
 * Converts excel datetime strings to a Date object
 * @returns {Date} Date object
 */
export function getDateFromExcel(date) {
  if (!Number.isNaN(date)) {
    const excelDate = +date > 99999
      ? new Date(+date * 1000)
      : new Date(Math.round((+date - (1 + 25567 + 1)) * 86400 * 1000));
    return excelDate;
  }
  return date;
}

export const formatDate = (date) => date.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: '2-digit',
});

function arraysHaveMatchingItem(array1, array2) {
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < array1.length; i++) {
    if (array2.includes(array1[i])) {
      return true;
    }
  }
  return false;
}

export function getEnvironment() {
  const { hostname } = window.location;
  if (hostname === 'localhost') {
    return 'dev';
  }
  if (hostname.endsWith('.aem.page') || (hostname.startsWith('stage') && hostname.endsWith('.shredit.com'))) {
    return 'stage';
  }
  if (hostname.endsWith('.aem.live') || hostname === 'www.shredit.com') {
    return 'prod';
  }
  return 'unknown';
}

export function getLocale() {
  const locale = getMetadata('locale');
  if (locale && locale.length > 0) {
    return locale;
  }
  // defaulting to en-us
  return 'en-us';
}

export function getLocaleAsBCP47() {
  const locale = getLocale();
  const parts = locale.split('-');
  parts[0] = parts[0].toLowerCase();
  for (let i = 1; i < parts.length; i += 1) {
    const part = parts[i];
    if (part === 'x') {
      parts[i] = 'x';
      if (i + 1 < parts.length) {
        parts[i + 1] = parts[i + 1].toLowerCase();
      }
    } else if (part.length === 2) {
      parts[i] = part.toUpperCase();
    } else if (part.length === 3) {
      parts[i] = part.toLowerCase();
    } else if (part.length > 3) {
      parts[i] = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    } else {
      parts[i] = part.toLowerCase();
    }
  }
  return parts.join('-');
}

const toRadians = (degrees) => ((degrees * Math.PI) / 180);

export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const tempA = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2))
    * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(tempA), Math.sqrt(1 - tempA));
  return Math.round(R * c); // Distance in kilometers
};

/**
 * Fetch the query index sheet.
 * @param {string} [locale] sheet locale (uses current page locale none is supplied)
 * @returns {*} fetched query index
 */
export function fetchQueryIndex(locale) {
  const sheetLocale = locale || getLocale();
  return ffetch(`/${sheetLocale}/query-index.json`);
}

// Remove dedup based on name, specific to the locations
// eslint-disable-next-line max-len
export const getNearByLocations = async (currentLoc, thresholdDistanceInKm = 80.4672, limit = 5) => {
  const isDropoff = getMetadata('sub-type')?.trim().toLowerCase();
  const locations = await fetchQueryIndex().sheet('locations')
    .filter((x) => {
      const latitude = parseFloat(x.latitude);
      const longitude = parseFloat(x.longitude);
      // eslint-disable-next-line max-len
      const havDistance = haversineDistance(currentLoc.latitude, currentLoc.longitude, latitude, longitude);
      x.distance = havDistance;
      return latitude !== 0 && longitude !== 0
        && (isDropoff ? x['sub-type']?.trim().toLowerCase() === 'drop-off' : true)
        && x.locale?.trim().toLowerCase() === getLocale()
        && x.name !== currentLoc.name
        && havDistance <= thresholdDistanceInKm;
    })
    .limit(limit)
    .all();

  return locations
    .reduce((acc, current) => {
      const x = acc.find((item) => item.name === current.name);
      if (!x) {
        acc.push(current);
      }
      return acc;
    }, [])
    .sort((x, y) => x.distance - y.distance);
};

/**
 * Get related posts based on page tags. Currently doesn't filter out the existing page or
 * fill up the array if there are not enough related posts
 * @param {array} types - related post type(s)
 * @param {array} tags - related post tag(s)
 * @param {number} limit - the max number of related posts to return
 * @returns {Promise<*[]>}
 */
export async function getRelatedPosts(types, tags, limit) {
  const sheets = [];
  let nTypes = [];
  // check for a split problem
  if (types.length === 1) {
    nTypes = types[0].split(',');
  }
  nTypes.forEach((type) => {
    // add sheet
    const sheet = type.toLowerCase().replace(' ', '-');
    sheets.push(sheet);
  });
  if (sheets.length === 0) {
    sheets.push('blogs'); // default
  }

  // fetch all posts by type
  let posts = [];
  const fetchResults = await Promise.all(sheets.map(async (sheet) => fetchQueryIndex().sheet(sheet).all()));
  fetchResults.forEach((fetchResult) => posts.push(...fetchResult));
  if (nTypes.length > 1) {
    // this could become a performance problem with a huge volume of posts
    posts = posts.sort((a, b) => b.date - a.date);
  }

  // filter posts by tags
  const filteredPosts = [];
  if (tags) {
    let count = 0;
    posts.forEach((post) => {
      if ((!tags || arraysHaveMatchingItem(post.tags, tags)) && count < limit) {
        filteredPosts.push(post);
        count += 1;
      }
    });
  }

  // fallback if no matching tags were found
  if (filteredPosts.length === 0) {
    return posts.slice(0, limit);
  }
  return filteredPosts;
}

function makeTwoColumns(section) {
  const columnTarget = section.querySelector('.offer-box-container.two-columns > div.default-content-wrapper');
  const columnA = document.createElement('div');
  columnA.classList.add('column-a');
  columnA.append(...columnTarget.children);
  const columnB = document.createElement('div');
  columnB.classList.add('column-b');
  const columnBItems = section.querySelector('.offer-box-container.two-columns > div.offer-box-wrapper');
  columnB.append(columnBItems);
  columnTarget.append(columnA, columnB);
}

/**
 * consolidate the offer boxes into one wrapper div
 *
 * @param main
 */
function consolidateOfferBoxes(main) {
  const sections = main.querySelectorAll('.section');
  sections?.forEach((section) => {
    const ob = section.querySelectorAll('.offer-box-wrapper');
    let firstOB;
    if (ob && ob.length > 1) {
      ob.forEach((box, index) => {
        if (index === 0) {
          firstOB = box;
        } else {
          firstOB.append(...box.children);
          box.remove();
        }
      });
      if (section.querySelector('offer-box-container.two-columns')) {
        makeTwoColumns(section);
      }
    }
  });
}

async function fetchWistiaMetadata(videoUrl) {
  const response = await fetch(`${videoUrl}.json`);
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  return response.json();
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  // blog pages don't use the hero block
  // If hero block already added on the page
  if (document.querySelector('body.blog-page') || main.querySelector(':scope > div > div.hero')) {
    return;
  }
  const firstSection = main.querySelector('div');
  const h1 = firstSection.querySelector('h1');
  if (!h1) {
    return;
  }
  const picture = h1.previousElementSibling?.querySelector('picture') || h1.nextElementSibling?.querySelector('picture');
  if (!picture) {
    return;
  }

  // create block
  const block = buildBlock('hero', { elems: Array.from(firstSection.children) });
  firstSection.append(block);
}

function buildBreadcrumb(main) {
  const { div } = domHelper;
  const breadcrumb = getMetadata('breadcrumb');
  if (breadcrumb.toLowerCase() === 'true') {
    main.prepend(div(buildBlock('breadcrumb', { elems: [] })));
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * @typedef {Object} Config
 * @property {string} type - The type of trigger ('time' or 'exit' or 'scroll').
 * @property {string} size - The size of the modal.
 * @property {string} value - The value associated with the trigger (e.g., time in seconds).
 * @property {string} path - The path to the modal content.
 */
export function fetchTriggerConfig() {
  return {
    path: getMetadata('modal-path'),
    size: getMetadata('modal-size'),
    type: getMetadata('modal-trigger'),
    value: getMetadata('modal-trigger-threshold'),
  };
}

async function autolinkModals(element) {
  element.addEventListener('click', async (e) => {
    const origin = e.target.closest('a');

    if (origin && origin.href && origin.href.includes('/modals/')) {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      openModal(origin.href);
    }
  });
  const { openOnTrigger } = await import(`${window.hlx.codeBasePath}/blocks/form/trigger.js`);
  const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
  openOnTrigger(fetchTriggerConfig(), openModal);
}

function generateRandomEmail() {
  // Helper function to generate a random hexadecimal string of a given length
  function getRandomHex(length) {
    const chars = '0123456789ABCDEF';
    let result = '';
    for (let i = 0; i < length; i += 1) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  // Generate parts of the email
  const part1 = getRandomHex(8);
  const part2 = getRandomHex(4);
  const part3 = getRandomHex(4);

  // Combine parts into the desired email format
  return `${part1}.${part2}.${part3}@invalid.shredit.com`;
}

function setupRandomEmailGeneration(doc) {
  doc?.addEventListener('click', (e) => {
    if (e.target.innerHTML === 'Create Random Email') {
      e.preventDefault();
      const email = doc.querySelector('form input[type="email"]');
      if (email) {
        email.value = generateRandomEmail();
      }
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
    buildBreadcrumb(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

function modifyBigNumberList(main) {
  const bigNumberList = main.querySelectorAll('.list-style-big-numbers');
  bigNumberList.forEach((list) => {
    const listItems = list.querySelectorAll('li');
    listItems.forEach((item) => {
      // wrap the text content of the list item in the span
      const span = document.createElement('span');
      span.innerHTML = item.innerHTML;
      item.innerHTML = '';
      item.append(span);
    });
  });
}

function decorateSectionTemplates(main) {
  const imageSections = main.querySelectorAll('.section.with-image');
  imageSections.forEach((section) => {
    // get picture
    const picture = section.querySelector('div.default-content-wrapper:first-child > p > picture');
    if (!(picture?.parentElement.childElementCount === 1)) {
      return; // no valid section image found
    }
    // get or create picture wrapper
    let pictureWrapper;
    if (picture.parentElement.parentElement.childElementCount === 1) {
      pictureWrapper = picture.parentElement.parentElement;
    } else {
      pictureWrapper = document.createElement('div');
      pictureWrapper.classList.add('default-content-wrapper');
      pictureWrapper.append(picture.parentElement);
    }
    pictureWrapper.classList.add('section-image-wrapper');
    // move picture wrapper to section level
    section.prepend(pictureWrapper);
    // create a content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('section-content-wrapper');
    Array.from(section.childNodes).forEach((node) => {
      if (node !== pictureWrapper) {
        contentWrapper.appendChild(node);
      }
    });
    if (!section.contains(pictureWrapper)) {
      section.appendChild(pictureWrapper);
    }
    section.appendChild(contentWrapper);
  });
}

async function decorateTemplates(main) {
  try {
    const template = toClassName(getMetadata('template'));
    const templates = ['pr-page', 'services', 'blog-page',
      'service-location-page', 'service-location-page-2', 'marketing-location-page', 'resource-center', 'homepage'];

    if (templates.includes(template)) {
      const mod = await import(`../templates/${template}/${template}.js`);
      await loadCSS(`${window.hlx.codeBasePath}/templates/${template}/${template}.css`);

      if (mod.default) {
        await mod.default(main);
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * decorates banners that are included via metadata
 */
async function decorateBanners(main) {
  const { div, strong, p, a } = domHelper;
  try {
    const bannerType = toClassName(getMetadata('banner-type'));
    const bannerFragment = getMetadata('banner-fragment');
    const bannerText = getMetadata('banner-text');
    const bannerColor = getMetadata('banner-color') || 'blue-background';

    const bannerBlock = div({ class: 'banner block', 'data-block-name': 'banner', 'data-section-status': 'loading' });

    const section = div(
      { 'data-section-status': 'loading', class: 'section banner-container' },
      div(
        { class: 'banner-wrapper', 'data-section-status': 'loading' },
        bannerBlock,
      ),
    );

    if (bannerFragment) {
      bannerBlock.className = `banner block from-fragment ${bannerType} ${bannerColor}`;
      bannerBlock.append(
        div(
          div(
            { class: 'button-container', 'data-valign': 'middle' },
            p(a({ href: bannerFragment, title: bannerFragment })),
          ),
        ),
      );
    } else if (bannerText) {
      bannerBlock.className = `banner block ${bannerType} ${bannerColor}`;
      bannerBlock.append(
        div(
          div(
            { 'data-valign': 'middle' },
            p(strong(bannerText)),
          ),
        ),
      );
    } else {
      return;
    }
    main.appendChild(section);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * decorates external links to open in new window
 * for styling updates via CSS
 * @param {Element[]} externalAnchors The elements to decorate
 * @returns {void}
 */
export function decorateExternalAnchors(externalAnchors) {
  if (externalAnchors.length) {
    externalAnchors.forEach((a) => {
      a.target = '_blank';
    });
  }
}

/**
 * decorates anchors
 * for styling updates via CSS
 * @param {Element} element The element to decorate
 * @returns {void}
 */
export function decorateAnchors(element = document) {
  const anchors = element.getElementsByTagName('a');
  Array.from(anchors).forEach((a) => {
    // check if a has a atribute aria-label
    if (!a.getAttribute('aria-label')) {
      a.setAttribute('aria-label', a.innerText.trim() || 'Link');
    }
  });
  decorateExternalAnchors(Array.from(anchors).filter(
    (a) => a.href && !a.href.match(`^http[s]*://${window.location.host}/`),
  ));
}

/**
 * Loads footer-subscription-form
 * @param main main element
 * @returns {Promise}
 */
async function appendSubscriptionForm(main) {
  const footerSubscriptionForm = getMetadata('footer-subscription-form');
  if (footerSubscriptionForm) {
    const form = buildBlock('form', { elems: [`<a href=${footerSubscriptionForm}></a>`] });
    form.classList.add('footer-subscription-form');
    main.append(form);
    decorateBlock(form);
    loadBlock(form);
  }
}

/*
 * Adds id attribute to those sections which specify one.
 * @param {Element} main The main element
 */
function decorateSectionIds(main) {
  main.querySelectorAll('.section[data-id]').forEach((section) => {
    section.id = section.getAttribute('data-id').trim().toLowerCase();
  });
}

/**
 * Appends a JSON-LD schema to the head
 * @param schema The schema body
 * @param name The schema name
 * @param doc The document
 */
export function addJsonLd(schema, name, doc = document) {
  const script = doc.createElement('script');
  script.type = 'application/ld+json';
  script.innerHTML = JSON.stringify(schema);
  if (name) {
    script.dataset.name = name;
  }
  doc.head.appendChild(script);
}

/**
 * Either replaces the content of an existing JSON-LD schema or adds a new one to the head
 * @param schema The schema body
 * @param name The schema name
 * @param doc The document
 */
export function setJsonLd(schema, name, doc = document) {
  const existingScript = doc.head.querySelector(`script[data-name="${name}"]`);
  if (existingScript) {
    existingScript.innerHTML = JSON.stringify(schema);
    return;
  }
  addJsonLd(schema, name);
}

async function setWebPageJsonLd(doc = document) {
  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'WebPage',
    description: getMetadata('og:description', doc) || getMetadata('description', doc),
    url: getMetadata('og:url', doc) || doc.documentURI,
    name: getMetadata('og:title', doc),
  };

  const pageMetadata = await fetchQueryIndex()
    .filter((e) => e.path?.trim().toLowerCase() === new URL(doc.documentURI).pathname.toLowerCase())
    .first();
  if (pageMetadata) {
    schema.dateModified = new Date(1e3 * pageMetadata.lastModified).toISOString();
  }

  setJsonLd(schema, 'webpage');
}

async function fetchAndSetCustomJsonLd(doc = document) {
  // schema.xls
  let customSchemas = await ffetch('/schemas.json')
    .filter((e) => e.page?.trim().toLowerCase() === new URL(doc.documentURI).pathname.toLowerCase()
      || (e.page?.trim().endsWith('/*')
        && new URL(doc.documentURI).pathname.toLowerCase().startsWith(e.page.trim().toLowerCase().substring(0, e.page.trim().length - 1))))
    .all();
  customSchemas = customSchemas.sort((e1, e2) => e1.page.localeCompare(e2.page));
  customSchemas.forEach((e) => {
    let schema;
    try {
      schema = JSON.parse(e.schema);
    } catch (ignored) {
      // eslint-disable-next-line
      console.error('Tried to add invalid JSON-LD schema');
      return;
    }
    setJsonLd(schema, e.name || '');
  });

  // per-page metadata
  [...doc.head.querySelectorAll('meta')].filter((m) => m.name === 'ld-json' || m.attributes?.property?.value?.startsWith('ld-json:')).forEach((m) => {
    if (m.content && m.content !== '') {
      const name = m.attributes?.property?.value?.substring(8, m.attributes.property.value.length);
      let schema;
      try {
        schema = JSON.parse(m.content);
      } catch (ignored) {
        // eslint-disable-next-line no-console
        console.error('Tried to add invalid JSON-LD schema');
        return;
      }
      if (name) {
        setJsonLd(schema, name);
      } else {
        addJsonLd(schema, null);
      }
    }
    m.remove();
  });
}

async function addWistiaJsonLd(videoUrl) {
  const metadata = await fetchWistiaMetadata(videoUrl);
  if (!metadata?.media) {
    return;
  }

  const schema = {
    '@context': 'http://schema.org/',
    '@type': 'VideoObject',
    '@id': `https://fast.wistia.net/embed/iframe/${metadata.media.hashedId}`,
    duration: `PT${Math.trunc(metadata.media.duration)}S`,
    name: metadata.media.name,
    embedUrl: `https://fast.wistia.net/embed/iframe/${metadata.media.hashedId}`,
    uploadDate: new Date(1e3 * metadata.media.createdAt).toISOString(),
    description: metadata.media.seoDescription || '(no description)',
    transcript: metadata.media.captions?.[0]?.text || '(no transcript)',
  };

  const thumbnail = metadata.media.assets?.filter((e) => e.type === 'still_image')?.[0];
  if (thumbnail) {
    schema.thumbnailUrl = thumbnail.url.replace('.bin', '.jpg');
  }

  const content = metadata.media.assets?.filter((e) => e.type === 'original')?.[0];
  if (content) {
    schema.contentUrl = content.url.replace('.bin', '.m3u8');
  }

  addJsonLd(schema, `video-${metadata.media.hashedId}`);
}

/**
 * get embed code for Wistia videos
 *
 * @param {*} url
 * @returns
 */
export function embedWistia(url, replacePlaceholder, autoplay, fitStrategy = 'cover', videoFoam = 'false') {
  let suffix = '';
  const suffixParams = {
    playerColor: '006cb4',
    fitStrategy,
    videoFoam,
  };

  if (replacePlaceholder || autoplay) {
    suffixParams.autoplay = '1';
    suffixParams.background = autoplay ? '1' : '0';
  }
  suffix = `?${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  const temp = document.createElement('div');
  const videoUrl = url.href.endsWith('jsonp') ? url.href.replace('.jsonp', '') : url.href;
  temp.innerHTML = `<div>
  <iframe allowtransparency="true" title="Wistia video player" allowFullscreen frameborder="0" scrolling="no" class="wistia_embed custom-shadow"
  name="wistia_embed" src="${videoUrl}${suffix}"></iframe>`;
  addWistiaJsonLd(videoUrl);
  return temp.children.item(0);
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateAnchors(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateCtaButtons(main);
  modifyBigNumberList(main);
  decorateSectionTemplates(main);
  consolidateOfferBoxes(main);
  decorateSectionIds(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = getLocaleAsBCP47();

  const urlParams = new URLSearchParams(window.location.search);
  if (window.location.hostname === 'stage-us.shredit.com') {
    await initMartech('dev'); // special case for testing
  } else if (urlParams.get('load-martech')?.toLowerCase() === 'eager') {
    await initMartech(getEnvironment());
  }

  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    await decorateTemplates(main);
    await decorateBanners(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForLCP);
    if (document?.querySelector('body.with-sidebar')) {
      await loadBlocks(main.querySelector('div.page-content'));
      await loadBlocks(main.querySelector('div.page-sidebar'));
    }
  }
  setWebPageJsonLd(doc);
  fetchAndSetCustomJsonLd(doc);

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  autolinkModals(doc);
  setupRandomEmailGeneration(doc);
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  Promise.all([
    loadHeader(doc.querySelector('header')),
    loadFooter(doc.querySelector('footer')),
  ]).then(() => {
    // noinspection JSUnresolvedReference
    window.Invoca?.PNAPI?.run(); // refresh Invoca
  });

  await appendSubscriptionForm(main);

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
