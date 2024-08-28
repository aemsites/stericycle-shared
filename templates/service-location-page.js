import {
  buildBlock, decorateBlock, decorateButtons, decorateIcons,
} from '../scripts/aem.js';
import { decorateSidebarTemplate } from './templates.js';

/**
 * Builds service location template auto blocks and add them to the page.
 * @param {Element} main The container element
 */
function buildServiceLocationAutoBlocks(main) {
  const pageContent = main.querySelector('.page-content');
  const pageSidebar = main.querySelector('.page-sidebar');
  const lastContentSection = pageContent.querySelector('.section:last-of-type');

  // GET-A-QUOTE FORM
  const formSection = document.createElement('div');
  formSection.classList.add('section');
  const form = buildBlock('get-a-quote-form', { elems: [] });
  formSection.prepend(form);
  pageSidebar.prepend(formSection);
  decorateBlock(form);

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
    { icon: 'service-resedential-icon-w', href: '/en-us/secure-shredding-services/residential-shredding-services' },
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

async function decorate(main) {
  main.parentElement.classList.add('with-sidebar');
  await decorateSidebarTemplate(main);
  buildServiceLocationAutoBlocks(main);
}

export default decorate;
