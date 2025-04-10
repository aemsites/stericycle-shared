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

  // ✅ Reuse CTA div (3rd child)
  const originalCtaDiv = block.children[2]?.cloneNode(true);
  if (originalCtaDiv) {
    originalCtaDiv.classList.add('download-cta');

    // remove the first child text element
    originalCtaDiv.children[0].remove();

    // replace a tag content with downloadnow
    const aTag = originalCtaDiv.querySelector('a');
    if (aTag) {
      const aTagText = aTag.textContent;
      if (aTagText && aTagText !== downloadnow) {
        aTag.textContent = downloadnow;
      }
    }

    children.push(originalCtaDiv);
  }

  block.replaceChildren(...children);

  decorateButtons(block);
}
