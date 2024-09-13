/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */

const req = new XMLHttpRequest();
let locationMeta = {};
req.open('GET', '/tools/importer/service-location-data.json', false);
req.send(null);
if (req.status === 200) {
  locationMeta = JSON.parse(req.responseText);
}

const req2 = new XMLHttpRequest();
let states = {};
req2.open('GET', '/tools/importer/us-states.json', false);
req2.send(null);
if (req.status === 200) {
  states = JSON.parse(req2.responseText);
}

function setMetadata(meta, document, url) {
  meta.locale = 'en-us';
  meta['media-type'] = 'Service Location';

  // add location meta
  const {
    title, address1, address2, city, zipCode, state, longitude, latitude, openingHours,
    dropOffDetails, additionalCities, country,
  } = locationMeta[new URL(url).pathname];
  if (title) {
    meta.name = title;
  }
  if (address1) {
    meta['address-line-1'] = address1;
  }
  if (address2) {
    meta['address-line-2'] = address2;
  }
  if (city) {
    meta.city = city;
  }
  if (zipCode) {
    meta['zip-code'] = zipCode;
  }
  if (state && states[state]) {
    meta.state = states[state];
  }
  if (longitude) {
    meta.longitude = longitude;
  }
  if (latitude) {
    meta.latitude = latitude;
  }
  if (openingHours?.trim()) {
    const trimmedOpeningHours = openingHours.trim();
    const match = trimmedOpeningHours.match(/<p>(.*?)<\/p>/);
    if (match && match[1]) {
      const textBetweenPTags = match[1];
      meta['opening-hours'] = textBetweenPTags.trim();
    } else {
      meta['opening-hours'] = trimmedOpeningHours.trim();
    }
  }
  if (dropOffDetails?.trim()) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = dropOffDetails.trim();
    const pTags = tempDiv.querySelectorAll('p');
    const result = [];

    pTags.forEach((pTag) => {
      pTag.querySelectorAll('a').forEach((aTag) => aTag.remove());
      result.push(...pTag.innerHTML.split('<br>').map((line) => line.trim()).filter(Boolean));
    });

    if (result.length === 3) {
      const [firstResult, secondResult, thirdResult] = result;
      meta['appointment-date-time'] = firstResult;
      meta['appointment-policy'] = secondResult;
      meta['drop-off-info'] = thirdResult;
    } else if (result.length === 2) {
      const [firstResult, secondResult] = result;

      if (result[0].toLowerCase().includes('appointment')) {
        meta['appointment-policy'] = firstResult;
      } else {
        meta['appointment-date-time'] = firstResult;
      }
      meta['drop-off-info'] = secondResult;
    } else if (result.length === 1) {
      const [firstResult] = result;
      meta['drop-off-info'] = firstResult;
    }
  }
  if (additionalCities?.length) {
    meta['additional-cities'] = additionalCities.join(',');
  }
  if (country) {
    meta.country = country;
  }

  // check for hero element to determine template
  if (document.querySelector('div.pagehero')) {
    meta.template = 'service-location-page';
  } else {
    meta.template = 'service-location-page-2';
  }
}

function transformHero(main) {
  const hero = main.querySelector('div.pagehero');
  if (!hero) {
    return;
  }

  const divider = document.createElement('P');
  divider.textContent = '---';
  hero.insertAdjacentElement('afterend', divider);

  const sidebar = hero.querySelector('div.contentcontainer.position-absolute.w-100');
  sidebar.id = 'sidebar-marker';
  hero.parentElement.append(sidebar);
}

function transformQuote(main) {
  main.querySelectorAll('div.cmp-experiencefragment--testimonial').forEach((quote) => {
    // let content = quote.querySelector('H4').textContent;
    // content = content.substring(2, content.length - 1); // remove quotes
    // let author = quote.querySelector('P').textContent;
    // author = author.substring(2, content.length); // remove dash
    // const cells = [
    //   ['Quote'],
    //   [content],
    //   [author],
    // ];
    // const quoteBlock = WebImporter.DOMUtils.createTable(cells, document);
    // quote.replaceWith(quoteBlock);
    quote.remove();
  });
}

function transformSimpleCTA(main) {
  main.querySelectorAll('div.cmp-experiencefragment--purge-ecommerce-cta').forEach((cta) => {
    // const text = cta.querySelector('div.text > h4').textContent;
    // const action = cta.querySelector('div.linkcalltoaction > a');
    // const cells = [
    //   ['Simple CTA'],
    //   [text, action],
    // ];
    // const flipCardsBlock = WebImporter.DOMUtils.createTable(cells, document);
    // cta.replaceWith(flipCardsBlock);
    cta.remove();
  });
}

