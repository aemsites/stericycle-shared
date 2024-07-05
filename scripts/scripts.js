import {
  sampleRUM,
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS,
  getMetadata,
} from './aem.js';

const LCP_BLOCKS = []; // add your LCP blocks to the list

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

function getBlogBaseUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    if (pathParts.length > 2 && pathParts[2] === 'blog') {
      urlObj.pathname = `/${pathParts[1]}/blog`;
    } else if (pathParts.length > 1 && pathParts[1] === 'blog') {
      urlObj.pathname = '/blog';
    } else {
      throw new Error('URL does not match expected pattern');
    }

    return urlObj.toString();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Invalid URL:', error);
    return null;
  }
}

async function decorateBlog(main) {
  if (main.parentElement && main.parentElement.matches('body[class="blog-page"]')) {
    const blogBreadcrumb = getMetadata('blog-breadcrumb');
    const { title } = document;
    const leftColumn = document.createElement('div');
    leftColumn.classList.add('blog-content');
    const rightColumn = document.createElement('div');
    rightColumn.classList.add('related-content');
    // Create related content wrapper
    const rcWrapper = document.createElement('div');
    rcWrapper.classList.add('related-content-wrapper');

    const rcHeader = document.createElement('h4');
    rcHeader.classList.add('related-content-header');
    rcWrapper.append(rcHeader);
    const mainSection = main.querySelector('div.section');
    const defaultContent = main.querySelector('div.section > div.default-content-wrapper');
    leftColumn.append(...defaultContent.childNodes);
    rightColumn.append(rcWrapper);
    defaultContent.prepend(rightColumn);
    defaultContent.prepend(leftColumn);

    // Create title breadcrumb
    const titleBreadcrumb = document.createElement('span');
    titleBreadcrumb.classList.add('title-breadcrumb');
    titleBreadcrumb.textContent = title;

    // Create blog breadcrumb with a link
    const blogBreadcrumbElement = document.createElement('p');
    blogBreadcrumbElement.classList.add('blog-breadcrumb');
    // Get the blog base URL
    const blogBaseUrl = getBlogBaseUrl(window.location.href);
    const blogLinkElement = document.createElement('a');
    blogLinkElement.textContent = blogBreadcrumb;
    blogLinkElement.href = blogBaseUrl;
    blogLinkElement.setAttribute('aria-label', blogBreadcrumb);
    blogBreadcrumbElement.append(blogLinkElement, titleBreadcrumb);

    // Create a wrapper div for breadcrumbs
    const breadcrumbWrapper = document.createElement('div');
    breadcrumbWrapper.classList.add('breadcrumb-wrapper');
    breadcrumbWrapper.append(blogBreadcrumbElement);
    // add the breadcrumbWrapper to the start of the leftColumn
    mainSection.prepend(breadcrumbWrapper);
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
