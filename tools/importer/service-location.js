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

function setMetadata(meta, document) {
  // check for hero element to determine template
  if (document.querySelector('div.pagehero')) {
    meta.template = 'service-location-page';
  } else {
    meta.template = 'service-location-page-2';
  }
}

function transformQuote(main) {
  main.querySelectorAll('div.cmp-experiencefragment--testimonial').forEach((quote) => {
    let content = quote.querySelector('H4').textContent;
    content = content.substring(2, content.length - 1); // remove quotes
    let author = quote.querySelector('P').textContent;
    author = author.substring(2, content.length); // remove dash
    const cells = [
      ['Quote'],
      [content],
      [author],
    ];
    const quoteBlock = WebImporter.DOMUtils.createTable(cells, document);
    quote.replaceWith(quoteBlock);
  });
}

function transformTeaserList(main) {
  main.querySelectorAll('div.teaserlist').forEach((teaserList) => {
    const cells = [
      ['Post Teaser List'],
      ['Type', 'Blogs'],
    ];
    const teaserListBlock = WebImporter.DOMUtils.createTable(cells, document);
    teaserList.replaceWith(teaserListBlock);
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
    setMetadata(meta, document);

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

    transformHero(main);
    transformQuote(main);
    transformTeaserList(main);

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
      .replace(/[^a-z0-9/]/gm, '-');
  },
};