function transformFlipCards(main) {
  main.querySelectorAll('div.hoverstateteaserlist').forEach((flipCards) => {
    // const cells = [
    //   ['Flip Cards'],
    //   ['TBD'],
    // ];
    // const flipCardsBlock = WebImporter.DOMUtils.createTable(cells, document);
    // flipCards.replaceWith(flipCardsBlock);
    flipCards.remove();
  });
}

function transformTeaserList(main) {
  main.querySelectorAll('div.teaserlist').forEach((teaserList) => {
    // const cells = [
    //   ['Post Teaser List'],
    //   ['Type', 'Blogs'],
    // ];
    // const teaserListBlock = WebImporter.DOMUtils.createTable(cells, document);
    // teaserList.replaceWith(teaserListBlock);
    teaserList.remove();
  });
}

function transformColumns(main) {
  main.querySelectorAll('div.columnrow').forEach((row) => {
    if (row.querySelector('div.columnrow')) {
      return;
    }
    const columns = row.querySelectorAll('.col-lg > .ss-border-left--orange');
    if (columns.length === 0) {
      return;
    }

    const cells = [
      ['Columns (orange accent border)'],
      columns,
    ];
    const teaserListBlock = WebImporter.DOMUtils.createTable(cells, document);
    row.replaceWith(teaserListBlock);
  });
}

function transformHeadingsIntoSections(element, position) {
  element.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((heading) => {
    const divider = document.createElement('P');
    divider.textContent = '---';
    heading.insertAdjacentElement('beforebegin', divider);

    if (position != null) {
      const cells = [
        ['Section Metadata'],
        ['Position', position],
      ];
      const sectionMetadata = WebImporter.DOMUtils.createTable(cells, document);
      heading.insertAdjacentElement('beforebegin', sectionMetadata);
    }
  });
}

function transformSidebar(main) {
  // remove get-a-quote-block; this will get auto-blocked
  main.querySelector('#sidebar-marker > .cmp-container > div:first-of-type').remove();

  // turn sidebar items into sections
  main.querySelectorAll('#sidebar-marker > .cmp-container > div').forEach((sidebarItem) => {
    transformHeadingsIntoSections(sidebarItem, 'Sidebar');
  });
}

function transformCards(main) {
  // card rows
  main.querySelectorAll('div.columnrow.aem-GridColumn--default--12 > div.row.cmp-columnrow').forEach((cardsWrapper) => {
    const cards = cardsWrapper.querySelectorAll('div.cmp-columnrow__item > div.ss-border--box-shadow.ss-bg-color--white');
    if (cards.length < 1) {
      return;
    }

    // let cells = [];
    // let hasDividers = false;
    // cards.forEach((card) => {
    //   card.querySelectorAll('div.horizontalrule').forEach((hr) => {
    //     hasDividers = true;
    //     hr.remove();
    //   });
    // });
    // if (hasDividers) {
    //   cells = [['Cards (dividers)'], ...cells];
    // } else {
    //   cells = [['Cards'], ...cells];
    // }
    // const cardsBlock = WebImporter.DOMUtils.createTable(cells, document);
    // cardsWrapper.replaceWith(cardsBlock);
    cardsWrapper.remove();
  });

  // full-width cards
  main.querySelectorAll('div.aem-Grid--default--12 > div.ss-border--box-shadow.ss-bg-color--white').forEach((card) => {
    // const cells = [
    //   ['Cards (full width)'],
    // ];
    //
    // const cmpRow = card.querySelector('div.row.cmp-columnrow');
    // if (cmpRow) {
    //   Array.from(cmpRow.children).forEach((item) => cells.push([item]));
    // }
    //
    // const cardsBlock = WebImporter.DOMUtils.createTable(cells, document);
    // card.replaceWith(cardsBlock);
    card.remove();
  });
}

function transformFAQ(main) {
  // card rows
  main.querySelectorAll('div.accordion').forEach((accordion) => {
    const cells = [['FAQ']];
    accordion.querySelectorAll('div.cmp-accordion__item').forEach((item) => {
      const header = item.querySelector('h4.cmp-accordion__header')?.textContent || '';
      const body = item.querySelector('div.cmp-accordion__panel > .text')?.textContent || '';
      cells.push([header, body]);
    });

    const faqBlock = WebImporter.DOMUtils.createTable(cells, document);
    accordion.replaceWith(faqBlock);
  });
}

