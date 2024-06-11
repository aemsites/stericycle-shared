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
const baseDomain = 'https://main--shredit--stericycle.aem.page';

function sanitizeURL(url) {
  const newURL = baseDomain + url;

  return newURL;
}

function transformButtonToAnchors(main) {
  const aLink = main.querySelector('a.page-teaser__link--wrapper').href;
  main.querySelectorAll('button.page-teaser__link').forEach((button) => {
    const a = document.createElement('a');
    a.href = sanitizeURL(aLink);
    a.textContent = button.textContent;
    a.setAttribute('aria-label', button.getAttribute('aria-label'));
    button.replaceWith(a);
  });
}

function transformTabs(main) {
  main.querySelectorAll('div.tabs.panelcontainer').forEach((tabs) => {
    const cells = [
      ['Tabs'],
      ['This will need to be manually transformed'],
    ];
    const tabBlock = WebImporter.DOMUtils.createTable(cells, document);
    tabs.replaceWith(tabBlock);
  });
}

function transformColumns(main) {
  main.querySelectorAll('div.cmp-pagesection div.columnrow > div.row').forEach((column) => {
    console.log('Transforming columns');
    const cells = [
      ['Columns'],
    ];

    const row = [];

    column.querySelectorAll('div.cmp-columnrow__item').forEach((item) => {
      row.push(item);

      if (item.querySelector('div.modalformcalltoaction > a.cmp-modal-form-cta')) {
        cells[0] = ['Columns (cta)'];
      }
    });

    cells.push(row);

    try {
      const columnBlock = WebImporter.DOMUtils.createTable(cells, document);
      column.replaceWith(columnBlock);
    } catch (e) {
      console.log(e);
    }
  });
}

function transformCards(main) {
  main.querySelectorAll('ul.cmp-teaserlist').forEach((teaser) => {
    console.log('Transforming cards');
    const cells = [
      ['Cards'],
    ];
    teaser.querySelectorAll('li').forEach((item) => {
      transformButtonToAnchors(item);
      const img = item.querySelector('img.page-teaser__img');
      const content = item.querySelector('div.page-teaser--desktop div.page-teaser__content.page-teaser__content--back');
      if (img) {
        cells.push([img, content]);
      }
    });
    const cardBlock = WebImporter.DOMUtils.createTable(cells, document);
    teaser.replaceWith(cardBlock);
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
    ]);

    transformTabs(main);
    transformCards(main);
    transformColumns(main);

    WebImporter.rules.createMetadata(main, document);
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
