import { div } from '../../scripts/dom-helpers.js';

export default async function decorate(block) {
  const children = Array.from(block.children);
  const firstChild = block.firstElementChild;
  const lastChild = block.lastElementChild;

  const newDiv = div({ class: 'quotes' });
  const middleChildren = children.slice(1, -1);

  middleChildren.forEach((element) => {
    newDiv.appendChild(element);
    if (block.contains(element)) {
      block.removeChild(element);
    }
  });

  const wrapperDiv = div({ class: 'content' });

  if (firstChild) {
    firstChild.classList.add('heading');
    wrapperDiv.appendChild(firstChild);
  }
  wrapperDiv.appendChild(newDiv);

  if (lastChild) {
    const img = lastChild.querySelector('img');
    block.style.backgroundImage = `url(${img.src})`;
    block.removeChild(lastChild);
  }

  block.appendChild(wrapperDiv);
}
