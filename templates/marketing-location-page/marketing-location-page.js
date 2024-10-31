import usStates from '../../blocks/service-location-map/us-states.js';
import {
  buildBlock, decorateBlock,
  getMetadata,
} from '../../scripts/aem.js';
import { div, h3, p } from '../../scripts/dom-helpers.js';
import { decorateSidebarTemplate } from '../templates.js';

function buildMarketingPage(main) {
  const pageSidebar = main.querySelector('div.body-wrapper > div.page-sidebar');

  // GET-A-QUOTE FORM
  const formSection = document.createElement('div');
  formSection.classList.add('section');
  const formPath = getMetadata('form-path');
  const formStyleClass = getMetadata('form-style');
  const element = { elems: formPath ? [] : [`<a href="${formPath}"></a>`] };
  const form = buildBlock(formPath ? 'form' : 'get-a-quote-form', element);
  if (formPath && formStyleClass) {
    form.classList.add(formStyleClass);
  }
  const locationDiv = div({ class: 'location' });
  const name = getMetadata('name');
  if (name) {
    locationDiv.append(h3(`Shred-it ${name}`));
  }
  const addressLine1 = getMetadata('address-line-1');
  if (addressLine1) {
    locationDiv.append(p(addressLine1));
  }

  const addressLine2 = getMetadata('address-line-2');
  if (addressLine2) {
    locationDiv.append(p(addressLine2));
  }
  const city = getMetadata('city');
  if (city) {
    locationDiv.append(p(city));
  }

  const state = getMetadata('state');
  if (state && usStates[state]) {
    locationDiv.append(p(usStates[state]));
  }
  const zipCode = getMetadata('zip-code');
  if (zipCode) {
    locationDiv.append(p(zipCode));
  }

  formSection.append(locationDiv);

  pageSidebar.prepend(formSection);
  decorateBlock(form);
}

export default function decorate(main) {
  main.parentElement.classList.add('with-sidebar');
  decorateSidebarTemplate(main);
  buildMarketingPage(main);
}
