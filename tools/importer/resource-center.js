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
const req = new XMLHttpRequest();
let tags = {};
const baseDomain = 'https://main--shred-it--stericycle.aem.page';
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

function fixVideo(elm) {
  const video = elm.querySelector('iframe');
  if (video) {
    const vb = [['embed']];
    const anc = document.createElement('a');
    anc.href = video.src;
    anc.innerText = video.src;
    vb.push([anc]);
    const embedP = document.createElement('p');
    const embedTable = WebImporter.DOMUtils.createTable(vb, elm.ownerDocument);
    embedP.append(embedTable);
    video.replaceWith(embedP);
  }
}


/**
 * Converts the given URL to a valid format by replacing multiple consecutive hyphens
 * in the pathname with a single hyphen.
 * @param {Object} params - The parameters object.
 * @param {string} params.originalURL - The original URL to be validated and updated.
 * @returns {string} The updated URL with valid pathname.
 */
function updatetoValidUrl(params) {
  const url = new URL(params.originalURL);
  url.pathname = url.pathname.replace(/--+/g, '-');
  return url.toString();
}

function transformFAQ(main) {
  const faqs = main.querySelectorAll('#accordion > div.cmp-accordion__item');
  if (faqs && faqs.length > 0) {
    const cells = [['faq']];
    faqs.forEach((faq) => {
      const question = faq.querySelector('span.cmp-accordion__title').innerText;
      const answer = faq.querySelector('div.cmp-accordion__panel');
      fixVideo(answer);
      cells.push([question, answer]);
    });
    const faqTable = WebImporter.DOMUtils.createTable(cells, main.ownerDocument);
    const accordion = main.querySelector('#accordion');
    accordion.replaceWith(faqTable);
    main.append(hr(main.ownerDocument));
  }
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
  } else if (document.documentURI.includes('/resource-center/newsletters/')) {
    meta['media-type'] = 'newsletter';
  } else if (document.documentURI.includes('/resource-center/infographics/')) {
    meta['media-type'] = 'Infographic';
  }

  if (pubDate) {
    meta['publication-date'] = pubDate.innerHTML;
  }
  meta['twitter:title'] = meta.Title;
  if (meta.Description) {
    meta['twitter:description'] = meta.Description;
  }
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

const createSectionMetadataForListBullets = (main, document) => {
  const mainBlock = main.querySelector('div.col-lg-8.cmp-columnrow__item');
  if (mainBlock?.querySelector('ul')) {
    const sectionMetaCells = [
      ['Section Metadata'],
      ['Style', 'list-style-bullets'],
    ];
    const sectionMetadata = WebImporter.DOMUtils.createTable(sectionMetaCells, document);
    main.append(sectionMetadata);
  }
};

function transformDownloadBlock(main, document) {
  const downloadBlock = main.querySelector('div.col-lg-3.cmp-columnrow__item > div.pagesection > div.cmp-pagesection > div.aem-Grid')
    ? main.querySelector('div.col-lg-3.cmp-columnrow__item > div.pagesection > div.cmp-pagesection > div.aem-Grid')
    : main.querySelector('div.col-lg-3.cmp-columnrow__item div.pagesection > div.cmp-pagesection > div.aem-Grid');

  if (downloadBlock) {
    const cells = [['Download']];
    let title = '';
    if (downloadBlock.querySelector('h4')) {
      title = downloadBlock.querySelector('div.text > h4')
        ? downloadBlock.querySelector('div.text > h4').innerText
        : downloadBlock.querySelector('div.cmp-previeweddownload__title > h4').innerText;
    }
    cells.push(['title', title]);
    cells.push(['image', downloadBlock.querySelector('div.previeweddownload > div.cmp-previeweddownload > div.cmp-previeweddownload__image > a > img')]);
    const dlLink = downloadBlock.querySelector('div.previeweddownload > div.cmp-previeweddownload > div.cmp-previeweddownload__image > a');
    dlLink.classList.add('cmp-linkcalltoaction', 'btn', 'btn-primary');  // Add classes to the link. They are not present in the final converted md, da files.
    dlLink.innerHTML = dlLink.href.replace('http://localhost:3001', baseDomain);
    // cells.push(['download', dlLink.href.replace('http://localhost:3001', baseDomain)]);
    cells.push(['download', dlLink]);
    cells.push(['style', 'cmp-linkcalltoaction, btn, btn-primary']); // Add classes to the link. They are not present in the final converted md, da files.
    const dBlock = WebImporter.DOMUtils.createTable(cells, document);
    main.append(dBlock);
    const sectionMetaCells = [
      ['Section Metadata'],
      ['Position', 'Sidebar'],
    ];
    const sectionMetadata = WebImporter.DOMUtils.createTable(sectionMetaCells, document);
    main.append(sectionMetadata);
    main.append(hr(document));
  }
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
    params.validUrl = updatetoValidUrl(params);
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
    const sectionSideBarRightCells = [
      ['Sidebar Right'],
      ["style", "cmp-linkcalltoaction, btn, btn-primary"],
    ];
    const sectionSideBarRight = WebImporter.DOMUtils.createTable(sectionSideBarRightCells, document);
    main.append(sectionSideBarRight);
    transformDownloadBlock(main, document);
    transformFAQ(main);

    // attempt to remove non-content elements
    WebImporter.DOMUtils.remove(main, [
      'header',
      '.header',
      'nav',
      '.nav',
      'footer',
      '.footer',
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
    WebImporter.rules.adjustImageUrls(main, params.validUrl, params.validUrl);
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
