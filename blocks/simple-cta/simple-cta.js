import { decorateAnchors } from '../../scripts/scripts.js';

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`simple-cta-${cols.length}-cols`);
  let isImageLink = false;
  if (block.querySelector('img')) {
    block.classList.add('simple-cta-has-image');
  }

  // setup image simple-cta
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      const link = col.querySelector('a');

      if (pic && link?.href
        && new URL(link.href).pathname === new URL(link.innerText).pathname) {
        link.innerHTML = '';
        link.appendChild(pic);
        isImageLink = true;
      }

      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('simple-cta-img-col');
        }
      }
      if (isImageLink) {
        block.classList.add('centered-text');
      }
    });
  });

  decorateAnchors(block);
}
