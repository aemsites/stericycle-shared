export const createListDiv = (block) => {
  const listDiv = document.createElement('div');
  listDiv.classList.add('offer-box-list-container');
  const description = block.querySelector('div > div > div > ul')?.closest('div')?.innerHTML;
  if (description) {
    listDiv.innerHTML = description;
  }
  return listDiv;
};

export const createHrDiv = () => {
  const hrDiv = document.createElement('div');
  const hr = document.createElement('hr');
  hrDiv.appendChild(hr);
  return hrDiv;
};
