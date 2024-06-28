import {
  buildBlock,
  decorateBlocks,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateTemplateAndTheme,
  loadBlocks,
  loadCSS,
  loadFooter,
  loadHeader,
  sampleRUM,
  waitForLCP,
} from './aem.js';
import ffetch from './ffetch.js';

const LCP_BLOCKS = []; // add your LCP blocks to the list

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

function arraysHaveMatchingItem(array1, array2) {
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < array1.length; i++) {
    if (array2.includes(array1[i])) {
      return true;
    }
  }
  return false;
}

/**
 * Get related blog content based on page tags. Currently doesn't filter out the existing page or
 * fill up the array if there are not enough related posts
 * @param {array} tags - tags from the page
 * @param {number} limit - the max number of related posts to return
 * @returns {Promise<*[]>}
 */
export async function getRelatedBlogContent(tags, limit) {
  const postarray = [];
  let count = 0;
  let pTags = 'Blogs';
  if (tags) {
    pTags = tags.replace('Blogs', 'bp'); // swap out Blog from the tag from the page to something arbitrary
  }
  const pageTags = JSON.stringify(pTags.split(','));
  const posts = await ffetch('/query-index.json').sheet('blog').all();
  posts.forEach((post) => {
    // if (containsTag(JSON.parse(post.tags), JSON.parse(post.tags))) {
    if (arraysHaveMatchingItem(JSON.parse(post.tags), pageTags) && count < limit) {
      postarray.push(post);
      // eslint-disable-next-line no-plusplus
      count++;
    }
  });
  return postarray;
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const firstSection = main.querySelector('div');
  const picture = firstSection.children[0]?.firstElementChild;
  const h1 = firstSection.children[1];
  if (!picture.matches('picture') || !h1?.matches('h1')) {
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

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

async function decorateBlog(main) {
  if (main.parentElement && main.parentElement.matches('body[class="blog-page"]')) {
    // console.log('Blog page detected');
    const leftColumn = document.createElement('div');
    leftColumn.classList.add('blog-content');
    const rightColumn = document.createElement('div');
    rightColumn.classList.add('related-content');
    const rcHeader = document.createElement('h4');
    rcHeader.classList.add('related-content-header');
    rightColumn.append(rcHeader);

    const defaultContent = main.querySelector('div.section > div.default-content-wrapper');
    leftColumn.append(...defaultContent.childNodes);
    defaultContent.prepend(rightColumn);
    defaultContent.prepend(leftColumn);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateBlog(main);
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
    await waitForLCP(LCP_BLOCKS);
  }

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
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

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
