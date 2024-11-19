import { readBlockConfig, fetchPlaceholders } from '../../scripts/aem.js';
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

  const ctaDiv = document.createElement('div');
  ctaDiv.classList.add('download-cta');
  const ctaP = document.createElement('p');
  ctaP.classList.add('button-container');
  const ctaStrong = document.createElement('strong');
  const ctaA = document.createElement('a');
  ctaA.classList.add('button');
  ctaA.href = cfg.download;
  ctaA.textContent = downloadnow;
  ctaStrong.appendChild(ctaA);
  ctaP.appendChild(ctaStrong);
  ctaDiv.appendChild(ctaP);
  children.push(ctaDiv);

  block.replaceChildren(...children);
}
