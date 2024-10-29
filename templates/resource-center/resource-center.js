import { getMetadata } from '../../scripts/aem.js';
import { a, div } from '../../scripts/dom-helpers.js';
import ffetch from '../../scripts/ffetch.js';
import { decorateSidebarTemplate } from '../templates.js';

const buildBreadcrumbBlock = async (main) => {
  const breadcrumb = getMetadata('breadcrumb') || false;
  if (!breadcrumb) {
    return;
  }
  const url = new URL(window.location.href);
  let accumulatedPath = '';
  const pathMap = new Map();

  url?.pathname?.split('/')
    .filter((segment) => segment)
    .forEach((x, index) => {
      accumulatedPath += `/${x}`;
      if (index > 0 && index < url.pathname.split('/').length - 2) {
        pathMap.set(accumulatedPath, {});
      }
    });

  await ffetch('/query-index.json')
    .filter((x) => {
      if (pathMap.has(x.path)) {
        pathMap.set(x.path, x.title);
        return true;
      }
      return false;
    })
    .all();

  const { title } = document;
  const titleBreadcrumb = document.createElement('span');
  titleBreadcrumb.classList.add('title-breadcrumb');
  titleBreadcrumb.textContent = title;

  const breadcrumbElement = document.createElement('p');
  breadcrumbElement.classList.add('breadcrumb');

  pathMap.forEach((value, key) => {
    if (typeof value === 'object') {
      return;
    }
    const anchor = a({ href: key, 'aria-label': value }, value);
    breadcrumbElement.append(anchor);
  });

  breadcrumbElement.append(titleBreadcrumb);
  const breadcrumbWrapper = div({ class: 'breadcrumb-wrapper' }, breadcrumbElement);

  const newSection = div({ class: 'section' }, breadcrumbWrapper);
  main.prepend(newSection);
};

export default function decorate(main) {
  const childWithPosition = Array.from(main.children)
    .find((child) => child.getAttribute('data-position'));

  buildBreadcrumbBlock(main);
  if (childWithPosition) {
    main.parentElement.classList.add('with-sidebar');
    decorateSidebarTemplate(main);
  }
}
