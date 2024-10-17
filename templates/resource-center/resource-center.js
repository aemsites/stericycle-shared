import { decorateSidebarTemplate } from '../templates.js';

export default function decorate(main) {
  const childWithPosition = Array.from(main.children)
    .find((child) => child.getAttribute('data-position'));

  if (childWithPosition) {
    main.parentElement.classList.add('with-sidebar');
    decorateSidebarTemplate(main);
  }
}
