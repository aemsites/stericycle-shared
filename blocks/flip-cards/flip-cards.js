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
  const cols = [...block.firstElementChild.children];
  const rows = [...block.children];
  let fronts = [];
  let backs = [];
  let links = [];

  block.classList.add(`.flip-cards-${cols.length}-cols`);

  if (block.children.length === 0) {
    block.innerHTML = 'Malformed block structure. No content.';
    return;
  }

  const lookupTable = {};
  const pages = block.querySelectorAll('a');
  const queryIdx = (await getQueryIdx('/query-index.json')).data;

  queryIdx.forEach((item) => {
    if (Object.hasOwn(item, 'path') && Object.hasOwn(item, 'title') && Object.hasOwn(item, 'description')) {
      const { path, title, description } = item;
      lookupTable[path] = { title, description };
    }
  });

  pages.forEach((page, idx) => {
    const pagePath = new URL(page.href).pathname;
    const cardFront = document.createElement('div');
    const cardBack = document.createElement('div');
    const link = pages[idx];
    if (Object.hasOwn(lookupTable, pagePath)) {
      const cardDetails = lookupTable[pagePath];
      const icon = rows[0].children.item(0);
      const titleh3 = document.createElement('h3');
      const titleh4 = document.createElement('h4');
      titleh3.textContent = cardDetails.title;
      titleh4.textContent = cardDetails.title;
      const desc = document.createElement('p');
      desc.textContent = cardDetails.description;
      if (icon) {
        cardFront.appendChild(icon);
      }
      if (titleh3) {
        cardFront.appendChild(titleh3);
      }
      if (titleh4) {
        cardBack.appendChild(titleh4);
      }
      if (desc) {
        cardBack.appendChild(desc);
      }
    }
    fronts.push(cardFront);
    backs.push(cardBack);
    links.push(link);
  });

  if (fronts.length === 0 && backs.lengths === 0 && links.lengths === 0) {
    fronts = [...rows[0].children];
    backs = rows[1] ? [...rows[1].children] : [];
    links = rows[2] ? [...rows[2].children] : [];
  }

  // decorate backs
  backs.forEach((card) => {
    const paragraph = document.createElement('p');
    const readMore = document.createElement('span');
    readMore.classList.add('fake-link');
    readMore.textContent = 'Read More';
    paragraph.appendChild(readMore);
    card.appendChild(paragraph);
  });

  // create combined card
  fronts.forEach((front, i) => {
    // create link wrapper
    const anchor = document.createElement('a');
    block.appendChild(anchor);
    const wrapper = document.createElement('div');
    anchor.appendChild(wrapper);
    front.classList.add('flip-card-front');
    wrapper.appendChild(front);

    // add href
    if (links.length > i) {
      anchor.href = links[i].textContent;
    }

    // add backs
    if (backs.length <= i) {
      return;
    }
    const back = backs[i];
    back.classList.add('flip-card-back');
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
