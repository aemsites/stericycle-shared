export default async function decorate(main) {
  const leftColumn = document.createElement('div');
  leftColumn.classList.add('main-content');
  const rightColumn = document.createElement('div');
  rightColumn.classList.add('related-content');
  // Create related content wrapper
  const rcWrapper = document.createElement('div');
  rcWrapper.classList.add('related-content-wrapper');

  const rcHeader = document.createElement('h4');
  rcHeader.classList.add('related-content-header');
  rcWrapper.append(rcHeader);
  const defaultContent = main.querySelector('div.section > div.default-content-wrapper');
  leftColumn.append(...defaultContent.childNodes);
  rightColumn.append(rcWrapper);
  defaultContent.prepend(rightColumn);
  defaultContent.prepend(leftColumn);
}
