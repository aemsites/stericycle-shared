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
const TAGS = {};
req.open('GET', '/tools/importer/metadata/en-us-shredit-meta.json', false);
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
  meta.template = 'blog-page';
  meta['media-type'] = 'Blogs'; // all pages should have a value for this
  meta['publication-date'] = pubDate.innerText;
  meta['twitter:title'] = meta.Title;
  meta['twitter:description'] = meta.Description;
  meta['og:type'] = 'website';
  meta.locale = getLocaleFromUrl(document);
  meta['og:url'] = getDocumentMetadata('og:url', document);
  if (Object.hasOwn(TAGS, path) && TAGS[path] !== '') {
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

function decodeAndReplace(str) {
  const replacements = {
    '%C3%A1': 'a',
    '%C3%A9': 'e',
    '%C3%AD': 'i',
    '%C3%B3': 'o',
    '%C3%BA': 'u',
    '%C3%B1': 'n',
  };
  let updatedStr = str;
  Object.entries(replacements).forEach(([encoded, plain]) => {
    const regex = new RegExp(encoded, 'g');
    updatedStr = updatedStr.replace(regex, plain);
  });
  return updatedStr;
}

/**
 * Updates the given URL by replacing consecutive hyphens in the pathname with a single hyphen,
 * and removes a trailing hyphen from the pathname if present.
 *
 * @param {string} originalURL - The original URL to be updated.
 * @returns {string} The updated, valid URL as a string.
 */
function updatetoValidUrl(originalURL) {
  const url = new URL(originalURL);
  url.pathname = url.pathname.replace(/--+/g, '-');
  url.pathname = url.pathname.endsWith('-')
    ? url.pathname.slice(0, -1)
    : url.pathname;
  return decodeAndReplace(url.toString());
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

    WebImporter.DOMUtils.remove(document, [
      'script[src*="https://solutions.invocacdn.com/js/invoca-latest.min.js"]',
    ]);

    fixDynamicMedia(main, document);

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
    ]);

    const meta = WebImporter.Blocks.getMetadata(document);

    setMetadata(meta, document);

    const mdb = WebImporter.Blocks.getMetadataBlock(document, meta);
    main.append(mdb);

    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, params.originalURL, params.originalURL);
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
    url = updatetoValidUrl(url);
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
