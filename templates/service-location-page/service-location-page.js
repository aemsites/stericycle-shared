import usStates from '../../blocks/service-location-map/us-states.js';
import {
  buildBlock, decorateBlock, decorateButtons,
  fetchPlaceholders,
  getMetadata,
} from '../../scripts/aem.js';
import {
  a, div, h3, h4, li, p,
  ul,
} from '../../scripts/dom-helpers.js';
import { addJsonLd, formatPhone, getLocale, getNearByLocations } from '../../scripts/scripts.js';
import { decorateSidebarTemplate } from '../templates.js';
import { createFormFromMetadata } from '../../blocks/form/utils.js';
import { loadFragment } from '../../blocks/fragment/fragment.js';

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

  const salesNo = ph.salesno || '8446187651'; // fallback number also added
  phoneDiv.append(
    div(a({ href: `tel:${salesNo}` }, formatPhone(salesNo)), p(` - ${ph.salestext || 'Sales'}`)),
  );

  const customerNo = ph.customerserviceno || '8006974733'; // fallback number also added
  phoneDiv.append(
    div(a({ href: `tel:${customerNo}` }, formatPhone(customerNo)), p(` - ${ph.customerservicetext || 'Customer Service'}`)),
  );

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
    // eslint-disable-next-line max-len
    const url = `https://shop-shredit.stericycle.com/commerce_storefront_ui/walkin.aspx?${zipCodeText}adobe_mc=MCMID%3D47228127826121584233605487843606294434%7CMCORGID%3DFB4A583F5FEDA3EA0A495EE3%2540AdobeOrg%7CTS%3D1729746363`;
    if (getLocale() === 'en-us') {
      const buyNowAnchor = a({ class: 'button primary', href: url, target: '_blank' }, ph.buynowtext || 'Buy Now');
      decorateButtons(buyNowAnchor);
      dropOffDiv.append(buyNowAnchor);
    }
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
  const form = createFormFromMetadata();
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

  if (getLocale() === 'en-us') {
    // QUOTE
    const quoteContent = [
      ['&ldquo;I like the set schedule of pick up dates the most. Drivers are always courteous and helpful.&rdquo;'],
      ['Riggs & Associates, CPAs, P.C.'],
    ];
    const quoteWrapper = document.createElement('div');
    const quote = buildBlock('quote', quoteContent);

    quote.classList.add('testimonial');
    quoteWrapper.append(quote);
    lastContentSection.append(quoteWrapper);

    const firstChild = quote.firstElementChild;
    const quoteChild = quote.lastElementChild;

    if (quoteChild) {
      quote.removeChild(quoteChild);
    }

    const authorWrapper = document.createElement('div');
    const author = document.createElement('p');

    authorWrapper.classList.add('quote-attribution', 'eyebrow-small');
    author.textContent = quoteChild.textContent;

    authorWrapper?.append(author);
    firstChild?.append(authorWrapper);

    decorateBlock(quote);

    // CTA
    const ctaWrapper = document.createElement('div');
    const ctaText = document.createElement('H4');
    ctaText.textContent = 'Buy your one-time shredding services online now';
    const cta = buildBlock('simple-cta', { elems: [ctaText] });

    cta.classList.add('slim');
    ctaWrapper.classList.add('blue-background', 'section');

    const ctaButtonWrapper = document.createElement('div');
    const ctaButtonModifier = document.createElement('strong');
    const ctaButton = document.createElement('a');
    ctaButton.textContent = 'Buy Online';
    // eslint-disable-next-line max-len
    ctaButton.href = 'https://shop-shredit.stericycle.com/commerce_storefront_ui/PurgeWizard.aspx?referrer_url=https://www.shredit.com/en-us/service-locations/greensboro&adobe_mc=MCMID%3D62149416262388660511472413641287259536%7CMCORGID%3DFB4A583F5FEDA3EA0A495EE3%2540AdobeOrg%7CTS%3D1724077192';
    ctaButtonModifier.append(ctaButton);
    ctaButtonWrapper.append(ctaButtonModifier);
    cta.querySelector('div').append(ctaButtonWrapper);
    ctaWrapper.append(cta);
    lastContentSection.append(ctaWrapper);
    decorateBlock(cta);
  }

  // SERVICES FLIP CARDS

  const flipCardFragment = await loadFragment(`/${getLocale()}/fragments/service-loc-flip-cards`);
  const flipCardsWrapper = document.createElement('div');
  flipCardsWrapper.append(flipCardFragment);
  lastContentSection.append(flipCardsWrapper);

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
  await buildServiceLocationAutoBlocks(main);
  addLocalBusinessJsonLd();
}
