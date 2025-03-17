const adjustElementHeights = (elements) => {
  let maxHeight = 0;
  elements.forEach((element) => {
    element.style.height = 'auto';
    maxHeight = Math.max(maxHeight, element.offsetHeight);
  });
  elements.forEach((element) => {
    element.style.height = `${maxHeight}px`;
  });
};

const adjustElements = (wrapper) => {
  const selectors = [
    '.offer-box:not(.big-icon) .offer-box-header > div:nth-child(1)',
    '.offer-box:not(.big-icon) .offer-box-header > div:nth-child(2)',
    '.offer-box-header .button-container',
    '.offer-box-header .head-copy',
    '.offer-box.plain-simple > div:nth-child(2) > div:nth-child(1):not(:has(hr))',
    '.offer-box.plain-simple > div:nth-child(2) > div:nth-child(2)',
    '.offer-box.plain-simple > div:nth-child(2) > div:nth-child(3)',
    '.offer-box.plain-simple > div:nth-child(2) > div:nth-child(3) > p:nth-child(1)',
    '.offer-box.plain-simple > div:nth-child(2) > div:nth-child(3) > p:nth-child(2)',
    '.offer-box.plain-simple > div:nth-child(2) > div:nth-child(3) > ul',
    '.offer-box.plain-simple > div:nth-child(2) > div:nth-child(3) :is(h1, h2, h3, h4, h5, h6)',
    '.offer-box.plain-simple > div:nth-child(2) > div:nth-child(4)',
    '.offer-box.plain-simple > div:nth-child(2) > div:nth-child(5)',
    '.offer-box.big-icon .offer-box-header',
    '.offer-box.big-icon .head-copy',
    '.offer-box.big-icon > p:not(.button-container)',
    '.offer-box.alternate-1 > div > div:has(.button)',
    '.offer-box.alternate-1 > div:nth-child(4) > div > p',
    '.offer-box.alternate-2 > .offer-box-header > .icon-with-heading',
    '.offer-box.alternate-2 > .offer-box-header > .promotion-with-text',
    '.offer-box.alternate-2 > .offer-box-row:nth-child(1)',
    '.offer-box.alternate-2 > .offer-box-row:nth-child(2)',
    '.offer-box.alternate-2 > .offer-box-row:nth-child(3)',
    '.offer-box.alternate-2 > .offer-box-row:nth-child(4)',
    '.offer-box.alternate-2 > .offer-box-row:nth-child(5)',
    '.offer-box.alternate-3 > .head-copy',
    '.offer-box.alternate-3 > .offer-box-header',
  ];

  selectors.forEach((selector) => {
    const elements = wrapper.querySelectorAll(selector);
    if (elements?.length > 0) {
      adjustElementHeights(elements);
    }
  });
};

export const adjustHeightsOnResize = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      requestAnimationFrame(() => {
        const wrappers = document.querySelectorAll('.offer-box-wrapper');
        wrappers.forEach(adjustElements);
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  requestAnimationFrame(() => {
    const wrappers = document.querySelectorAll('.offer-box-wrapper');
    wrappers.forEach(adjustElements);
  });
};

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

// Re-run on window resize (for responsiveness)
window.addEventListener('resize', adjustHeightsOnResize);
