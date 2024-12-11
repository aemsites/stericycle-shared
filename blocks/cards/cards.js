export default function decorate(block) {
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

        const link = cardSection.querySelector('a.button'); // Find <a> with class 'button'

        if (link && !link.classList.contains('primary')) {
          // Add the 'primary' class to the <a> element
          link.classList.add('primary');
        }

        // populate card
        cardSection.classList.add('card-section');
        cardBody.append(cardSection);

        if (isFirstSection) {
          // create card head
          if (cardSection.firstElementChild?.querySelector('span.icon')
           || cardSection.lastElementChild?.querySelector('p > picture > img')
           || (block.classList.contains('full-width')
            && cardSection.firstElementChild?.querySelector('img')
           )) {
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
