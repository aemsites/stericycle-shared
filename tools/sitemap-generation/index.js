import axios from 'axios';
import fs from 'fs/promises';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import path from 'path';

const MIGRATED_SITES = [
  { lang: 'en-US', url: 'https://www.shredit.com', sitemap: 'https://www.shredit.com/en-us/sitemap.xml' }, // default must be first
];

const UNMIGRATED_SITES = [
  { lang: 'en-CA', url: 'https://www.shredit.com', sitemap: 'https://www.shredit.com/en-ca/sitemap.xml' },
  { lang: 'fr-CA', url: 'https://www.shredit.com', sitemap: 'https://www.shredit.com/fr-ca/sitemap.xml' },
  { lang: 'en-GB', url: 'https://www.shredit.co.uk', sitemap: 'https://www.shredit.co.uk/en-gb/sitemap.xml' },
  { lang: 'de-DE', url: 'https://www.shredit.de', sitemap: 'https://www.shredit.de/de-de/sitemap.xml' },
  { lang: 'en-IE', url: 'https://www.shredit.ie', sitemap: 'https://www.shredit.ie/en-ie/sitemap.xml' },
  { lang: 'pt-PT', url: 'https://www.shredit.pt', sitemap: 'https://www.shredit.pt/pt-pt/sitemap.xml' },
  { lang: 'en-NL', url: 'https://www.shredit.nl', sitemap: 'https://www.shredit.nl/en-nl/sitemap.xml' },
  { lang: 'nl-NL', url: 'https://www.shredit.nl', sitemap: 'https://www.shredit.nl/nl-nl/sitemap.xml' },
  { lang: 'nl-BE', url: 'https://www.shredit.be', sitemap: 'https://www.shredit.be/nl-be/sitemap.xml' },
  { lang: 'fr-BE', url: 'https://www.shredit.be', sitemap: 'https://www.shredit.be/fr-be/sitemap.xml' },
  { lang: 'en-BE', url: 'https://www.shredit.be', sitemap: 'https://www.shredit.be/en-be/sitemap.xml' },
  { lang: 'fr-FR', url: 'https://www.shredit.fr', sitemap: 'https://www.shredit.fr/fr-fr/sitemap.xml' },
  { lang: 'en-LU', url: 'https://www.shredit.lu', sitemap: 'https://www.shredit.lu/en-lu/sitemap.xml' },
  { lang: 'fr-LU', url: 'https://www.shredit.lu', sitemap: 'https://www.shredit.lu/fr-lu/sitemap.xml' },
  { lang: 'es-ES', url: 'https://www.shredit.es', sitemap: 'https://www.shredit.es/sitemap.xml' },
];

const EDS_URL = 'https://main--shredit--stericycle.aem.page/';
const DEFAULT_LOCALE = MIGRATED_SITES[0];

const validateLang = (lang) => {
  const allSites = [...UNMIGRATED_SITES, ...MIGRATED_SITES];
  return allSites.some((site) => site.lang === lang);
};

const hreflangMap = {};
const siteLocs = [];

const fetchQueryIndices = async () => {
  console.log('# Fetching query-indices...');
  for (const site of MIGRATED_SITES) {
    const queryIndexUrl = `${EDS_URL}${site.lang.toLowerCase()}/query-index.json`;
    const response = await axios.get(queryIndexUrl);
    const json = response.data;

    siteLocs[site.lang] = [];
    for (const row of json.data) {
      const robots = row.robots || '';
      if (robots.includes('noindex') || robots.includes('drafts')) {
        continue;
      }

      const primaryLang = row['primary-language-url'];

      if (site.lang === DEFAULT_LOCALE.lang) {
        const entry = {};
        entry[DEFAULT_LOCALE.lang] = row.path;
        hreflangMap[row.path] = entry;
      } else if (primaryLang && hreflangMap.hasOwnProperty(primaryLang)) {
        hreflangMap[primaryLang][site.lang] = row.path;
      }

      siteLocs[site.lang].push(row);
    }
  }
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

const fetchExternalSitemaps = async () => {
  console.log('# Fetching external sitemaps...');
  for (const site of UNMIGRATED_SITES) {
    console.log(`- Traversing ${site.sitemap}`);
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
    }

    if (xml) {
      console.log(`- Scraping ${xml.urlset.url.length} pages...`);
      await Promise.allSettled(xml.urlset.url.map(async (row) => {
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
            hreflangMap[alternatePath] = [];
          }
          hreflangMap[alternatePath][site.lang] = new URL(row.loc).pathname;
        }
      }));
    }
  }
};

const buildNewSitemap = async () => {
  console.log('# Building new sitemap...');
  for (const site of MIGRATED_SITES) {
    try {
      const sitemap = {
        urlset: {
          '_xmlns:xhtml': 'http://www.w3.org/1999/xhtml',
          _xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
          url: [],
        },
      };

      const sitemapPath = path.join(process.cwd(), `../../${site.lang.toLowerCase()}/sitemap.xml`);
      const locs = siteLocs[site.lang];

      for (const row of locs) {
        const url = {
          loc: `${site.url}${row.path}`,
          lastmod: row.lastModified ? new Date(row.lastModified * 1000).toISOString().split('T')[0] : '',
        };

        let primaryLang = row['primary-language-url'] || '';
        if (site.lang === DEFAULT_LOCALE.lang) {
          primaryLang = row.path;
        }

        if (primaryLang && hreflangMap.hasOwnProperty(primaryLang)) {
          url['xhtml:link'] = [];
          for (const otherLang of Object.keys(hreflangMap[primaryLang])) {
            if (otherLang !== site.lang && validateLang(otherLang) && hreflangMap[primaryLang] && hreflangMap[primaryLang][otherLang]) {
              url['xhtml:link'].push({
                _rel: 'alternate',
                _hreflang: otherLang,
                _href: `${site.url}${hreflangMap[primaryLang][otherLang]}`,
              });
            }
          }

          url['xhtml:link'].push({
            _rel: 'alternate',
            _hreflang: 'x-default',
            _href: `${site.url}${hreflangMap[primaryLang][DEFAULT_LOCALE.lang]}`,
          });
        }

        sitemap.urlset.url.push(url);
      }

      console.log('# Saving sitemap to file...');
      const builder = new XMLBuilder({
        attributeNamePrefix: '_',
        ignoreAttributes: false,
        format: true,
        suppressEmptyNode: true,
      });
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${builder.build(sitemap)}`;

      const dir = path.dirname(sitemapPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(sitemapPath, xml);
    } catch (error) {
      console.error(error);
    }
  }
};

const main = async () => {
  await fetchQueryIndices();
  await fetchExternalSitemaps();
  await buildNewSitemap();
};

main().catch(console.error);
