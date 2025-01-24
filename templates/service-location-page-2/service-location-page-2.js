/* eslint-disable object-curly-newline */
import usStates from '../../blocks/service-location-map/us-states.js';
import { buildBlock, decorateBlock, decorateButtons, decorateIcons, fetchPlaceholders, getMetadata } from '../../scripts/aem.js';
import { a, div, h3, h4, iframe, li, p, strong, ul } from '../../scripts/dom-helpers.js';
import { addJsonLd, getLocale, getNearByLocations } from '../../scripts/scripts.js';

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
  const locDetailsDiv = div({ class: 'location-details' });

  const name = getMetadata('name');
  if (name) {
    locDetailsDiv.append(h3(`Shred-it ${name}`));
  }
  const addressLine1 = getMetadata('address-line-1');
  if (addressLine1) {
    locDetailsDiv.append(p(addressLine1));
  }

  const addressLine2 = getMetadata('address-line-2');
  if (addressLine2) {
    locDetailsDiv.append(p(addressLine2));
  }
  const city = getMetadata('city');
  if (city) {
    locDetailsDiv.append(p(city));
  }

  const state = getMetadata('state');
  if (state && usStates[state]) {
    locDetailsDiv.append(p(usStates[state]));
  }
  const zipCode = getMetadata('zip-code');
  if (zipCode) {
    locDetailsDiv.append(p(zipCode));
  }

  if (nearByLocations.length > 0) {
    const nearByDiv = div({ class: 'nearby-locations' });
    const tempStrong = strong(`${ph.nearbylocationstext || 'See our nearby locations'}:`);
    nearByDiv.append(p(tempStrong));
    const ulList = ul();

    nearByLocations.forEach((loc) => {
      const liElement = li();
      liElement.append(a({ href: loc.path }, loc.name));
      ulList.append(liElement);
    });

    nearByDiv.append(ulList);
    locDetailsDiv.append(nearByDiv);
  }

  const phoneDiv = div({ class: 'phone' });

  const customerNo = ph.customerserviceno || '800-697-4733'; // fallback number also added
  if (customerNo) {
    const tempStrong = strong(`${ph.customerservicetext || 'Customer Service'}:`);
    phoneDiv.append(
      div(p(tempStrong), a({ href: `tel:${customerNo}` }, customerNo)),
    );
  }

  const salesNo = ph.salesno || '844-618-7651'; // fallback number also added
  if (salesNo) {
    const tempStrong = strong(`${ph.salestext || 'Sales'}:`);
    phoneDiv.append(
      div(p(tempStrong), a({ href: `tel:${salesNo}` }, salesNo)),
    );
  }

  locDetailsDiv.append(phoneDiv);
  locationDiv.append(locDetailsDiv);

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
    const buyNowAnchor = a({ class: 'button primary', href: url, target: '_blank' }, ph.buynowtext || 'Buy Now');
    decorateButtons(buyNowAnchor);
    dropOffDiv.append(buyNowAnchor);
    locationDiv.append(dropOffDiv);
  }

  const addressParts = [
    'Shred-it',
    addressLine1,
    addressLine2,
    city,
    usStates[state],
    zipCode,
    getMetadata('country'),
  ].filter((part) => part !== null && part !== undefined);
  const query = encodeURIComponent(addressParts.join(', '));

  const mapDiv = div({ class: 'map' });
  const mapIframe = iframe({ src: `https://www.google.com/maps/embed/v1/place?q=${query}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8` });
  mapDiv.append(mapIframe);

  locationDiv.prepend(mapDiv);
  return locationDiv;
};

function addServiceCards(main) {
  /* eslint-disable max-len */
  const services = [
    { icon: 'sid-local-service-one-time-shredding-icon-b', title: '2- or 5-day One-Time Shredding ', description: 'With our Express and Priority services, we are committed to providing you the same high level of customer service and security – just faster, so we’re there when you need us.' },
    { icon: 'sid-local-service-mobile-onsite-icon-b', title: 'Mobile Shredding Service', description: 'Mobile shredding offers customers the same safe, end-to-end secure Chain of Custody as our off-site services while still at your location.' },
    { icon: 'sid-local-service-regularly-schedule-shredding-icon-b', title: 'Regularly Scheduled Paper Shredding', description: 'Protect your information end-toend using our secure containers paired with scheduled service.' },
    { icon: 'sid-local-service-hard-drive-icon-b', title: 'Hard Drive Destruction', description: 'Confidential information can be found on more than paper; Shred-it has solutions for harddrive and media destruction.' },
  ];
  /* eslint-enable max-len */

  // Populate card content
  const cards = [[], [], [], []];
  services.forEach((service) => {
    const icon = document.createElement('span');
    icon.classList.add('icon', `icon-${service.icon}`);
    cards[0].push(icon);
    const heading = document.createElement('H3');
    heading.textContent = service.title;
    cards[1].push(heading);
    const description = document.createElement('p');
    description.textContent = service.description;
    cards[2].push(description);
  });

  // Create cards block
  const cardsWrapper = document.createElement('div');
  const cardsBlock = buildBlock('cards', cards);
  cardsBlock.classList.add('divider', 'centered-headings', 'navy-headings');
  decorateIcons(cardsBlock);
  cardsWrapper.append(cardsBlock);
  main.append(cardsWrapper);

  // Add action buttons
  cardsBlock.querySelectorAll('p').forEach((description) => {
    const buttonWrapper = document.createElement('p');
    const buttonModifier = document.createElement('strong');
    const button = document.createElement('a');
    button.textContent = 'Get a Quote';
    button.ariaLabel = button.textContent;
    button.href = '/forms/modals/modal';
    buttonModifier.append(button);
    buttonWrapper.append(buttonModifier);
    description.parentElement.append(buttonWrapper);
  });
  decorateButtons(cardsBlock);

  decorateBlock(cardsBlock);
}

