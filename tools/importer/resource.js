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
const req = new XMLHttpRequest();
let tags = {};
const TAGS = {};
req.open('GET', '/tools/importer/shredit-meta.json', false);
req.send(null);
if (req.status === 200) {
  tags = JSON.parse(req.responseText);
}

tags.forEach((item) => {
  const path = getPath(item.Path);
  const tags = item.Tags.replaceAll(';', ',');
  TAGS[path] = tags;
});

function getPath(url) {
  const lastIndex = url.lastIndexOf('/');
  const path = url.substring(lastIndex + 1);
  return path;
}

function getLocaleFromUrl(doc) {
  const match = doc.documentURI.match(/\/([a-z]{2,}(?:-[a-z]{2,})*)\//g);
  return Object.hasOwn(match, 'length') && match.length >= 1 ? match[0].replaceAll('/', '') : null;
}

function sanitizeURL(url) {
  const newURL = baseDomain + url;

  return newURL;
}

function getDocumentMetadata(name, document) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...document.head.querySelectorAll(`meta[${attr}="${name}"]`)]
    .map((m) => m.content)
    .join(', ');
  return meta || '';
}

function getPublicationDate(main) {
  const date = main.querySelector('.cmp-calendarattributeprojection');
  if (date) {
    return date.innerText;
  }
  return '';
}

function transformButtonToAnchors(main) {
  let aLink = main.querySelector('a.page-teaser__link--wrapper') || main.querySelector('a.page-teaser__link');
  aLink = aLink.href;
  aLink = aLink.startsWith('http') ? new URL(aLink).pathname : aLink;
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
    ];
  tabs.querySelectorAll('li').forEach((item) => {
      const cellConts = [];
      document.querySelectorAll('[role="tabpanel"]').forEach((tabPanel) => {
        const images = tabPanel.querySelectorAll('.image img');
        const h3 = tabPanel.querySelectorAll('h3');
        const h2 = tabPanel.querySelectorAll('h2');
        const p = tabPanel.querySelectorAll('p');
        if(images){
          images.forEach((img) => cellConts.push([img]));
        }
        if(h3){
          h3.forEach((h) => cellConts.push([h]));
        }
        if(h2){
          h2.forEach((h) => cellConts.push([h]));
          ;
        }
        if(p){
          p.forEach((para) => cellConts.push([para]));
        }
      });
      cells.push([[item.innerText, cellConts]]);
    })
    const tabBlock = WebImporter.DOMUtils.createTable(cells, document);
    tabs.replaceWith(tabBlock);
  });
}

function getBackgroundImages(main) {
  const backgroundImages = main.querySelectorAll('.cmp-pagesectionwithbackgroundimage');
  const link = document.createElement('a');
  backgroundImages.forEach((img, idx, arr) => {
    const cells = [];
    if (img.style && img.style.backgroundImage.replace('url("', '').replace('")', '').endsWith('svg')) {
      const imgLink = `https://shredit.com${img.style.backgroundImage.replace('url("', '').replace('")', '')}`;
      link.setAttribute('href', imgLink);
      link.setAttribute('download', imgLink);
      if (imgLink !== 'https://shredit.com') {
        link.click();
      }
      if (img.classList.contains('cmp-pagesectionwithbackgroundimage--desktop')) {
        cells.push(['Background Image (desktop)']);
      } else {
        cells.push(['Background Image']);
      }

      const filteredImg = imgLink.split('/').slice(-1)[0].split('.')[0];
      cells.push([`:${filteredImg}:`]);
      const backgroundImgBlock = WebImporter.DOMUtils.createTable(cells, document);
      const pageSect = img.closest('.pagesectionwithbackgroundimage');
      pageSect.prepend(backgroundImgBlock);
      img.style = '';
    }
    console.log('debug');
  });
}

