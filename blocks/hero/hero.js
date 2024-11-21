import { createOptimizedPicture } from '../../scripts/aem.js';

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
    let tempPic;

    if (picture.querySelector('img')) {
      tempPic = createOptimizedPicture(
        picture.querySelector('img')?.src,
        'hero image',
        true,
        [
          { media: '(min-width: 1600px)', width: 3000 },
          { media: '(min-width: 600px)', width: 2500 },
          { width: 750 },
        ],
      );

      tempPic.classList.add('hero-background');
    }

    if (pictures.length === 2) {
      if (index === 0) {
        picture.classList.add('mobile-only');
        tempPic?.classList.add('mobile-only');
      } else {
        picture.classList.add('desktop-only');
        tempPic?.classList.add('desktop-only');
      }
    }

    if (index === 0) {
      block.replaceChildren(tempPic || picture);
    } else {
      block.append(tempPic || picture);
    }
  });

  // Add everything to the block
  block.append(contentContainer);
  block.parentElement.parentElement.classList.add('blue-background');
}
