import { readBlockConfig } from '../../scripts/aem.js';

export default function decorate(block) {
  const cfg = readBlockConfig(block);

  const igContainer = document.createElement('div');
  igContainer.classList.add('ig-container');
  const headDiv = document.createElement('div');
  const h4 = document.createElement('h4');
  h4.textContent = 'Get the Infographic';
  headDiv.appendChild(h4);
  igContainer.appendChild(headDiv);
  const downloadDiv = document.createElement('div');
  const imageDiv = document.createElement('div');
  const img = document.createElement('img');
  img.src = cfg.image;
  const ctaDiv = document.createElement('div');
  const ctaP = document.createElement('p');
  ctaP.classList.add('button-container');
  const ctaStrong = document.createElement('strong');
  const ctaA = document.createElement('a');
  ctaA.classList.add('button');
  ctaA.href = cfg.download;
  ctaA.textContent = 'Download Now';
  ctaStrong.appendChild(ctaA);
  ctaP.appendChild(ctaStrong);
  ctaDiv.appendChild(ctaP);
  imageDiv.appendChild(img);
  downloadDiv.appendChild(imageDiv);
  downloadDiv.appendChild(ctaDiv);
  igContainer.appendChild(downloadDiv);
  block.replaceWith(igContainer);
}
