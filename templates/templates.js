// eslint-disable-next-line import/prefer-default-export
export async function decorateSidebarTemplate(main) {
  const bodyWrapper = document.createElement('div');
  bodyWrapper.classList.add('body-wrapper');
  main.append(bodyWrapper);

  const leftColumn = document.createElement('div');
  leftColumn.classList.add('page-content');
  const rightColumn = document.createElement('div');
  rightColumn.classList.add('page-sidebar');

  const sections = main.parentElement.querySelectorAll('main > div.section');
  sections.forEach((section) => {
    if (section.attributes.getNamedItem('data-position')?.value.toLowerCase() === 'sidebar') {
      rightColumn.append(section);
      section.attributes.removeNamedItem('data-position');
    } else if (!section.classList.contains('hero-container')) {
      leftColumn.append(section);
    }
  });

  bodyWrapper.append(leftColumn);
  bodyWrapper.append(rightColumn);
}
