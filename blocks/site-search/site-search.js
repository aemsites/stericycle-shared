import { fetchPlaceholders, readBlockConfig } from '../../scripts/aem.js';
import { buildPagination } from '../paginated-list/paginated-list.js';
import { getLocale } from "../../scripts/scripts.js";

const sessionKey = 'search-results';
const itemsPerPage = 10;
let currentPage = 1;

function buildSearchBar() {
    const searchbar = document.createElement('div');
    searchbar.classList.add('searchbar');
    const sbForm = document.createElement('form');
    searchbar.append(sbForm);
    const sbContainer = document.createElement('div');
    sbContainer.classList.add('search-container');
    sbForm.append(sbContainer);
    const sbInput = document.createElement('input');
    sbInput.type = 'text';
    sbInput.name = 'search';
    sbInput.id = 'search';
    sbInput.autocomplete = 'off';
    sbInput.placeholder = 'Search';
    sbContainer.append(sbInput);
    const sbSubmit = document.createElement('button');
    sbSubmit.type = 'submit';
    sbSubmit.setAttribute('aria-label', 'Search');
    const sbIcon = document.createElement('i');
    sbIcon.classList.add('fa-search');
    sbSubmit.append(sbIcon);
    sbContainer.append(sbSubmit);

    return searchbar;
}

async function buildSearchResult(sheet, ph) {
    const pagination = document.createElement('ul');

    const searchresults = document.createElement('div');
    searchresults.classList.add('searchresults');
    const searchresultsList = document.createElement('ul');
    searchresultsList.classList.add('search-results');

    await buildPagination(searchresultsList, pagination, sheet, currentPage, ph);
    searchresults.append(searchresultsList, pagination);

    return searchresults;
}

export default async function decorate(block) {
    const ph = await fetchPlaceholders(`/${getLocale()}`);
    const cfg = readBlockConfig(block);
    console.log(cfg.sheet);
    const siteSearch = document.createElement('div');
    siteSearch.classList.add('site-search');
    siteSearch.append(buildSearchBar(), await buildSearchResult(cfg.sheet, ph));

    block.replaceWith(siteSearch);
}
