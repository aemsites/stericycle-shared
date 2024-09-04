import { readBlockConfig, fetchPlaceholders } from '../../scripts/aem.js';
import { getLocale } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  const ph = await fetchPlaceholders(`/${getLocale()}`);
  const { downloadnow } = ph;

  const igContainer = document.createElement('div');
  igContainer.classList.add('ig-container');
  const headDiv = document.createElement('div');
  const h4 = document.createElement('h4');
  h4.textContent = cfg.title;
  headDiv.appendChild(h4);
  igContainer.appendChild(headDiv);
  const downloadDiv = document.createElement('div');
  const imageDiv = document.createElement('div');
  const img = document.createElement('img');
  img.src = cfg.image;
  img.alt = cfg.title;
  const ctaDiv = document.createElement('div');
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
  imageDiv.appendChild(img);
  downloadDiv.appendChild(imageDiv);
  downloadDiv.appendChild(ctaDiv);
  igContainer.appendChild(downloadDiv);
  block.replaceWith(igContainer);
}
