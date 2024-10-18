// eslint-disable-next-line import/prefer-default-export
export function decorateSidebarTemplate(main) {
  const bodyWrapper = document.createElement('div');
  bodyWrapper.classList.add('body-wrapper');

  const leftColumn = document.createElement('div');
  leftColumn.classList.add('page-content');
  const rightColumn = document.createElement('div');
  rightColumn.classList.add('page-sidebar');

  const sections = main.parentElement.querySelectorAll('main > div.section');
  const isSideBarLeft = [...sections].filter((section) => section.classList.contains('sidebar-left')).length > 0;
  if (isSideBarLeft) {
    // If we explicitly set section style to sidebar-left, we want to keep it on the left
    let matchingSection;
    sections.forEach((section) => {
      if (section.attributes.getNamedItem('data-position')?.value.toLowerCase() === 'sidebar') {
        rightColumn.append(section.cloneNode(true));
        section.attributes.removeNamedItem('data-position');
      } else if (!section.classList.contains('hero-container')
        && (!isSideBarLeft || section.classList.contains('sidebar-left'))) {
        leftColumn.append(section.cloneNode(true));
        if (!matchingSection) {
          matchingSection = section;
        } else {
          section.remove();
        }
      }
    });
    matchingSection?.replaceWith(bodyWrapper);
  } else {
    // This is to maintain the backward compatibility
    main.append(bodyWrapper);
    sections.forEach((section) => {
      if (section.attributes.getNamedItem('data-position')?.value.toLowerCase() === 'sidebar') {
        rightColumn.append(section);
        section.attributes.removeNamedItem('data-position');
      } else if (!section.classList.contains('hero-container')) {
        leftColumn.append(section);
      }
    });
  }

  bodyWrapper.append(leftColumn);
  bodyWrapper.append(rightColumn);
}
