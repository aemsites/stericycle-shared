import usStates from '../../blocks/service-location-map/us-states.js';
import {
  buildBlock, decorateBlock, decorateButtons, decorateIcons,
  fetchPlaceholders,
  getMetadata,
} from '../../scripts/aem.js';
import {
  a, div, h3, h4, li, p,
  ul,
} from '../../scripts/dom-helpers.js';
import { getLocale, getNearByLocations } from '../../scripts/scripts.js';
import { decorateSidebarTemplate } from '../templates.js';

const createLocDiv = async () => {
  const ph = await fetchPlaceholders(`/${getLocale()}`);
  const latitude = getMetadata('latitude');
  const longitude = getMetadata('longitude');
  let nearByLocations = [];

  if (latitude && longitude) {
    nearByLocations = await getNearByLocations({
      latitude: parseFloat(getMetadata('latitude')),
      longitude: parseFloat(getMetadata('longitude')),
      name: getMetadata('name'),
    });
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

  const phoneDiv = div({ class: 'phone' });

  const salesNo = ph.salesno || '844-618-7651'; // fallback number also added
  if (salesNo) {
    phoneDiv.append(
      div(a({ href: `tel:${salesNo}` }, salesNo), p(` - ${ph.salestext || 'Sales'}`)),
    );
  }

  const customerNo = ph.customerserviceno || '800-697-4733'; // fallback number also added
  if (customerNo) {
    phoneDiv.append(
      div(a({ href: `tel:${customerNo}` }, customerNo), p(` - ${ph.customerservicetext || 'Customer Service'}`)),
    );
  }

  locationDiv.append(phoneDiv);

  const dropOffDiv = div({ class: 'drop-off' });
  const openingHours = getMetadata('opening-hours');
  const dropOffInfo = getMetadata('drop-off-info');

  if (openingHours || dropOffInfo) {
    dropOffDiv.append(h4(ph.securedropofftext || 'Secure Drop-off Service'));

    if (openingHours) {
      dropOffDiv.append(p(openingHours));
    }

    if (dropOffInfo) {
      dropOffDiv.append(p(dropOffInfo));
    }

    const zipCodeText = zipCode ? `zip=${zipCode}&` : '';
    const url = `https://shop-shredit.stericycle.com/commerce_storefront_ui/walkin.aspx?${zipCodeText}adobe_mc=MCMID%3D47228127826121584233605487843606294434%7CMCORGID%3DFB4A583F5FEDA3EA0A495EE3%2540AdobeOrg%7CTS%3D1729746363`;
    const buyNowAnchor = a({ class: 'button primary', href: url, target: '_blank' }, ph.buynowtext || 'Buy Now');
    decorateButtons(buyNowAnchor);
    dropOffDiv.append(buyNowAnchor);
    locationDiv.append(dropOffDiv);
  }

  if (nearByLocations.length > 0) {
    const nearByDiv = div({ class: 'nearby-locations' });
    nearByDiv.append(h4(`${ph.nearbylocationstext || 'See our nearby locations'}:`));
    const ulList = ul();
    nearByLocations.forEach((loc) => {
      const liElement = li();
      liElement.append(a({ href: loc.path }, loc.name));
      ulList.append(liElement);
    });

    nearByDiv.append(ulList);
    locationDiv.append(nearByDiv);
  }

  return locationDiv;
};

/**
 * Builds service location template auto blocks and add them to the page.
 * @param {Element} main The container element
 */
async function buildServiceLocationAutoBlocks(main) {
  const pageContent = main.querySelector('div.body-wrapper > div.page-content');
  let pageSidebar = main.querySelector('div.body-wrapper > div.page-sidebar');
  const lastContentSection = pageContent.querySelector('.section:last-of-type');

  if (!lastContentSection) {
    return;
  }
  // GET-A-QUOTE FORM
  const formSection = document.createElement('div');
  formSection.style.display = 'none';
  formSection.classList.add('section');
  const form = buildBlock('get-a-quote-form', { elems: [] });
  if (!pageSidebar) {
    pageSidebar = document.createElement('div');
  } else {
    // Setting Initial set data if any because both the forms
    // and location div are being added here only
    // [IMPORTANT] If forms are added from the doc then we need to modify this
    pageSidebar.innerHTML = '';
  }
  main.querySelector('div.body-wrapper').append(pageSidebar);

  formSection.prepend(form);
  pageSidebar.prepend(formSection);
  const locDiv = await createLocDiv();
  formSection.append(locDiv);
  decorateBlock(form);

  // QUOTE
  const quoteContent = [
    ['I like the set schedule of pick up dates the most. Drivers are always courteous and helpful.'],
    ['Riggs & Associates, CPAs, P.C.'],
  ];
  const quoteWrapper = document.createElement('div');
  const quote = buildBlock('quote', quoteContent);
  quoteWrapper.append(quote);
  lastContentSection.append(quoteWrapper);
  decorateBlock(quote);

  // CTA
  const ctaWrapper = document.createElement('div');
  const ctaText = document.createElement('H4');
  ctaText.textContent = 'Buy your one-time shredding services online now';
  const cta = buildBlock('simple-cta', { elems: [ctaText] });
  const ctaButtonWrapper = document.createElement('div');
  const ctaButton = document.createElement('a');
  ctaButton.textContent = 'Buy Online';
  ctaButton.href = 'https://shop-shredit.stericycle.com/commerce_storefront_ui/PurgeWizard.aspx?referrer_url=https://www.shredit.com/en-us/service-locations/greensboro&adobe_mc=MCMID%3D62149416262388660511472413641287259536%7CMCORGID%3DFB4A583F5FEDA3EA0A495EE3%2540AdobeOrg%7CTS%3D1724077192';
  ctaButtonWrapper.append(ctaButton);
  decorateButtons(ctaButtonWrapper);
  cta.querySelector('div').append(ctaButtonWrapper);
  ctaWrapper.append(cta);
  lastContentSection.append(ctaWrapper);
  decorateBlock(cta);

  // SERVICES FLIP CARDS
  const flipCardPages = [
    { icon: 'service-one-time-shredding-icon-w', href: '/en-us/secure-shredding-services/one-off-shredding-service' },
    { icon: 'service-regularly-schedule-shredding-icon-w', href: '/en-us/secure-shredding-services/paper-shredding-services' },
    { icon: 'service-hard-drive-icon-w', href: '/en-us/secure-shredding-services/hard-drive-destruction' },
    { icon: 'service-residential-icon-w', href: '/en-us/secure-shredding-services/residential-shredding-services' },
  ];
  const flipCardsWrapper = document.createElement('div');
  const flipCardsIconRow = [];
  const flipCardsLinkRow = [];
  flipCardPages.forEach((page) => {
    const icon = document.createElement('span');
    icon.classList.add('icon', `icon-${page.icon}`);
    flipCardsIconRow.push(icon);
    const link = document.createElement('a');
    link.textContent = page.href;
    link.href = page.href;
    flipCardsLinkRow.push(link);
  });
  const flipCards = buildBlock('flip-cards', [flipCardsIconRow, flipCardsLinkRow]);
  decorateIcons(flipCards);
  flipCardsWrapper.append(flipCards);
  lastContentSection.append(flipCardsWrapper);
  decorateBlock(flipCards);

  // POST TEASER
  const teaserSection = document.createElement('div');
  const teaserConfig = [
    ['Type', 'All resources'],
    ['Columns', '3'],
  ];
  const teaser = buildBlock('post-teaser-list', teaserConfig);
  teaserSection.append(teaser);
  lastContentSection.append(teaserSection);
  decorateBlock(teaser);
}

export default async function decorate(main) {
  main.parentElement.classList.add('with-sidebar');
  decorateSidebarTemplate(main);
  await buildServiceLocationAutoBlocks(main);
}
