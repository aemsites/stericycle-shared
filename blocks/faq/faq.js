/*
 * Faq Block
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 */
import { decorate as embed } from '../embed/embed.js';

function hasWrapper(el) {
  return !!el.firstElementChild && window.getComputedStyle(el.firstElementChild).display === 'block';
}

function addAccordionAnimation(details) {
  const summary = details.querySelector('summary');

  summary.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default behavior of summary
    if (details.hasAttribute('open')) {
      details.classList.add('close');
      details.classList.remove('open');
      setTimeout(() => {
        details.removeAttribute('open');
        details.classList.remove('close');
      }, 300); // Match this duration with the CSS animation duration
    } else {
      details.classList.add('open');
      details.setAttribute('open', '');
    }
  });
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    // decorate faq item label
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'faq-item-label';
    summary.append(...label.childNodes);
    if (!hasWrapper(summary)) {
      summary.innerHTML = `${summary.innerHTML}`;
      summary.innerHTML += '<span></span>';
    }
    // decorate faq item body
    const body = row.children[1];
    body.className = 'faq-item-body';
    if (!hasWrapper(body)) {
      body.innerHTML = `<p>${body.innerHTML}</p>`;
    }
    // decorate faq item
    const details = document.createElement('details');
    details.className = 'faq-item';

    // process embedded video blocks
    const video = body.querySelector('table');
    if (video) {
      const vhead = video.querySelector('thead > tr > th');
      if (vhead && vhead.innerText === 'embed') {
        const vDiv = document.createElement('div');
        vDiv.append(video.cloneNode(true));
        video.replaceWith(vDiv);

        // console.log(video);
        embed(vDiv);
      }
    }
    details.append(summary, body);
    row.replaceWith(details);

    // Add accordion animation
    addAccordionAnimation(details);
  });
}
