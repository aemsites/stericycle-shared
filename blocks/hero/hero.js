import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const wrapper = block.querySelector('div');
  const contentContainer = document.createElement('div');
  contentContainer.classList.add('hero-content-container');

  // Decorate content
  const content = wrapper.querySelector('div');
  content.classList.add('hero-content');
  contentContainer.append(content);
  const picture = content.querySelector('picture');
  picture.parentElement.remove();
  picture.classList.add('hero-background');
  let tempPic;

  if (picture.querySelector('img')) {
    tempPic = createOptimizedPicture(
      picture.querySelector('img')?.src,
      'hero image',
      false,
      [
        { media: '(min-width: 1600px)', width: 3000 },
        { media: '(min-width: 600px)', width: 2500 },
        { width: 750 },
      ],
    );

    tempPic.classList.add('hero-background');
  }

  // Add everything to the block
  block.replaceChildren(tempPic || picture, contentContainer);
  block.parentElement.parentElement.classList.add('blue-background');
}
