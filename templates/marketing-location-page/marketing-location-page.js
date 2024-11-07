import usStates from '../../blocks/service-location-map/us-states.js';
import {
  buildBlock, decorateBlock,
  getMetadata,
  loadBlocks,
} from '../../scripts/aem.js';
import { div, h3, p } from '../../scripts/dom-helpers.js';
import { decorateSidebarTemplate } from '../templates.js';
import { addJsonLd } from '../../scripts/scripts.js';

function buildMarketingPage(main) {
  const hasHardDriveBackground = main.querySelector('.hard-drive-background');
  const hasShreddedPaperBackground = main.querySelector('.shredded-paper-background-column');
  let pageSidebar;

  if (hasHardDriveBackground || hasShreddedPaperBackground) {
    const bodyWrapper = main.querySelector('div.body-wrapper');
    const templateContainer = document.createElement('div');
    templateContainer.classList.add('template-container');

    templateContainer.append(bodyWrapper.cloneNode(true));
    bodyWrapper.replaceWith(templateContainer);
    pageSidebar = main.querySelector('div.template-container > div.body-wrapper > div.page-sidebar');
  } else {
    pageSidebar = main.querySelector('div.body-wrapper > div.page-sidebar');
  }

  // GET-A-QUOTE FORM
  const formSection = document.createElement('div');
  formSection.classList.add('section');
  formSection.dataset.sectionStatus = 'initialized';
  formSection.style.display = 'none';
  const formPath = getMetadata('form-path');
  const formStyleClass = getMetadata('form-style');
  const element = { elems: !formPath ? [] : [`<a href="${formPath}"></a>`] };
  const form = buildBlock(formPath ? 'form' : 'get-a-quote-form', element);
  if (formPath && formStyleClass) {
    const classes = formStyleClass.split(',').map((cls) => cls.trim());
    classes.forEach((cls) => form.classList.add(cls));
  }
  formSection.prepend(form);
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

async function addLocalBusinessJsonLd() {
  const schema = {
    image: '/content/dam/stericycle/global/icons/Stericycle-Logo-with-WPWM-Bigger.svg',
    logo: '/content/dam/stericycle/global/icons/Stericycle-Logo-with-WPWM-Bigger.svg',
    address: {
      addressCountry: getMetadata('country'),
      addressLocality: getMetadata('name'),
      addressRegion: getMetadata('state'),
      '@type': 'PostalAddress',
    },
    description: getMetadata('description'),
    url: window.location.href,
    name: getMetadata('og:title') || getMetadata('title') || 'Service Location',
    '@type': 'LocalBusiness',
    '@context': 'https://schema.org/',
  };

  // GeoCoordinates
  const latitude = parseFloat(getMetadata('latitude'));
  const longitude = parseFloat(getMetadata('longitude'));
  if (latitude && longitude
    && !Number.isNaN(latitude) && !Number.isNaN(longitude)
    && latitude !== 0.0 && longitude !== 0.0) {
    schema.geo = {
      latitude,
      longitude,
      '@type': 'GeoCoordinates',
    };
  }

  addJsonLd(schema, 'service-location');
}

export default async function decorate(main) {
  main.parentElement.classList.add('with-sidebar');
  decorateSidebarTemplate(main);
  buildMarketingPage(main);
  if (document.querySelector('body.with-sidebar')) {
    await loadBlocks(main.querySelector('div.page-content'));
    await loadBlocks(main.querySelector('div.page-sidebar'));
  }
  addLocalBusinessJsonLd();
}
