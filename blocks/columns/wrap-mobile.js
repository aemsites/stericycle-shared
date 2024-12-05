import { a, div } from '../../scripts/dom-helpers.js';

function linkImages(block) {
  const paragraphs = block.querySelectorAll('p:has(picture)');
  paragraphs.forEach((par) => {
    const link = par.querySelector('a');
    if (!link) return;
    const picture = par.querySelector('picture');
    const anchor = a({
      class: 'image-link',
      href: link.getAttribute('href'),
      title: link.title,
      'aria-label': link.getAttribute('aria-label'),
    });
    par.querySelectorAll('br').forEach((br) => br.remove()); // Remove any non-semantic line breaks
    picture.replaceWith(anchor);
    anchor.append(picture);
  });
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  if (block.classList.contains('link-images')) linkImages(block);

  // Fix the CLS on image loading
  block.querySelectorAll('picture').forEach((picture) => {
    const img = picture.querySelector('img');
    const ratio = (parseInt(img.height, 10) / parseInt(img.width, 10)) * 100;
    picture.style.paddingBottom = `${ratio}%`;
  });

  const elements = block.querySelectorAll(':scope > div > div');
  const wrapper = div({ class: 'columns-list-wrapper' });
  elements.forEach((el) => {
    el.classList.add('columns-list-item');
    wrapper.append(el);
  });
  block.replaceChildren(wrapper);
}
