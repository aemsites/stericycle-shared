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

const createEyebrowWrapper = (container) => {
  if (container.querySelector('.eyebrow-wrapper')) return;
  const eyebrowDiv = document.createElement('div');
  eyebrowDiv.classList.add('eyebrow-wrapper');
  const eyebrow = container.querySelector('.eyebrow');
  if (eyebrow) {
    eyebrowDiv.appendChild(eyebrow);
  }
  container.insertBefore(eyebrowDiv, container.firstChild);
};

const handleEyebrows = (wrapper) => {
  const eyebrows = wrapper.querySelectorAll('.eyebrow');
  if (!eyebrows.length) return;
  const containers = wrapper.querySelectorAll('div.wrapper > div > div:nth-child(2)');
  containers.forEach(createEyebrowWrapper);
};

const adjustIfPresent = (elements) => {
  if (elements.length > 0) {
    adjustElementHeights(elements);
  }
};

// eslint-disable-next-line import/prefer-default-export
export const adjustHeightsOnResize = () => {
  requestAnimationFrame(() => {
    const wrappers = document.querySelectorAll('.flip-cards.block');
    wrappers.forEach((wrapper) => {
      handleEyebrows(wrapper);
      adjustIfPresent(wrapper.querySelectorAll('.clamp-description'));
      adjustIfPresent(wrapper.querySelectorAll('.clamp-title'));
      adjustIfPresent(wrapper.querySelectorAll('.eyebrow-wrapper'));
    });
  });
};

// Re-run on window resize (for responsiveness)
window.addEventListener('resize', adjustHeightsOnResize);
