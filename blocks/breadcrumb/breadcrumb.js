import ffetch from '../../scripts/ffetch.js';
import { a, div, li, ol, span } from '../../scripts/dom-helpers.js';

export default async function decorate(block) {
  let { pathname } = new URL(window.location.href);
  const paths = {};

  while (pathname.lastIndexOf('/') > 0) {
    pathname = pathname.substring(0, pathname.lastIndexOf('/'));
    paths[pathname] = {};
  }

  const keys = Object.keys(paths).sort((l, r) => l.length - r.length);
  await ffetch('/query-index.json').filter((x) => {
    if (keys.includes(x.path)) {
      paths[x.path] = x;
      return true;
    }
    return false;
  }).all();

  const { title } = document;
  const bc = ol();

  keys.forEach((k) => {
    bc.append(li({ class: 'breadcrumb-item' }, a({ href: k, 'aria-label': paths[k].title }, paths[k].title)));
  });
  bc.append(li({ class: 'breadcrumb-item' }, span({ class: 'title-breadcrumb' }, title)));
  block.replaceChildren(bc);
}
