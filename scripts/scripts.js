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
import ffetch from './ffetch.js';

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

export function getLocale() {
  const locale = getMetadata('locale');
  if (locale && locale.length > 0) {
    return locale;
  }
  // defaulting to en-us
  return 'en-us';
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

// Remove dedup based on name, specific to the locations
// eslint-disable-next-line max-len
export const getNearByLocations = async (currentLoc, thresholdDistanceInKm = 80.4672, limit = 5) => {
  const isDropoff = getMetadata('sub-type')?.trim().toLowerCase();
  const locations = await ffetch('/query-index.json').sheet('locations')
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
    let sheet = type.toLowerCase().replace(' ', '-');
    if (sheet === 'blogs') {
      sheet = 'blog'; // TODO: remove this after renaming sheet
    }
    sheets.push(sheet);
  });
  if (sheets.length === 0) {
    sheets.push('blog'); // default
  }

  // fetch all posts by type
  let posts = [];
  const fetchResults = await Promise.all(sheets.map(async (sheet) => ffetch('/query-index.json').sheet(sheet).all()));
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

/**
 * get embed code for Wistia videos
 *
 * @param {*} url
 * @returns
 */
export function embedWistia(url) {
  let suffix = '';
  const suffixParams = {
    playerColor: '006cb4',
  };

  suffix = `?${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  const temp = document.createElement('div');
  temp.innerHTML = `<div>
  <iframe loading="lazy" allowtransparency="true" title="Wistia video player" allowFullscreen frameborder="0" scrolling="no" class="wistia_embed custom-shadow"
  name="wistia_embed" src="${url.href.endsWith('jsonp') ? url.href.replace('.jsonp', '') : url.href}${suffix}"></iframe>`;
  return temp.children.item(0);
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
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

function autolinkModals(element) {
  element.addEventListener('click', async (e) => {
    const origin = e.target.closest('a');

    if (origin && origin.href && origin.href.includes('/modals/')) {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      openModal(origin.href);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    if (!document.querySelector('body.blog-page')) {
      // blog pages don't use the hero block
      buildHeroBlock(main);
    }
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
      'service-location-page', 'service-location-page-2', 'marketing-location-page', 'resource-center'];

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

  const pageMetadata = await ffetch('/query-index.json')
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
  customSchemas.forEach((e) => setJsonLd(e.schema, e.name || ''));

  // per-page metadata
  [...doc.head.querySelectorAll('meta')].filter((m) => m.name === 'ld-json' || m.attributes?.property?.value?.startsWith('ld-json:')).forEach((m) => {
    if (m.content && m.content !== '') {
      const name = m.attributes?.property?.value?.substring(8, m.attributes.property.value.length);
      if (name) {
        setJsonLd(m.content, name);
      } else {
        addJsonLd(m.content, null);
      }
    }
    m.remove();
  });
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
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    console.log(main.querySelector('.section'));
    await loadSection(main.querySelector('.section'), waitForLCP);
    await decorateTemplates(main);
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
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));
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
