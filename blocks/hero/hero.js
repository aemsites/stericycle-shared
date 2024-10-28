import { div } from '../../scripts/dom-helpers.js';

export default function decorate(block) {
  const wrapper = block.querySelector('div');
  const contentContainer = document.createElement('div');
  contentContainer.classList.add('hero-content-container');

  // Decorate content
  const content = wrapper.querySelector('div');
  content.classList.add('hero-content');
  contentContainer.append(content);

  const backgroundDiv = div({ class: 'hero-background' });
  const picSrc = content.querySelector('picture img')?.src;

  if (picSrc) {
    backgroundDiv.style.backgroundImage = `url(${picSrc.split('?')[0]})`;
  }

  // Remove the picture element
  const picture = content.querySelector('picture');
  if (picture) {
    picture.parentElement.remove();
  }

  // Add everything to the block
  block.replaceChildren(backgroundDiv, contentContainer);
  block.parentElement.parentElement.classList.add('blue-background');
}
