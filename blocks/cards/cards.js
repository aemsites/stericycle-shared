export default function decorate(block) {

  block.querySelectorAll(':scope > div').forEach((card) => {
    const pic = card.querySelector('div > picture');
    const text = card.querySelector('div:last-of-type');
    if (text.querySelector('p')) {

    } else {
      p(text.childNodes);
    }

  });
  const cardList = document.createElement('ul');

  // populate cards
  let rowsWithContentLeft = true;
  while (rowsWithContentLeft) {
    rowsWithContentLeft = false;

    const card = document.createElement('li');
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    let isFirstSection = true;
    const rows = [...block.children];
    for (let i = 0; i < rows.length; i += 1) {
      const cardSection = rows[i].firstElementChild;
      if (cardSection) {
        if (cardSection.nextElementSibling) {
          rowsWithContentLeft = true;
        }

        // populate card
        cardSection.classList.add('card-section');
        cardBody.append(cardSection);

        if (isFirstSection) {
          // create card head
          if (cardSection.firstElementChild?.querySelector('span.icon')) {
            const cardHead = document.createElement('div');
            cardHead.classList.add('card-head');
            cardHead.append(cardSection);
            card.append(cardHead);
          } else {
            isFirstSection = false;
          }
        } else if (block.classList.contains('divider')) {
          // add divider
          const divider = document.createElement('hr');
          cardSection.insertAdjacentElement('beforebegin', divider);
        }
      }
    }
    card.append(cardBody);
    cardList.append(card);
  }

  block.textContent = '';
  block.append(cardList);
}
