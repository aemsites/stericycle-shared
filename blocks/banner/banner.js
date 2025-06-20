import { decorateButtons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { span, button, p } from '../../scripts/dom-helpers.js';

const BANNER_COOKIE = 'privacy-banner-dismissed';
const COOKIE_EXPIRY_DAYS = 365; // Cookie expires after 1 year

function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
}

function getCookie(name) {
  const cookieName = `${name}=`;
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i += 1) {
    const cookie = cookies[i].trim();
    if (cookie.indexOf(cookieName) === 0) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }
  return '';
}

function decorateCloseButton(block) {
  const buttonWrapper = document.createElement('div');
  buttonWrapper.classList.add('banner-actions');
  const closeButton = document.createElement('button');
  closeButton.classList.add('close-button');
  closeButton.onclick = () => {
    if (block.classList.contains('use-cookie')) {
      setCookie(BANNER_COOKIE, 'true', COOKIE_EXPIRY_DAYS);
    }
    block.remove();
  };
  buttonWrapper.append(closeButton);
  return buttonWrapper;
}

function navigateContent(block, direction) {
  const pages = block.querySelectorAll('.banner-content-page');
  const currentIndex = [...pages].findIndex((page) => page.classList.contains('active'));
  let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

  if (newIndex < 0) newIndex = 0;
  if (newIndex >= pages.length) newIndex = 0;

  pages[currentIndex].classList.remove('active');
  pages[newIndex].classList.add('active');

  const pageNumberSpan = block.querySelector('.banner.block > span');
  pageNumberSpan.innerText = `${newIndex + 1} of ${pages.length}`;
}

export default async function decorate(block) {
  // Check if banner should be hidden due to cookie
  if (block.classList.contains('use-cookie') && getCookie(BANNER_COOKIE) === 'true') {
    block.remove();
    return;
  }

  // Set default background if no other is present
  if (!(/-background/.test(block.className))) {
    block.classList.add('blue-background');
  }

  if (block.classList.contains('from-fragment')) {
    // check for malformed config
    const row = block.querySelector('div');
    const column = row?.querySelector('div');
    const anchor = column?.querySelector('a');
    if (!anchor || block.children.length > 1 || row.children.length > 1 || column.children.length > 1) {
      block.innerHTML = 'Invalid fragment!';
      return;
    }
    // fetch content from fragment
    block.innerHTML = '';
    const fragment = await loadFragment(new URL(anchor.href).pathname);
    fragment.querySelectorAll('.default-content-wrapper').forEach((wrapper) => wrapper.classList.remove('default-content-wrapper'));
    [...fragment.children].forEach((child, idx) => {
      child.classList.remove('section');
      block.append(child);
      child.classList.add('banner-content-page');

      const arrowRightEl = p(
        { class: 'button-container' },
        span({ class: 'icon icon-right-arrow-bolder', 'data-icon-src': '/icons/right-arrow-bolder.svg', style: '--mask-image: url(/icons/right-arrow-bolder.svg);' }),
      );

      child.append(arrowRightEl);

      if (idx === 0) {
        child.classList.add('active');
      }
    });
  } else {
    decorateButtons(block);
  }

  // Wrap content in pages
  const contentWrapper = document.createElement('div');
  contentWrapper.classList.add('banner-content');
  if (block.classList.contains('centered')) {
    contentWrapper.classList.add('centered');
  }
  contentWrapper.innerHTML = block.innerHTML;
  block.innerHTML = '';

  // Create a wrapper for content and actions
  const wrapper = document.createElement('div');
  wrapper.classList.add('banner-content-wrapper');
  wrapper.append(contentWrapper);
  const closeButtonWrapper = decorateCloseButton(block);
  wrapper.append(closeButtonWrapper);
  block.append(wrapper);

  if (block.classList.contains('fixed-to-top')) {
    block.classList.add('cmp-notification-bar'); // analytics trigger
    contentWrapper.classList.add('cmp-carousel__item__content'); // analytics trigger
    const body = block.closest('body');
    const copySection = block.closest('.section').cloneNode(true);
    const copyBlock = copySection.querySelector('.block.banner');
    const pages = copyBlock.querySelectorAll('.banner-content-page');

    if (pages.length > 1) {
      const currentIndex = [...pages].findIndex((page) => page.classList.contains('active'));
      const pageIndex = span({ class: 'page-index' }, `${currentIndex + 1} of ${pages.length}`);
      const leftChevron = button({ class: 'fa-chevron-left' });
      const rightChevron = button({ class: 'fa-chevron-right' });
      leftChevron.addEventListener('click', () => navigateContent(copyBlock, 'previous'));
      rightChevron.addEventListener('click', () => navigateContent(copyBlock, 'next'));
      copyBlock.prepend(pageIndex);
      copyBlock.prepend(leftChevron);
      copyBlock.append(rightChevron);
    }
    const closeButton = copyBlock.querySelector('button.close-button');
    closeButton.classList.add('cmp-carousel__action--close'); // analytics trigger
    closeButton.addEventListener('click', () => {
      if (copyBlock.classList.contains('use-cookie')) {
        setCookie(BANNER_COOKIE, 'true', COOKIE_EXPIRY_DAYS);
      }
      copyBlock.remove();
    });
    body.prepend(copySection);
    copySection.style = '{display: block;}';
    block.closest('.section').remove();
  }
}
