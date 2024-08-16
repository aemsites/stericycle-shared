async function getHtml(url) {
  let html;
  const page = await fetch(url);
  if (page.ok) {
    html = await page.text();
  } else {
    html = '';
  }
  const retEl = document.createElement('div');
  retEl.innerHTML = html;
  return retEl;
}

function getDocumentMetadata(name, document) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...document.querySelectorAll(`meta[${attr}="${name}"]`)]
    .map((m) => m.content)
    .join(', ');
  return meta || '';
}

export default async function decorate(block) {
  const cols = [...block.firstElementChild.children];
  const rows = [...block.children];
  const fronts = [];
  const backs = [];
  const links = [];

  block.classList.add(`.flip-cards-${cols.length}-cols`);

  if (block.children.length === 0) {
    block.innerHTML = 'Malformed block structure. No content.';
    return;
  }

  const pages = block.querySelectorAll('a');
  const pageWorkQueue = [];
  pages.forEach((page) => pageWorkQueue.push(getHtml(page.href)));

  const doms = await Promise.all(pageWorkQueue);

  doms.forEach((dom, idx) => {
    const cardFront = document.createElement('div');
    const cardBack = document.createElement('div');
    const icon = rows[0].children.item(0);
    const titleh3 = document.createElement('h3');
    const titleh4 = document.createElement('h4');
    titleh3.innerText = getDocumentMetadata('og:title', dom);
    titleh4.innerText = titleh3.innerText;
    const desc = document.createElement('p');
    desc.innerText = getDocumentMetadata('og:description', dom);
    const link = pages[idx];

    if (icon && titleh3 && titleh4 && desc && link) {
      cardFront.appendChild(icon);
      cardFront.appendChild(titleh3);
      cardBack.appendChild(titleh4);
      cardBack.appendChild(desc);

      fronts.push(cardFront);
      backs.push(cardBack);
      links.push(link);
    }
  });

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
