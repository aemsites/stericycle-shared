import { div } from '../../scripts/dom-helpers.js';

export default async function decorate(main) {
  main.querySelectorAll('.sidebar-right-container, .sidebar-left-container').forEach((section) => {
    const sidebarBreak = section.querySelector('.sidebar-right-wrapper, .sidebar-left-wrapper');

    if (sidebarBreak) {
      const gridContainer = div({ class: 'grid-wrapper' });
      let gridColumn = div({ class: 'sidebar-left' });
      while (section.children.length > 0) {
        const child = section.children[0];
        if (child === sidebarBreak) {
          gridContainer.append(gridColumn);
          gridColumn = div({ class: 'sidebar-right' });
          child.remove();
        } else {
          gridColumn.append(child);
        }
      }
      gridContainer.append(gridColumn);
      section.replaceChildren(gridContainer);
    }
  });
}
