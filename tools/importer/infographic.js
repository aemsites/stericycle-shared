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
let tags = {};
const baseDomain = 'https://main--shredit--stericycle.aem.page';
const hr = (doc) => doc.createElement('hr');
const TAGS = {};
req.open('GET', '/tools/importer/shredit-meta.json', false);
req.send(null);
if (req.status === 200) {
  tags = JSON.parse(req.responseText);
}

function getPath(url) {
  const lastIndex = url.lastIndexOf('/');
  return url.substring(lastIndex + 1);
}

tags.forEach((item) => {
  const path = getPath(item.Path);
  TAGS[path] = item.Tags.replaceAll(';', ',');
});

function getDocumentMetadata(name, document) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...document.head.querySelectorAll(`meta[${attr}="${name}"]`)]
    .map((m) => m.content)
    .join(', ');
  return meta || '';
}

function getLocaleFromUrl(doc) {
  const match = doc.documentURI.match(/\/([a-z]{2,}(?:-[a-z]{2,})*)\//g);
  return Object.hasOwn(match, 'length') && match.length >= 1 ? match[0].replaceAll('/', '') : null;
}

function setMetadata(meta, document) {
  const url = new URL(document.documentURI).pathname;
  const path = getPath(url);
  const pubDate = document.querySelector('p.cmp-calendarattributeprojection');
  meta.template = 'resource-center';
  if (document.documentURI.includes('info-sheets')) {
    meta['media-type'] = 'Info Sheets';
  } else {
    meta['media-type'] = 'Infographic';
  }
  meta['media-type'] = 'Info Sheets'; // all pages should have a value for this
  meta['publication-date'] = pubDate.innerHTML;
  meta['twitter:title'] = meta.Title;
  meta['twitter:description'] = meta.Description;
  meta['og:type'] = 'website';
  meta.locale = getLocaleFromUrl(document);
  meta['og:url'] = getDocumentMetadata('og:url', document);
  if (Object.hasOwn(TAGS, path)) {
    meta.tags = TAGS[path];
  }
}

function fixDynamicMedia(main, document) {
  const dmImages = main.querySelectorAll('div[data-cmp-is="image"]');
  dmImages.forEach((img) => {
    const source = img.getAttribute('data-cmp-src').replace('&width={width}', '');
    const newImg = document.createElement('img');
    newImg.src = source;
    img.append(newImg);
  });
}

function transformDownloadBlock(main, document) {
  const downloadBlock = main.querySelector('div.col-lg-3.cmp-columnrow__item > div.pagesection > div.cmp-pagesection > div.aem-Grid') ? main.querySelector('div.col-lg-3.cmp-columnrow__item > div.pagesection > div.cmp-pagesection > div.aem-Grid') : main.querySelector('div.col-lg-3.cmp-columnrow__item div.pagesection > div.cmp-pagesection > div.aem-Grid');

  const cells = [['Download']];
  let title = '';
  if (downloadBlock.querySelector('h4')) {
    title = downloadBlock.querySelector('div.text > h4') ? downloadBlock.querySelector('div.text > h4').innerText : downloadBlock.querySelector('div.cmp-previeweddownload__title > h4').innerText;
  }
  cells.push(['title', title]);
  cells.push(['image', downloadBlock.querySelector('div.previeweddownload > div.cmp-previeweddownload > div.cmp-previeweddownload__image > a > img')]);
  const dlLink = downloadBlock.querySelector('div.previeweddownload > div.cmp-previeweddownload > div.cmp-previeweddownload__image > a');
  dlLink.innerHTML = dlLink.href.replace('http://localhost:3001', baseDomain);
  cells.push(['download', dlLink.href.replace('http://localhost:3001', baseDomain)]);
  const dBlock = WebImporter.DOMUtils.createTable(cells, document);
  main.append(dBlock);
  main.append(hr(document));
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
    results.push({
      element: main,
      // eslint-disable-next-line new-cap
      path: new URL(url).pathname,
    });

    main.querySelectorAll('a').forEach((a) => {
      const href = a.getAttribute('href');
      if (href && href.startsWith('/') && href.endsWith('.pdf')) {
        console.log('Found PDF link:', href);
        const u = new URL(href, url);
        const newPath = WebImporter.FileUtils.sanitizePath(u.pathname);
        // no "element", the "from" property is provided instead
        // importer will download the "from" resource as "path"
        results.push({
          path: newPath,
          from: u.toString(),
        });

        // update the link to new path on the target host
        // this is required to be able to follow the links in Word
        // you will need to replace "main--repo--owner" by your project setup
        const newHref = new URL(newPath, baseDomain).toString();
        a.setAttribute('href', newHref);
      }
    });

    WebImporter.DOMUtils.remove(document, [
      'script[src*="https://solutions.invocacdn.com/js/invoca-latest.min.js"]',
    ]);

    fixDynamicMedia(main, document);
    transformDownloadBlock(main, document);

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
      'div.col-lg-3.cmp-columnrow__item',
      'div#onetrust-consent-sdk',
      'div.pagesection.ss-border--box-shadow',
    ]);

    const meta = WebImporter.Blocks.getMetadata(document);
    setMetadata(meta, document);
    const mdb = WebImporter.Blocks.getMetadataBlock(document, meta);
    main.append(mdb);

    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    WebImporter.rules.convertIcons(main, document);

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
