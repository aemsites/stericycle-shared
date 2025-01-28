import { decorateButtons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { span, button } from '../../scripts/dom-helpers.js';

function decorateCloseButton(block) {
  const buttonWrapper = document.createElement('div');
  buttonWrapper.classList.add('banner-actions');
  const closeButton = document.createElement('button');
  closeButton.classList.add('close-button');
  closeButton.onclick = () => {
    block.remove();
  };
  buttonWrapper.append(closeButton);
  block.append(buttonWrapper);
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
  contentWrapper.innerHTML = block.innerHTML;
  block.innerHTML = '';
  block.append(contentWrapper);

  decorateCloseButton(block);

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
    closeButton.addEventListener('click', () => copyBlock.remove());
    body.prepend(copySection);
    copySection.style = '{display: block;}';
    block.closest('.section').remove();
  }
}