function addCtaCard(main) {
  const icon = document.createElement('span');
  icon.classList.add('icon', 'icon-service-ecommerce-icon-b-hp');
  const heading = document.createElement('H3');
  heading.textContent = 'Buy Your One-Time Shredding Online Now ';
  const description = document.createElement('p');
  description.textContent = 'A fast and easy option to purchase your One-Time Shredding service online and on your schedule. Get started immediately.';
  const buttonWrapper = document.createElement('p');
  const button = document.createElement('a');
  button.textContent = 'Buy Online Now';
  button.ariaLabel = button.textContent;
  button.href = 'https://shop-shredit.stericycle.com/commerce_storefront_ui/PurgeWizard.aspx';
  button.target = '_blank';
  buttonWrapper.append(button);

  const cards = [[icon], [heading], [{ elems: [description, buttonWrapper] }]];
  const cardsWrapper = document.createElement('div');
  const cardsBlock = buildBlock('cards', cards);
  cardsBlock.classList.add('full-width', 'navy-headings');
  decorateIcons(cardsBlock);
  decorateButtons(cardsBlock);
  cardsWrapper.append(cardsBlock);
  main.append(cardsWrapper);

  decorateBlock(cardsBlock);
}

function addInfoColumns(main) {
  const columnContent = [
    { heading: 'Service Reliability', body: 'With the largest shredding fleet  and the largest service footprint in North America, we are where you are.' },
    { heading: 'Security Expertise', body: 'With the most NAID AAA certified mobile/on-site and plant-based facilities, we keep your information safe.' },
    { heading: 'Customer Experience', body: 'With the highest customer satisfaction among all vendors, we are 100% committed to your protection and satisfaction.' },
  ];

  const headingWrapper = document.createElement('div');
  headingWrapper.classList.add('default-content-wrapper');
  const heading = document.createElement('H3');
  heading.textContent = 'Why Choose Shred-it for paper shredding?';
  headingWrapper.append(heading);
  main.append(headingWrapper);

  const columns = [];
  columnContent.forEach((content) => {
    const colHeading = document.createElement('H4');
    colHeading.textContent = content.heading;
    const colBody = document.createElement('p');
    colBody.textContent = content.body;
    columns.push({ elems: [colHeading, colBody] });
  });

  const columnsWrapper = document.createElement('div');
  const columnsBlock = buildBlock('columns', [columns]);
  decorateIcons(columnsBlock);
  decorateButtons(columnsBlock);
  columnsWrapper.append(columnsBlock);
  main.append(columnsWrapper);

  decorateBlock(columnsBlock);
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

async function decorate(main) {
  const autoSection = document.createElement('div');
  autoSection.classList.add('section', 'gray-background');
  autoSection.setAttribute('data-section-status', 'loading');
  autoSection.style.display = 'none';
  addServiceCards(autoSection);
  addCtaCard(autoSection);
  addInfoColumns(autoSection);
  const contentSection = document.querySelector('.section.with-image');
  if (contentSection) {
    contentSection.insertAdjacentElement('afterend', autoSection);
  } else {
    main.append(autoSection);
  }

  const disclaimerSection = document.createElement('div');
  disclaimerSection.classList.add('section', 'centered-text');
  const disclaimerWrapper = document.createElement('div');
  disclaimerWrapper.classList.add('default-content-wrapper');
  const disclaimer = document.createElement('p');
  disclaimer.textContent = 'All services come with a Certificate of Destruction and is NAID AAA certified. Material is securely recycled, reducing your carbon footprint.';
  disclaimerWrapper.append(disclaimer);
  disclaimerSection.append(disclaimerWrapper);

  const showLocations = getMetadata('show-locations');
  const isShowLocationsTrue = showLocations === 'true';
  if (isShowLocationsTrue) {
    const locationSection = div({ class: 'section' });
    const locDiv = await createLocDiv();
    locationSection.append(locDiv);
    main.append(locationSection);
  }

  main.append(disclaimerSection);

  addLocalBusinessJsonLd();
}

export default decorate;
