import { decorateButtons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function decorateCloseButton(block) {
  const buttonWrapper = document.createElement('div');
  buttonWrapper.classList.add('banner-actions');
  const button = document.createElement('button');
  button.classList.add('close-button');
  button.onclick = () => {
    block.remove();
  };
  buttonWrapper.append(button);
  block.append(buttonWrapper);
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
    [...fragment.children].forEach((child) => {
      child.classList.remove('section');
      block.append(child);
    });
  } else {
    decorateButtons(block);
  }

  // Move content down a layer
  const contentWrapper = document.createElement('div');
  contentWrapper.classList.add('banner-content');
  contentWrapper.innerHTML = block.innerHTML;
  block.innerHTML = '';
  block.append(contentWrapper);

  decorateCloseButton(block);
  
  if (block.classList.contains('fixed-to-top')){
    const body = block.closest('body');
    const copyBlock = block.cloneNode(true);
    body.prepend(copyBlock);
    block.remove();
  }
}
