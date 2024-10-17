export default async function decorate(block) {
  const offerBox = document.createElement('div'); // creates the div we will append or replacewith
  const headers = document.createElement('div');
  offerBox.classList.add('offer-box-container', ...block.classList); // adds classes
  headers.className = 'offer-box-header';

  const headerItems = block.querySelectorAll('div:first-of-type > div:first-of-type > p, div:first-of-type > div:first-of-type > h2, div:first-of-type > div:first-of-type > h3');

  if (block.classList.contains('alternate-2') || block.classList.contains('plain-simple')) {
    const firstItem = document.createElement('div');
    const thirdItem = document.createElement('div');
    let secondItem;

    firstItem.className = 'icon-with-heading';
    thirdItem.className = 'promotion-with-text';

    const iconFirst = headerItems[0].querySelectorAll('span');

    if (iconFirst.length === 1) {
      firstItem.append(iconFirst[0], headerItems[1]);
    } else {
      firstItem.append(headerItems[0], headerItems[1]);
    }

    if (headerItems.length === 5) {
      secondItem = document.createElement('div');
      secondItem.className = 'text-with-badge';
      secondItem.append(headerItems[2], headerItems[3]);
      thirdItem.append(secondItem, headerItems[4]);
    } else if (headerItems.length === 3) {
      thirdItem.append(headerItems[2]);
    }

    if (firstItem.innerHTML !== '') {
      headers.append(firstItem);
    }
    if (thirdItem.innerHTML !== '') {
      headers.append(thirdItem);
    }
  } else {
    headerItems.forEach((item) => {
      const hDiv = document.createElement('div');
      if (item.tagName === 'H2' || item.tagName === 'H3') {
        hDiv.append(item);
      } else {
        hDiv.innerHTML = item.innerHTML;
      }
      headers.appendChild(hDiv);
    });
  }

  if (block.classList.contains('alternate-2')) {
    offerBox.classList.add('alternate-2', ...block.classList);
    headers.className = 'offer-box-header';
    offerBox.appendChild(headers);

    const primaryDivs = block.querySelectorAll('div.block.offer-box.alternate-2 > div:not(div:first-of-type) > div');

    primaryDivs.forEach((div) => {
      const rowItems = document.createElement('div');
      rowItems.className = 'offer-box-row';
      const isList = div.querySelectorAll('li');
      if (div.children.length > 1 && isList.length >= 1) {
        const nestedList = div.querySelectorAll('li > ul:first-of-type > li:first-of-type');
        rowItems.append(div.children[0]);
        if (nestedList.length >= 1) {
          rowItems.append(div.children[0].children[0].children[0]);
        } else {
          rowItems.append(div.children[0]);
        }
      } else {
        rowItems.innerHTML = div.innerHTML;
      }
      offerBox.append(rowItems);
    });
    block.replaceWith(offerBox);
  } else if (block.classList.contains('plain-simple')) {
    const content = block.querySelectorAll('.block.offer-box.plain-simple div:last-of-type');
    const contentDiv = document.createElement('div');
    content.forEach((item) => {
      contentDiv.appendChild(item);
    });
    offerBox.append(headers, contentDiv);
    block.replaceWith(offerBox);
  } else if (block.classList.contains('alternate-1')) {
    headers.classList.add('offer-box-header');
    block.removeChild(block.firstElementChild);
    block.prepend(headers);

    const anchors = block.querySelectorAll('a');
    anchors.forEach((a) => {
      a.classList.add('button', 'primary');
    });
  } else {
    headers.classList.add('offer-box-header');
    offerBox.appendChild(headers);

    const headCopy = document.createElement('div');
    headCopy.classList.add('head-copy'); // why do we copy head
    headCopy.innerHTML = block.querySelector('div:nth-of-type(2) > div > p').innerHTML;
    const btnDiv = block.querySelector('div:nth-of-type(3) > div > p');
    btnDiv.classList.add('button-container');
    const hrDiv = document.createElement('div');
    const hr = document.createElement('hr');
    hrDiv.appendChild(hr);
    const btnA = btnDiv.querySelector('a');
    btnA.classList.add('button', 'primary');
    const listDiv = document.createElement('div');
    listDiv.classList.add('offer-box-list-container');

    listDiv.innerHTML = block.querySelector('div:nth-of-type(4) > div').innerHTML;

    offerBox.append(headCopy);
    if (block.classList.contains('big-icon')) {
      offerBox.append(hrDiv);
      offerBox.append(listDiv);
      offerBox.append(btnDiv);
    } else {
      offerBox.append(btnDiv);
      offerBox.append(hrDiv);
      offerBox.append(listDiv);
    }

    block.replaceWith(offerBox);
  }
}