function transformColumns(main) {
  const h3Tags = main.getElementsByTagName('h3');
  const searchText = 'You may also like...';
  const recs = ['Explore More Posters', 'You may also like...', 'Explore More Assessments', 'Explore More Case Studies', 'Explore More Newsletters', 'Explore More Infographics', 'Explore More Info Sheets', 'Explore More Original Research', 'Explore More Podcasts', 'Explore More Topics', 'Explore More Videos', ''];

  Array.from(h3Tags).forEach((h3) => {
    if (recs.indexOf(h3.textContent) >= 0) {
      const parent = h3.closest('.pagesection');
      parent.remove();
    }
  });

  main.querySelectorAll('div.cmp-pagesection div.columnrow > div.row').forEach((column) => {
    console.log('Transforming columns');
    const cells = [
      ['Columns'],
    ];

    const row = [];
    const rows = column.querySelectorAll('div.cmp-columnrow__item:not(.flipcard)');
    if (rows.length > 1) {
      rows.forEach((item) => {
        const txtLength = item.lastChild.data.length;
        if (item.innerText !== '\n            \n\n    \n    \n        \n\n\n\n    \n    \n    \n\n\n    \n\n    \n\n\n        ') {
          row.push(item);
        }

        if (item.querySelector('div.modalformcalltoaction > a.cmp-modal-form-cta')) {
          cells[0] = ['Columns (cta)'];
        }
      });

      cells.push(row);
      column.after(document.createElement('hr'));
      try {
        const columnBlock = WebImporter.DOMUtils.createTable(cells, document);
        column.replaceWith(columnBlock);
      } catch (e) {
        console.log(e);
      }
    } else {
      rows.forEach((txtcont) => {
        const parent = txtcont.closest('.cmp-columnrow').closest('.pagesection');
        const { children } = txtcont;
        Array.from(children).forEach((child) => {
          parent.appendChild(child.cloneNode(true));
          child.remove();
        });
      });
    }
  });
}

function transformVids(main) {
  const vidEmbeds = main.querySelectorAll('.wistia_video_foam_dummy');
  vidEmbeds.forEach((embed) => {
    const embedHandle = embed.closest('.cmp-embed');
    const cells = [
      ['video'],
    ];
    const dataSource = embed.getAttribute('data-source-container-id').split('-')[1];
    cells.push([`https://fast.wistia.com/embed/medias/${dataSource}`]);
    const embedBlock = WebImporter.DOMUtils.createTable(cells, document);
    embedHandle.replaceWith(embedBlock);
  });
}

function transformFlipCardsUnderColumn(main) {
  const teaserlist = main.querySelectorAll('ul.cmp-teaserlist');

  teaserlist.forEach((tl, idx, arr) => {
    const pagesection = tl.closest('div.cmp-pagesection');
    const row = tl.closest('div.cmp-columnrow__item');
    const title = tl.parentNode.previousElementSibling;
    if (pagesection) {
      pagesection.parentNode.append(document.createElement('hr'));
      pagesection.parentNode.append(title.cloneNode(true));
      pagesection.parentNode.append(tl.cloneNode(true));
    }
    if (row && row.classList.length > 0) {
      row.classList.add('flipcard');
    }
    if (tl && title) {
      tl.remove();
      title.remove();
    }
  });
}

function gatherCardDetails(teaser, selectors) {
  const retObj = {};

  Object.keys(selectors).forEach((component) => {
    retObj.type = 'Cards';
    for (let i = 0; i < selectors[component].length; i++) {
      const selectedComp = teaser.querySelector(selectors[component][i]);
      if (selectedComp) {
        if (selectors[component][i] === 'div.page-teaser--desktop div.page-teaser__content.page-teaser__content--back p.page-teaser__desc') {
          retObj.type = 'Flip Cards';
        }
        retObj[component] = selectedComp;
        break;
      }
    }
  });

  return retObj;
}