function transformSections(main) {
  let isFirstSection = true;
  main.querySelectorAll('div.pagesection').forEach((section) => {
    if (isFirstSection) {
      isFirstSection = false;
      return;
    }
    const divider = document.createElement('P');
    divider.textContent = '---';
    section.insertAdjacentElement('beforebegin', divider);

    if (section.classList.contains('ss-bg-color--gray')) {
      const cells = [
        ['Section Metadata'],
        ['Style', 'gray background'],
      ];
      const sectionMetadata = WebImporter.DOMUtils.createTable(cells, document);
      section.insertAdjacentElement('afterend', sectionMetadata);
    }
  });
}

function transformImageSection(main) {
  main.querySelectorAll('div.columnrow.aem-GridColumn--default--12').forEach((imageSection) => {
    const image = imageSection.querySelector('div.row.cmp-columnrow > div.col-lg-5.cmp-columnrow__item div.image');
    if (!image) {
      return;
    }

    const divider = document.createElement('P');
    divider.textContent = '---';
    imageSection.insertAdjacentElement('beforebegin', divider);

    const cells = [
      ['Section Metadata'],
      ['Style', 'with image'],
    ];
    const sectionMetadata = WebImporter.DOMUtils.createTable(cells, document);
    imageSection.insertAdjacentElement('afterend', sectionMetadata);
  });
}

function fixURLs(main) {
  main.querySelectorAll('a').forEach((anchor) => {
    if (!anchor.href) {
      return;
    }
    const url = new URL(anchor.href);
    if (url.hostname === 'localhost' && url.port === '3001') {
      url.protocol = 'https';
      url.hostname = 'main--shredit--stericycle.aem.page';
      url.port = 443;
    }
    url.pathname = url.pathname.replace('---', '-').replace('--', '-');
    anchor.href = url.href;
  });
}

export default {
  /**
     * Apply DOM operations to the provided document and return
     * the root element to be then transformed to Markdown.
     * @param {HTMLDocument} document The document
     * @param {string} url The url of the page imported
     * @param {string} html The raw html (the document is cleaned up during preprocessing)
     * @param {object} params Object containing some parameters given by the import process.
     * @returns {HTMLElement} The root element to be transformed
     */
  transformDOM: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    // define the main element: the one that will be transformed to Markdown
    const main = document.body;

    // set metadata
    const meta = WebImporter.Blocks.getMetadata(document);
    setMetadata(meta, document, url);

    // attempt to remove non-content elements
    WebImporter.DOMUtils.remove(main, [
      'header',
      '.header',
      'nav',
      '.nav',
      'footer',
      '.footer',
      'iframe',
      'noscript',
      'div.cmp-experiencefragment--footer-subscription-form',
      'div.cmp-experiencefragment--modal-form',
      'div.cmp-experiencefragment--footer',
      'div.cmp-experiencefragment--locations-form',
      'a.cmp-modal-form-cta',
      'div.cloudservice.monarch-cloudservice',
      'div.cloudservice.recaptcha-cloudservice',
      '#onetrust-consent-sdk',
      '#onetrust-pc-sdk',
      '#ot-sdk-btn-floating',
    ]);

    if (meta.template === 'service-location-page') {
      // transform blocks
      transformHero(main);
      transformSimpleCTA(main);
      transformQuote(main);
      transformFlipCards(main);
      transformTeaserList(main);
      transformColumns(main);

      // transform layout
      WebImporter.DOMUtils.remove(main, ['div.col-lg-3.d-md-none.cmp-columnrow__item']); // remove duplicate details
      transformSidebar(main);
    } else if (meta.template === 'service-location-page-2') {
      main.querySelector('div.pagesection.responsivegrid.ss-bg-color--gray.aem-GridColumn.aem-GridColumn--default--12').remove(); // remove auto-blocked section
      main.querySelector('.text.ss-font-size--small > p').remove(); // remove auto-blocked disclaimer;
      // transform layout
      transformFAQ(main);
      transformCards(main);
      transformSections(main);
      transformImageSection(main);
      transformColumns(main);
    }

    fixURLs(main);

    const mdb = WebImporter.Blocks.getMetadataBlock(document, meta);
    main.append(mdb);

    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    WebImporter.rules.convertIcons(main, document);

    return main;
  },

  /**
     * Return a path that describes the document being transformed (file name, nesting...).
     * The path is then used to create the corresponding Word document.
     * @param {HTMLDocument} document The document
     * @param {string} url The url of the page imported
     * @param {string} html The raw html (the document is cleaned up during preprocessing)
     * @param {object} params Object containing some parameters given by the import process.
     * @return {string} The path
     */
  generateDocumentPath: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    let p = new URL(url).pathname;
    if (p.endsWith('/')) {
      p = `${p}index`;
    }
    return decodeURIComponent(p)
      .toLowerCase()
      .replace(/\.html$/, '')
      .replace(/[^a-z0-9/]/gm, '-')
      .replace('---', '-')
      .replace('--', '-');
  },
};
