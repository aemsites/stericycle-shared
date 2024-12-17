import { fetchPlaceholders, getMetadata } from "../../scripts/aem.js";
import { getLocale } from "../../scripts/scripts.js";
import { loadFragment } from "../fragment/fragment.js";
import {
    addMenuFunctionality,
    buildCompanyLogo,
    buildCtasSection,
    generateMenuFromSection,
} from "./utils.js";

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
    const placeHolders = await fetchPlaceholders(`/${getLocale()}`);

    block.textContent = "";

    let locale = window.location.pathname.split("/")[1] || "en-us";
    locale = locale.match(/^[a-z]{2}-[a-z]{2}$/) ? locale : "en-us"; // default to us-en if no locale in path
    // load nav as fragment
    const navMeta = getMetadata("nav");
    const navPath = navMeta
        ? new URL(navMeta, window.location).pathname
        : `/${locale}/navigation`;
    const fragment = await loadFragment(navPath);

    // logo
    const logo = buildCompanyLogo();

    if (logo) {
        block.append(logo);
    }

    console.log("fragment", fragment);

    // Parsing
    const sectionElement = fragment.querySelector('[data-section="Sections"]');
    const navigationMenu = generateMenuFromSection(sectionElement);

    if (navigationMenu) {
        block.append(navigationMenu);
    }

    // Ctas
    const ctasSection = buildCtasSection(placeHolders);

    if (ctasSection) {
        block.append(ctasSection);
    }

    // Menu functionality
    addMenuFunctionality(block);
}
