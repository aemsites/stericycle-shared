import {
  readBlockConfig,
  fetchPlaceholders,
  decorateButtons,
} from '../../scripts/aem.js';
import { getLocale } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  const imgIdx = Object.keys(cfg).indexOf('image');
  const ph = await fetchPlaceholders(`/${getLocale()}`);
  const { downloadnow } = ph;

  const children = [];

  if (cfg.title) {
    const headDiv = document.createElement('div');
    headDiv.classList.add('download-head');
    const h4 = document.createElement('h4');
    h4.textContent = cfg.title;
    headDiv.appendChild(h4);
    children.push(headDiv);
  }

  const imageDiv = document.createElement('div');
  imageDiv.classList.add('download-image');
  const picture = block.children[imgIdx].children[1].querySelector('picture');
  const img = picture.querySelector('img');
  const ratio = (parseInt(img.height, 10) / parseInt(img.width, 10)) * 100;
  picture.style.paddingBottom = `${ratio}%`;
  imageDiv.append(picture);
  children.push(imageDiv);

  // ✅ Create consistent CTA structure
  const originalCtaDiv = block.children[2];
  if (originalCtaDiv) {
    const originalLink = originalCtaDiv.querySelector('a');

    if (originalLink) {
      const newCtaDiv = document.createElement('div');
      newCtaDiv.classList.add('download-cta');

      const wrapperDiv = document.createElement('div');
      const pElement = document.createElement('p');
      pElement.classList.add('button-container');

      const newLink = document.createElement('a');
      newLink.href = originalLink.href;
      newLink.title = originalLink.title;
      newLink.setAttribute('aria-label', originalLink.getAttribute('aria-label') || originalLink.title);
      newLink.target = originalLink.target || '_blank';
      newLink.classList.add('button');

      const originalClasses = originalLink.className.split(' ');
      originalClasses.forEach((className) => {
        if (className && className !== 'button') {
          newLink.classList.add(className);
        }
      });

      newLink.classList.add('secondary');
      newLink.textContent = downloadnow;

      const emElement = document.createElement('em');
      emElement.appendChild(newLink);

      pElement.appendChild(emElement);
      wrapperDiv.appendChild(pElement);
      newCtaDiv.appendChild(wrapperDiv);

      children.push(newCtaDiv);
    }
  }

  block.replaceChildren(...children);

  decorateButtons(block);
}
