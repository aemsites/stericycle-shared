import {
  buildBlock, decorateBlock,
} from '../../scripts/aem.js';
import { decorateSidebarTemplate } from '../templates.js';

function BuildMarketingPage(main) {
  const pageSidebar = main.querySelector('div.body-wrapper > div.page-sidebar');

  // GET-A-QUOTE FORM
  const formSection = document.createElement('div');
  formSection.classList.add('section');
  const form = buildBlock('get-a-quote-form', { elems: [] });
  formSection.prepend(form);
  pageSidebar.prepend(formSection);
  decorateBlock(form);
}

export default function decorate(main) {
  main.parentElement.classList.add('with-sidebar');
  decorateSidebarTemplate(main);
  BuildMarketingPage(main);
}
