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

      // add button class to links in card sections
      document.querySelectorAll('.card-section p').forEach((p) => {
        const link = p.querySelector('a');
        if (link) {
          if (!p.classList.contains('button-container')) {
            p.classList.add('button-container');
          }
          if (!link.classList.contains('button')) {
            link.classList.add('button');
          }
          if (link.closest('strong')) {
            link.classList.add('primary');
          } else if (link.closest('em')) {
            link.classList.add('secondary');
          }
        }
      });

      if (cardSection) {
        if (cardSection.nextElementSibling) {
          rowsWithContentLeft = true;
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
