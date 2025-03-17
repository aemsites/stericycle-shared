/* eslint-disable no-await-in-loop */
import axios from 'axios';
import fs from 'fs/promises';
import { XMLParser } from 'fast-xml-parser';
import path from 'path';
import { DEFAULT_LOCALE, UNMIGRATED_SITES } from './index.js';

const BATCH_SIZE = 100;
const DELAY = 5000;

const sitemaps = [];
const hreflangMap = {};

const fetchExternalSitemaps = async () => {
  console.log('# Fetching external sitemaps...');
  await Promise.all(UNMIGRATED_SITES.map(async (site) => {
    let xml;
    try {
      const response = await axios.get(site.sitemap);

      const parser = new XMLParser({
        ignoreAttributes: false,
        isArray: (name, jpath, isLeafNode, isAttribute) => jpath === 'urlset.url',
      });
      xml = parser.parse(response.data);
    } catch (error) {
      console.error(`  Error fetching or parsing the sitemap (${site.sitemap}):`, error.message);
      return;
    }

    sitemaps.push({
      url: site.sitemap,
      lang: site.lang,
      data: xml,
    });
  }));
  console.log(`  Fetched ${sitemaps.length} sitemaps!`);
};

const getHreflangEntry = async (url) => {
  try {
    const response = await axios.get(url, { timeout: 20000 });
    const html = response.data;

    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (!headMatch) {
      throw new Error('No <head> section found in the HTML.');
    }
    const headContent = headMatch[1];

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const parsedHead = parser.parse(`<head>${headContent}</head>`);

    let href = null;
    if (parsedHead.head && parsedHead.head.link) {
      const links = Array.isArray(parsedHead.head.link) ? parsedHead.head.link : [parsedHead.head.link];
      links.forEach((link) => {
        if (link.rel === 'alternate' && link.hreflang && link.hreflang === DEFAULT_LOCALE.lang && link.href) {
          href = link.href;
        }
      });
    }
    return href;
  } catch (error) {
    console.error(`  Error fetching or parsing the webpage (${url}):`, error.message);
    return null;
  }
};

const processBatchOfExternalPages = async (lang, batch) => {
  await Promise.allSettled(batch.map(async (row) => {
    if (!row.loc) {
      console.warn('Missing "loc" on sitemap entry');
      return;
    }
    let alternate = await getHreflangEntry(row.loc);
    if (!alternate && row['xhtml:link']) {
      row['xhtml:link'].forEach((link) => {
        if (link['@_hreflang'] === DEFAULT_LOCALE.lang) {
          alternate = link['@_href'];
        }
      });
    }
    if (alternate) {
      const alternatePath = new URL(alternate).pathname;
      if (!hreflangMap[alternatePath]) {
        hreflangMap[alternatePath] = {};
      }
      hreflangMap[alternatePath][lang] = new URL(row.loc).pathname;
    }
  }));
};

const processSitemaps = async () => {
  for (let sitemapIndex = 0; sitemapIndex < sitemaps.length; sitemapIndex += 1) {
    const sitemap = sitemaps[sitemapIndex];
    console.log(`- Traversing ${sitemap.url}`);
    const urls = sitemap.data.urlset.url;
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      console.log(`  Batch [${i + 1}-${(i + BATCH_SIZE) < urls.length ? i + BATCH_SIZE : urls.length}]`);
      const batch = urls.slice(i, i + BATCH_SIZE);
      await processBatchOfExternalPages(sitemap.lang, batch);
      if (i + BATCH_SIZE < urls.length) {
        await new Promise((resolve) => { setTimeout(resolve, DELAY); });
      }
    }
  }
};

const persistHreflangMap = async () => {
  console.log('# Saving hreflangs to file...');
  const filePath = path.join(process.cwd(), './hreflangs.map.json');
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(hreflangMap, null, 2));
  } catch (error) {
    console.error('Could not save file:', error);
  }
};

const main = async () => {
  await fetchExternalSitemaps();
  await processSitemaps();
  await persistHreflangMap();
};

main();
