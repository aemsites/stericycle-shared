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
const baseUrl = 'https://main--shredit--stericycle.aem.live';

import { getDocumentMetadata, getLocaleFromUrl } from './news.js';

function hero(main) {
  const hero = main.querySelector('.pagehero');
  if (hero) {
    hero.insertAdjacentElement('afterend', document.createElement('hr'));
  }
}

function transformIconList(section) {
  const iconList = section.querySelector('div.image > div.cmp-image');
  if (iconList && iconList.getAttribute('data-cmp-src').endsWith('.svg')) {
    console.log('icon list found');
    const cells = [['icon list']];

    const ils = section.querySelectorAll('.contentcontainer .aem-Grid div.columnrow');
    ils.forEach((il) => {
      const regex = /([^/]+)\.svg$/;
      const icon = il.querySelector('div.image > div.cmp-image');
      const iconText = icon.getAttribute('data-cmp-src').toLowerCase().match(regex)[1];
      const copy = il.querySelector('div.text');
      cells.push([`:${iconText}:`, copy]);
    });
    const ilBlock = WebImporter.DOMUtils.createTable(cells, document);
    section.replaceWith(ilBlock);
  }
}

function transformSimpleCTA(section) {
  console.log('found simple CTA');
  const cells = [['simple cta']];
  const cta = section.querySelectorAll('div.row.cmp-columnrow > .cmp-columnrow__item');
  const ctaArray = [];
  cta.forEach((c, idx) => {
    if (idx === 0) {
      ctaArray.push(c.querySelector('img'));
    } else if (idx === 1) {
      ctaArray.push(c.querySelector('div.contentcontainer'));
    }
  });

  cells.push(ctaArray);

  const sctaBlock = WebImporter.DOMUtils.createTable(cells, document);
  section.replaceWith(sctaBlock);
}

function transformFAQ(section) {
  console.log('found faq');
  const cells = [['faq']];
  const faqItems = section.querySelectorAll('.cmp-accordion__item');
  faqItems.forEach((f) => {
    const question = f.querySelector('h4.cmp-accordion__header');
    const answer = f.querySelector('div.cmp-accordion__panel');
    cells.push([question, answer]);
  });

  const faqBlock = WebImporter.DOMUtils.createTable(cells, document);
  section.replaceWith(faqBlock);
}

function transNumberList(section) {
  // this is just a columns block
  console.log('found column (numeric list)');
  const blk2replace = section.querySelector('div.columnrow');
  const cells = [['columns (numeric list)']];
  const columns = [];
  section.querySelectorAll('div.cmp-columnrow__item').forEach((item) => {
    columns.push(item);
  });
  cells.push(columns);

  const colBlock = WebImporter.DOMUtils.createTable(cells, document);
  blk2replace.replaceWith(colBlock);
}

function createFragment(section, fragmentPath) {
  const cells = [['fragment']];
  const anchor = document.createElement('a');
  anchor.href = `${baseUrl}${fragmentPath}`;
  anchor.textContent = `${baseUrl}${fragmentPath}`;
  cells.push([anchor]);
  const fragBlock = WebImporter.DOMUtils.createTable(cells, document);
  console.log(section.querySelector('div.cmp-pagesection > .aem-Grid'));
  section.querySelector('div.cmp-pagesection > .aem-Grid').replaceWith(fragBlock);
}

function processSections(main) {
  const sections = main.querySelectorAll('.contentcontainer div.contentcontainer div.pagesection');
  console.log(`number of sections: ${sections.length}`);

  sections.forEach((section) => {
    const content = section.querySelector('.contentcontainer');
    const colRow = section.querySelector('div.row.cmp-columnrow > div.cmp-columnrow__item ~ div.offset-lg-1.cmp-columnrow__item');
    const faq = section.querySelector('#accordion');
    const numList = section.querySelector('div.cmp-icon');
    const levelFragment = section.querySelector('h2');
    if (levelFragment && levelFragment.textContent.includes('Which Shred-it ProtectPLUS Service Level Best Suits Your Needs?')) {
      console.log(`found level fragment: ${levelFragment.textContent}`);
      createFragment(section, '/en-us/fragments/service-levels');
    }
    if (numList) {
      transNumberList(section);
    }

    if (faq) {
      transformFAQ(faq);
    }
    if (colRow) {
      transformSimpleCTA(section);
    }
    if (content) {
      const columnrow = content.querySelector('.columnrow');
      if (columnrow) {
        transformIconList(columnrow);
      }
    }

    section.insertAdjacentElement('afterend', document.createElement('hr'));
  });
}

function setMetadata(meta, document) {
  meta.nav = '/en-us/alt-0-nav';
  meta.footer = '/en-us/alt-0-footer';
  meta['twitter:title'] = meta['Title'];
  if (meta.Description){
    meta['twitter:description'] = meta.Description;
  }
  meta['og:type'] = 'website';
  meta.locale = getLocaleFromUrl(document);
  meta['og:url'] = getDocumentMetadata('og:url', document);
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
  transform: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    // define the main element: the one that will be transformed to Markdown
    const main = document.body;
    const results = [];

    // attempt to remove non-content elements
    WebImporter.DOMUtils.remove(main, [
      'header',
      '.header',
      'nav',
      '.nav',
      'footer',
      '.footer',
      'iframe',
      'div.pagesection.ss-border--box-shadow',
      'div#onetrust-consent-sdk',
      'div.cmp-experiencefragment--single-step-form',
      'div.cmp-experiencefragment--modal-form',
      'div.cmp-experiencefragment--footer',
      'div.experiencefragmentmodal',
      'a.cmp-image__link[href="/en-us"]',
    ]);

    const meta = WebImporter.Blocks.getMetadata(document);
    setMetadata(meta, document);
    const mdb = WebImporter.Blocks.getMetadataBlock(document, meta);
    main.append(mdb);

    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    WebImporter.rules.convertIcons(main, document);
    hero(main);
    processSections(main);

    const path = ((u) => {
      let p = new URL(u).pathname;
      if (p.endsWith('/')) {
        p = `${p}index`;
      }
      return decodeURIComponent(p)
        .toLowerCase()
        .replace(/\.html$/, '')
        .replace(/[^a-z0-9/]/gm, '-');
    })(url);

    results.push({
      element: main,
      path,
    });

    main.querySelectorAll('img').forEach((img) => {
      if (img && img.src.endsWith('.svg')) {
        const u = new URL(img.src, url);
        const sanPath = WebImporter.FileUtils.sanitizePath(u.pathname);
        const newPath = `/icons/${sanPath.match(/[^/]+$/)[0]}`;
        console.log(newPath);
        // no "element", the "from" property is provided instead
        // importer will download the "from" resource as "path"
        results.push({
          path: newPath,
          from: u.toString(),
        });
      }
    });

    return results;
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
