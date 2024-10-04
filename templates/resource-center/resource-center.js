import { decorateSidebarTemplate } from '../templates.js';

export default function decorate(main) {
  // let isSideBar = false
  // eslint-disable-next-line no-restricted-syntax
  for (const child of main.children) {
    if (child.getAttribute('data-position')) {
      main.parentElement.classList.add('with-sidebar');
      decorateSidebarTemplate(main);
      break;
    }
  }
}
