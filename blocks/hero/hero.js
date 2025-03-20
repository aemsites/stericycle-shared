import { createOptimizedPicture, getMetadata } from '../../scripts/aem.js';

export default function decorate(block) {
  const wrapper = block.querySelector('div');
  const contentContainer = document.createElement('div');
  contentContainer.classList.add('hero-content-container');

  // Decorate content
  const content = wrapper.querySelector('div');
  content.classList.add('hero-content');
  contentContainer.append(content);
  const pictures = content.querySelectorAll('picture');

  pictures.forEach((picture, index) => {
    picture.parentElement.remove();
    picture.classList.add('hero-background');
    const img = picture.querySelector('img');

    if (img) {
      /* eslint-disable no-param-reassign */
      picture = createOptimizedPicture(
        img?.src,
        img?.alt || 'hero image',
        true,
        [
          { media: '(min-width: 1600px)', width: 3000 },
          { media: '(min-width: 600px)', width: 2500 },
          { width: 750 },
        ],
      );
      picture.classList.add('hero-background');
    }

    if (pictures.length === 2) {
      if (index === 0) {
        picture.classList.add('mobile-only');
      } else {
        picture.classList.add('desktop-only');
      }
    }

    if (index === 0) {
      block.replaceChildren(picture);
    } else {
      block.append(picture);
    }
  });

  if (getMetadata('template') === 'service-location-page') {
    const link = document.createElement('a');
    link.classList.add('mobile-only', 'button', 'primary');
    link.href = getMetadata('nav-modal-path') || '/forms/modals/modal';
    link.textContent = 'Request a Quote';
    content.append(link);
  }

  // Add everything to the block
  block.append(contentContainer);
  if (getMetadata('template') !== 'homepage') {
    block.parentElement.parentElement.classList.add('blue-background');
  }
}
