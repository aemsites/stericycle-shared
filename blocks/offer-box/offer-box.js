export default async function decorate(block) {
  const offerBox = document.createElement('div');
  offerBox.classList.add('offer-box-container', ...block.classList);
  const headers = document.createElement('div');
  headers.classList.add('offer-box-header');
  offerBox.appendChild(headers);

  const headerItems = block.querySelectorAll('div:first-of-type > div:first-of-type > p, div:first-of-type > div:first-of-type > h2, div:first-of-type > div:first-of-type > h3');

  headerItems.forEach((item) => {
    const hDiv = document.createElement('div');
    if (item.tagName === 'H2' || item.tagName === 'H3') {
      hDiv.append(item);
    } else {
      hDiv.innerHTML = item.innerHTML;
    }
    headers.appendChild(hDiv);
  });

  const headCopy = document.createElement('div');
  headCopy.classList.add('head-copy');
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
