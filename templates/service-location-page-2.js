/* eslint-disable object-curly-newline */
import { buildBlock, decorateBlock, decorateButtons, decorateIcons } from '../scripts/aem.js';

function addServiceCards(main) {
  const services = [
    { icon: 'sid-local-service-one-time-shredding-icon-b', title: '2- or 5-day One-Time Shredding ', description: 'With our Express and Priority services, we are committed to providing you the same high level of customer service and security – just faster, so we’re there when you need us.' },
    { icon: 'sid-local-service-mobile-onsite-icon-b', title: 'Mobile Shredding Service', description: 'Mobile shredding offers customers the same safe, end-to-end secure Chain of Custody as our off-site services while still at your location.' },
    { icon: 'sid-local-service-regularly-schedule-shredding-icon-b', title: 'Regularly Scheduled Paper Shredding', description: 'Protect your information end-toend using our secure containers paired with scheduled service.' },
    { icon: 'sid-local-service-hard-drive-icon-b', title: 'Hard Drive Destruction', description: 'Confidential information can be found on more than paper; Shred-it has solutions for harddrive and media destruction.' },
  ];

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
    button.href = '#'; // TODO: add action to open the get-a-quote form
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

  const cards = [[icon], [heading], [description], [buttonWrapper]];
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

function decorate(main) {
  const autoSection = document.createElement('div');
  autoSection.classList.add('section', 'gray-background');
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
  main.append(disclaimerSection);
}

export default decorate;
