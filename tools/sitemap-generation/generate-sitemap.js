/* eslint-disable no-await-in-loop */
import axios from 'axios';
import fs from 'fs/promises';
import { XMLBuilder } from 'fast-xml-parser';
import path from 'path';
import { DEFAULT_LOCALE, EDS_URL, MIGRATED_SITES, UNMIGRATED_SITES } from './index.js';

const validateLang = (lang) => {
  const allSites = [...UNMIGRATED_SITES, ...MIGRATED_SITES];
  return allSites.some((site) => site.lang === lang);
};

const hreflangMap = {};
const siteLocs = [];

const fetchQueryIndices = async () => {
  console.log('# Fetching query-indices...');
  await Promise.all(MIGRATED_SITES.map(async (site) => {
    const queryIndexUrl = `${EDS_URL}${site.lang.toLowerCase()}/query-index.json`;
    const response = await axios.get(queryIndexUrl);
    const json = response.data;

    siteLocs[site.lang] = [];
    json.data.forEach((row) => {
      const robots = row.robots || '';
      if (robots.includes('noindex') || robots.includes('drafts')) {
        return;
      }

      const primaryLang = row['primary-language-url'];

      if (site.lang === DEFAULT_LOCALE.lang) {
        const entry = {};
        entry[DEFAULT_LOCALE.lang] = row.path;
        hreflangMap[row.path] = entry;
      } else if (primaryLang && Object.prototype.hasOwnProperty.call(hreflangMap, primaryLang)) {
        hreflangMap[primaryLang][site.lang] = row.path;
      }

      siteLocs[site.lang].push(row);
    });
  }));
};

const loadHreflangMap = async () => {
  try {
    const filePath = path.join(process.cwd(), './hreflangs.map.json');
    const data = await fs.readFile(filePath, 'utf8');
    const externalHreflangMap = JSON.parse(data);
    Object.keys(externalHreflangMap).forEach((loc) => {
      if (!hreflangMap[loc]) {
        hreflangMap[loc] = {};
      }
      Object.keys(externalHreflangMap[loc]).forEach((lang) => {
        hreflangMap[loc][lang] = externalHreflangMap[loc][lang];
      });
    });
  } catch (error) {
    console.error('Failed to load hreflang map:', error);
  }
};

const buildNewSitemap = async () => {
  console.log('# Building new sitemap...');
  await Promise.all(MIGRATED_SITES.map(async (site) => {
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

      locs.forEach((row) => {
        const url = {
          loc: `${site.url}${row.path}`,
          lastmod: row.lastModified ? new Date(row.lastModified * 1000).toISOString().split('T')[0] : '',
        };

        let primaryLang = row['primary-language-url'] || '';
        if (site.lang === DEFAULT_LOCALE.lang) {
          primaryLang = row.path;
        }

        if (primaryLang && Object.prototype.hasOwnProperty.call(hreflangMap, primaryLang)) {
          url['xhtml:link'] = [];
          Object.keys(hreflangMap[primaryLang]).forEach((otherLang) => {
            if (validateLang(otherLang) && hreflangMap[primaryLang] && hreflangMap[primaryLang][otherLang]) {
              url['xhtml:link'].push({
                _rel: 'alternate',
                _hreflang: otherLang,
                _href: `${site.url}${hreflangMap[primaryLang][otherLang]}`,
              });
            }
          });

          url['xhtml:link'].push({
            _rel: 'alternate',
            _hreflang: 'x-default',
            _href: `${site.url}${hreflangMap[primaryLang][DEFAULT_LOCALE.lang]}`,
          });
        }

        sitemap.urlset.url.push(url);
      });

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
  }));
};

const main = async () => {
  await fetchQueryIndices();
  await loadHreflangMap();
  await buildNewSitemap();
};

main();