function transformCards(main) {
  const h3Tags = main.getElementsByTagName('h3');
  const searchText = 'You may also like...';
  const recs = ['Explore More Posters', 'You may also like...', 'Explore More Assessments', 'Explore More Case Studies', 'Explore More Newsletters', 'Explore More Infographics', 'Explore More Info Sheets', 'Explore More Original Research', 'Explore More Podcasts', 'Explore More Topics', 'Explore More Videos', ''];

  Array.from(h3Tags).forEach((h3) => {
    if (recs.indexOf(h3.textContent) >= 0) {
      const parent = h3.closest('.pagesection');
      parent.remove();
    }
  });

  const extra = main.querySelectorAll('.cmp-pagesectionwithbackgroundimage.cmp-pagesectionwithbackgroundimage--has-background.cmp-pagesectionwithbackgroundimage--desktop');
  if (extra) {
    extra.forEach((ext) => {
      ext.remove();
    });
  }
  const extrasearch = main.querySelectorAll('.contentsearchresults');
  extrasearch.forEach((es) => {
    const nearestSection = es.closest('.cmp-pagesection');
    nearestSection.remove();
  });
  const teaserlists = main.querySelectorAll('ul.cmp-teaserlist');
  teaserlists.forEach((teaser, idx, arr) => {
    const imgEls = [];
    const titleEls = [];
    const linkEls = [];
    console.log('Transforming cards');
    let cells = [];
    let cardType = '';

    const teaserlistitems = teaser.querySelectorAll('.cmp-teaserlist__item');
    teaserlistitems.forEach((item) => {
      cells = [];
      const selectors = {
        img: ['img.page-teaser__img'],
        title: ['div.page-teaser--desktop div.page-teaser__content.page-teaser__content--back h6.page-teaser__title.page-teaser__title--back', '.page-teaser__content__title'],
        desc: ['div.page-teaser--desktop div.page-teaser__content.page-teaser__content--back p.page-teaser__desc', '.page-teaser__content__type'],
        link: ['div.page-teaser--desktop div.page-teaser__content.page-teaser__content--back a', '.page-teaser__content__link'],
      };
      transformButtonToAnchors(item);
      const {
        type, img, title, desc, link,
      } = gatherCardDetails(item, selectors);
      const link2 = baseDomain + new URL(link.href).pathname.toString();
      const titleh4 = document.createElement('h4').innerText = title.innerText;
      cardType = type;

      if (type === 'Flip Cards') {
        if (img && title) {
          imgEls.push([img, title]);
        }
        if (titleh4 && desc) {
          titleEls.push([titleh4, desc]);
        }
        if (link) {
          linkEls.push(link2);
        }
      } else {
        cells.push([type]);
        cells.push([img, titleh4, desc, link2]);
        const cardBlock = WebImporter.DOMUtils.createTable(cells, document);
        if (arr) {
          const parent = Object.hasOwn(arr[idx].closest('.teaserlist'), 'parentNode') ? arr[idx].closest('.teaserlist').parentNode : arr[idx].closest('.teaserlist');  :;
          const cardContainer = document.createElement('div');
          parent.appendChild(cardContainer);
          cardContainer.replaceWith(cardBlock);
        }
      }
    });
    if (cardType === 'Flip Cards') {
      cells.push([type]);
      cells.push(imgEls, titleEls, linkEls);
      const cardBlock = WebImporter.DOMUtils.createTable(cells, document);
      teaser.replaceWith(cardBlock);
    }
    // This provides a section split
    if (arr[idx]) {
      // arr[idx].parentNode.appendChild(document.createElement('hr'));
      arr[idx].remove();
    }
  });
}

function setMetadata(meta, document) {
  const url = new URL(document.documentURI).pathname;
  const path = getPath(url);
  meta.template = 'resource-center';
  meta['twitter:title'] = meta.Title;
  meta['twitter:description'] = meta.Description;
  meta['og:type'] = 'website';
  meta.locale = getLocaleFromUrl(document);
  meta['og:url'] = getDocumentMetadata('og:url', document);
  if (Object.hasOwn(TAGS, path) && TAGS[path] !== '') {
    meta.tags = TAGS[path];
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
      'div.col-lg-3.cmp-columnrow__item',
      'div#onetrust-consent-sdk',
      'div.related-content',
    ]);

    getBackgroundImages(main);
    transformTabs(main);
    transformFlipCardsUnderColumn(main);
    transformCards(main);
    transformColumns(main);
    transformVids(main);
    // getNestedColumns(main);

    const meta = WebImporter.Blocks.getMetadata(document);

    setMetadata(meta, document);

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
