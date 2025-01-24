import { decorateButtons } from '../../scripts/aem.js';
import { a, h3, p, span } from '../../scripts/dom-helpers.js';

async function getQueryIdx(url) {
  let json;
  const page = await fetch(url);
  if (page.ok) {
    json = await page.json();
  } else {
    json = { data: [] };
  }
  return json;
}

export default async function decorate(block) {
  const rows = [...block.children];
  let backs = [];

  block.classList.add(`flip-cards-${rows[0].children.length}-cols`);

  if (block.children.length === 0) {
    block.innerHTML = 'Malformed block structure. No content.';
    return;
  }

  const lookupTable = {};
  const pages = block.querySelectorAll('a');
  const queryIdx = (await getQueryIdx('/query-index.json')).data;

  queryIdx.forEach((item) => {
    if (Object.hasOwn(item, 'path') && Object.hasOwn(item, 'title') && Object.hasOwn(item, 'description') && Object.hasOwn(item, 'teaser')) {
      const { path, title, description, teaser } = item;
      lookupTable[path] = { title, description, teaser };
    }
  });

  pages.forEach((page, idx) => {
    const pagePath = new URL(page.href).pathname;
    const cardBack = document.createElement('div');
    if (Object.hasOwn(lookupTable, pagePath)) {
      const cardDetails = lookupTable[pagePath];
      const icon = rows[0].children.item(0);
      const eyebrow = rows[1]?.children?.item(0);

      if (icon) {
        cardBack.appendChild(icon);
      }

      const titleh3 = document.createElement('h3');
      titleh3.textContent = cardDetails.title;
      titleh3.classList.add('clamp-title');

      if (eyebrow) {
        eyebrow.classList.add('eyebrow');
        titleh3.prepend(eyebrow);
      }

      const desc = document.createElement('p');
      desc.textContent = cardDetails.description;
      desc.classList.add('clamp-description');

      const url = page.href;
      const readMoreButton = a(
        { class: 'button primary', href: url, target: '_self' },
        page.title || 'Read More',
        span({ class: 'icon icon-right-arrow', 'data-icon-src': '/icons/right-arrow.svg', style: '--mask-image: url(/icons/right-arrow.svg);' }),
      );
      decorateButtons(readMoreButton);

      const contentDiv = document.createElement('div');
      contentDiv.appendChild(titleh3);
      contentDiv.appendChild(desc);
      contentDiv.appendChild(readMoreButton);

      cardBack.appendChild(contentDiv);

      backs.push(cardBack);
    } else {
      // Whenever flip-cards refers to an external link, we get the details directly from the doc/author
      const rowChildren = block.children[1] ? [...block.children[1].children] : [];
      if (rowChildren && rowChildren[idx]) {
        const defaultCardDetails = rowChildren[idx];
        const icon = rows[0].children.item(0);
        if (icon) {
          cardBack.appendChild(icon);
        }
        const titleh3 = h3();
        const defaultH3 = defaultCardDetails.querySelector('h3');
        titleh3.textContent = defaultH3?.textContent;
        titleh3.classList.add('clamp-title');
        const desc = p();
        defaultCardDetails.querySelectorAll('p:not(.button-container):not(:last-of-type)')?.forEach((para) => {
          desc.appendChild(document.createTextNode(para.textContent));
        });
        desc.classList.add('clamp-description');

        const url = page.href;
        const readMoreButton = a(
          { class: 'button primary', href: url, target: '_self' },
          page.title || 'Read More',
          span({ class: 'icon icon-right-arrow', 'data-icon-src': '/icons/right-arrow.svg', style: '--mask-image: url(/icons/right-arrow.svg);' }),
        );
        decorateButtons(readMoreButton);

        const contentDiv = document.createElement('div');
        contentDiv.appendChild(titleh3);
        contentDiv.appendChild(desc);
        contentDiv.appendChild(readMoreButton);

        cardBack.appendChild(contentDiv);

        backs.push(cardBack);
      }
    }
  });

  if (backs.length === 0) {
    backs = rows[1] ? [...rows[1].children] : [];
  }

  // Append backs directly to the block
  backs.forEach((back, index) => {
    if (index >= 4) return; // Limit to 4 cards
    const wrapper = document.createElement('div');
    wrapper.classList.add('wrapper');
    block.appendChild(wrapper);
    wrapper.appendChild(back);
  });

  // cleanup
  rows[0].remove();
  if (rows[1]) {
    rows[1].remove();
  }
  if (rows[2]) {
    rows[2].remove();
  }
}
