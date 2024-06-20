export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`.flip-cards-${cols.length}-cols`);

  if (block.children.length === 0) {
    block.innerHTML = 'Malformed block structure. No content.';
    return;
  }

  const rows = [...block.children];
  const fronts = [...rows[0].children];
  const backs = rows[1] ? [...rows[1].children] : [];
  const links = rows[2] ? [...rows[2].children] : [];

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
