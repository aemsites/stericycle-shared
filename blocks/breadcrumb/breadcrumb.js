import { a, li, ol, span } from '../../scripts/dom-helpers.js';
import { fetchQueryIndex } from '../../scripts/scripts.js';

export default async function decorate(block) {
  let { pathname } = new URL(window.location.href);
  const paths = {};

  while (pathname.lastIndexOf('/') > 0) {
    pathname = pathname.substring(0, pathname.lastIndexOf('/'));
    paths[pathname] = {};
  }

  let keys = Object.keys(paths).sort((l, r) => l.length - r.length);
  await fetchQueryIndex().filter((x) => {
    if (keys.includes(x.path)) {
      paths[x.path] = x;
      return true;
    }
    return false;
  }).all();

  const { title } = document;
  const bc = ol();

  keys = keys.slice((keys.length - 1), keys.length);
  keys.forEach((k) => {
    bc.append(li({ class: 'breadcrumb-item' }, a({ href: k, 'aria-label': paths[k].title }, paths[k].title)));
  });
  bc.append(li({ class: 'breadcrumb-item' }, span({ class: 'title-breadcrumb' }, title)));
  block.replaceChildren(bc);
}
