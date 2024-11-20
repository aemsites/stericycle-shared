/*
 * Faq Block
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 */
import { decorate as embed } from '../embed/embed.js';
import { addJsonLd } from '../../scripts/scripts.js';

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
      }, 100); // Match this duration with the CSS animation duration
    } else {
      details.classList.add('open');
      details.setAttribute('open', '');
    }
  });
}

async function addFaqJsonLd(questions) {
  const mainEntity = [];

  questions.forEach((question) => {
    mainEntity.push({
      '@type': 'Question',
      name: question.label,
      acceptedAnswer: {
        '@type': 'Answer',
        text: question.body,
      },
    });
  });

  addJsonLd({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  });
}

export default function decorate(block) {
  let blockLabel;
  if (block.classList.contains('labeled')) {
    blockLabel = block.children[0].cloneNode(true);
    block.children[0].remove();
  }
  const questions = [];
  [...block.children].forEach((row) => {
    if (block.classList.contains('plain')) {
      const label = row.children[0];
      const body = row.children[1];
      questions.push({ label: label.textContent, body: body.innerHTML.replace(/\n */g, '') });
      const summary = document.createElement('div');
      summary.append(label, body);
      summary.className = 'faq-plain';
      row.replaceWith(summary);
    } else {
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
      // push meta item
      questions.push({ label: summary.textContent, body: body.innerHTML.replace(/\n */g, '') });
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
    }
  });
  if (blockLabel) {
    block.prepend(blockLabel);
  }
  addFaqJsonLd(questions);
}
