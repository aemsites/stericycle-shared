import { getMetadata } from "../../scripts/aem.js";
import {
    a,
    div,
    button,
    domEl,
    p,
    img,
    h3,
    input,
    form,
} from "../../scripts/dom-helpers.js";
import { formatPhone } from "../../scripts/scripts.js";

const FOCUSABLE_ELEMENTS =
    'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';

/**
 * Converts a section with hierarchical structure into a navigation menu.
 * @param {HTMLElement} sectionElement - The section containing the hierarchical structure.
 * @returns {HTMLElement} - The generated navigation menu element.
 */
export function generateMenuFromSection(sectionElement) {
    if (!sectionElement) {
        console.error("Section element not found.");
        return null;
    }

    const nav = document.createElement("nav");

    nav.role = "menu";
    nav.id = "nav";

    // Helper function to process top-level list items
    const processTopLevelItems = (listItems) => {
        Array.from(listItems).forEach((li) => {
            const navItem = document.createElement("div");
            navItem.className = "nav-item";
            navItem.setAttribute("aria-haspopup", "true");
            navItem.setAttribute("aria-expanded", "false");
            navItem.setAttribute("role", "menuitem");

            // Handle links, text, or other content for the nav item
            const link = li.querySelector("a");

            if (link) {
                const anchor = document.createElement("a");
                anchor.href = link.href;
                anchor.textContent = link.textContent.trim();
                anchor.className = "nav-link";
                navItem.appendChild(anchor);
            } else {
                // If no <a>, use the text content or first child element
                const fallbackContent = li.cloneNode(true); // Clone the <li> for non-link content
                const nestedList = fallbackContent.querySelector("ul"); // Find the nested list
                const itemWrapper = document.createElement("a");
                if (nestedList) {
                    fallbackContent.removeChild(nestedList); // Remove nested lists safely
                }
                fallbackContent.childNodes.forEach((child) => {
                    if (
                        child.nodeType === Node.ELEMENT_NODE ||
                        child.nodeType === Node.TEXT_NODE
                    ) {
                        itemWrapper.appendChild(child.cloneNode(true));
                        itemWrapper.href = "#";
                        itemWrapper.className = "nav-link";
                        navItem.appendChild(itemWrapper);
                    }
                });
            }

            const submenu = document.createElement("div");
            submenu.className = "submenu";
            submenu.setAttribute(
                "aria-label",
                `Submenu for ${
                    link ? link.textContent.trim() : "non-link item"
                }`
            );

            // Process nested lists only if they are direct children of the current `li`
            const nestedLists = li.querySelectorAll(":scope > ul");
            nestedLists.forEach((nestedList) => {
                const listWrapper = document.createElement("ul");
                listWrapper.className = "list";

                Array.from(nestedList.children).forEach((nestedLi) => {
                    const listItem = document.createElement("li");
                    listItem.className = "list-item";

                    // Handle different types of children (e.g., links, paragraphs, images)
                    Array.from(nestedLi.childNodes).forEach((child) => {
                        if (child.nodeType === Node.ELEMENT_NODE) {
                            listItem.appendChild(child.cloneNode(true));
                        } else if (
                            child.nodeType === Node.TEXT_NODE &&
                            child.textContent.trim()
                        ) {
                            const textWrapper = document.createElement("span");

                            // check if textContent includes custom selector #name and add class with that name
                            if (child.textContent.includes("#")) {
                                const className =
                                    child.textContent.match(/#(\w+)/)[1];

                                listItem.classList.add(className);

                                child.textContent =
                                    child.textContent.split("#")[0];
                            }

                            textWrapper.textContent = child.textContent.trim();
                            textWrapper.classList.add("nav-item-heading");
                            textWrapper.classList.add("eyebrow-small");

                            listItem.appendChild(textWrapper);
                        }
                    });

                    listWrapper.appendChild(listItem);
                });

                submenu.appendChild(listWrapper);
            });

            if (submenu.childElementCount > 0) {
                navItem.appendChild(submenu);
            }
            nav.appendChild(navItem);
        });
    };

    // Find the top-level list in the section
    const topLevelList = sectionElement.querySelector("ul");
    if (topLevelList) {
        processTopLevelItems(topLevelList.children);
    }

    return nav;
}

/**
 * Adds functionality to the navigation menu.
 * @param {HTMLElement} block - The navigation menu element.
 * @returns {void}
 */
export function addMenuFunctionality(block) {
    document.querySelectorAll(".nav-item").forEach((item) => {
        item.addEventListener("focusin", () => {
            item.classList.add("hover");
            item.setAttribute("aria-expanded", "true");
        });

        item.addEventListener("focusout", (e) => {
            if (!item.contains(e.relatedTarget)) {
                item.classList.remove("hover");
                item.setAttribute("aria-expanded", "false");
            }
        });

        item.addEventListener("mouseenter", () => {
            // remove focus from previous item tabbing except the current item
            const itemLink = item.querySelector(".nav-link");

            if (document.activeElement !== itemLink) {
                document.activeElement.blur();
            }

            item.classList.add("hover");
            item.setAttribute("aria-expanded", "true");
        });

        item.addEventListener("mouseleave", () => {
            item.classList.remove("hover");
            item.setAttribute("aria-expanded", "false");
        });

        const submenu = item.querySelector(".submenu");

        if (submenu) {
            submenu.addEventListener("mouseenter", () => {
                item.setAttribute("aria-expanded", "true");
                item.classList.add("hover");
            });

            submenu.addEventListener("mouseleave", () => {
                item.setAttribute("aria-expanded", "false");
                item.classList.remove("hover");
            });
        }

        item.addEventListener("keydown", (e) => {
            const submenuLinks = item.querySelectorAll(
                ".submenu a, .submenu button, .submenu [tabindex]:not([tabindex='-1'])"
            );

            switch (e.key) {
                case "Tab":
                    const shiftKey = e.shiftKey;
                    const nextNavItem = item.nextElementSibling;
                    const prevNavItem = item.previousElementSibling;

                    if (!shiftKey && nextNavItem) {
                        e.preventDefault();
                        (
                            nextNavItem.querySelector(FOCUSABLE_ELEMENTS) ||
                            nextNavItem
                        )?.focus();
                    } else if (!shiftKey && !nextNavItem) {
                        e.preventDefault();

                        const navbar = document.querySelector("#nav");
                        const nextSibling = navbar.nextElementSibling;
                        let nextFocusableElement = null;

                        if (nextSibling) {
                            nextFocusableElement =
                                nextSibling.querySelector(FOCUSABLE_ELEMENTS);
                        } else {
                            // get next focusable element in the document and ignore the nav
                            nextFocusableElement = document
                                .querySelector("main")
                                .querySelector(FOCUSABLE_ELEMENTS);
                        }

                        nextFocusableElement?.focus();
                    } else if (shiftKey && prevNavItem) {
                        e.preventDefault();
                        (
                            prevNavItem.querySelector(FOCUSABLE_ELEMENTS) ||
                            prevNavItem
                        )?.focus();
                    } else if (shiftKey && !prevNavItem) {
                        e.preventDefault();
                        const allFocusable = Array.from(
                            document.querySelectorAll(FOCUSABLE_ELEMENTS)
                        ).filter((el) => el.offsetParent !== null);
                        const currentIndex = allFocusable.indexOf(
                            document.activeElement
                        );
                        allFocusable[currentIndex - 1]?.focus();
                    } else {
                        // Allow natural tab behavior to continue
                        item.setAttribute("aria-expanded", "false");
                    }
                    break;

                case "ArrowRight":
                    e.preventDefault();
                    const currentIndexRight = Array.from(submenuLinks).indexOf(
                        document.activeElement
                    );
                    const nextIndexRight =
                        (currentIndexRight + 1) % submenuLinks.length;
                    submenuLinks[nextIndexRight]?.focus();
                    break;

                case "ArrowLeft":
                    e.preventDefault();
                    const currentIndexLeft = Array.from(submenuLinks).indexOf(
                        document.activeElement
                    );
                    const prevIndexLeft =
                        (currentIndexLeft - 1 + submenuLinks.length) %
                        submenuLinks.length;
                    submenuLinks[prevIndexLeft]?.focus();
                    break;
            }
        });
    });

    const hamburger = document.querySelector(".hamburger");
    const mobileNav = document.querySelector(".mobile-nav");

    if (hamburger) {
        hamburger.addEventListener("click", () => {
            mobileNav.style.display =
                mobileNav.style.display === "flex" ? "none" : "flex";
        });
    }

    document.querySelectorAll(".mobile-nav-toggle").forEach((toggle) => {
        toggle.addEventListener("click", (e) => {
            e.preventDefault();
            const submenu = toggle.nextElementSibling;
            submenu.classList.toggle("open");
        });
    });
}

/**
 * Function to build the company logo element.
 * @returns {HTMLElement} - The company logo element.
 */
export function buildCompanyLogo() {
    const logo = document.createElement("div");
    const logoLink = document.createElement("a");
    const logoImg = document.createElement("img");
    logoImg.src = "/icons/shredit-logo.svg";
    logoImg.alt = "Shredit Logo";

    logoLink.appendChild(logoImg);
    logo.appendChild(logoLink);

    logoLink.href = "/";
    logoLink.className = "logo-link";
    logoLink["aria-label"] = "Shredit Home";
    logo.className = "logo";

    return logo;
}

/**
 * Function to build the ctas section elements.
 * @param {Object} placeHolders - The placeholder values for the modals.
 * @param {Object} tools - The tools map for the extra header.
 * @param {Object} contact - The contact map for the contact modal.
 * @param {string} locale - The locale of the page.
 * @returns {HTMLElement} - The contact and search modals section.
 */
export function buildCtasSection(
    placeHolders = {},
    tools = {},
    contact = {},
    locale
) {
    const navModalPath = getMetadata("nav-modal-path") || "/forms/modals/modal";
    const contactModalButtonTitle = placeHolders.contactustext || "Contact Us";
    const searchModalButtonTitle = placeHolders.searchtext || "Search";

    const contactModalButton = button({
        class: "icon-button button contact-button",
        "aria-label": contactModalButtonTitle,
        id: "contact-btn",
    });

    const searchModalButton = button({
        class: "icon-button button search-button",
        "aria-label": searchModalButtonTitle,
        id: "search-btn",
    });

    const contactModal = div(
        { class: "submenu modal contact-modal", id: "contact-modal" },
        div(
            { class: "modal-content" },
            h3({ class: "modal-title eyebrow-small" }, contact?.title?.text),
            p({ class: "modal-subtitle" }, contact?.description?.text),
            div(
                { class: "contact" },
                img({
                    class: "contact-icon",
                    src: "/icons/phone-ringing-black.svg",
                }),
                div(
                    { class: "contact-info" },
                    p(
                        { class: "modal-title" },
                        contact?.customerservicelabel?.text
                    ),
                    a(
                        {
                            href: `tel:+1${contact?.customerserviceno?.text.trim()}`,
                            title: `${contact?.customerservicelabel?.text} number`,
                            "aria-label": `${contact?.customerservicelabel?.text} number`,
                        },
                        `${formatPhone(contact?.customerserviceno?.text, true)}`
                    )
                )
            ),
            div(
                { class: "contact" },
                img({
                    class: "contact-icon",
                    src: "/icons/phone-ringing-black.svg",
                }),
                div(
                    { class: "contact-info" },
                    p({ class: "modal-title" }, contact?.saleslabel?.text),
                    a(
                        {
                            href: `tel:+1${contact?.salesno?.text.trim()}`,
                            title: `${contact?.saleslabel?.text} number`,
                            "aria-label": `${contact?.saleslabel?.text} number`,
                        },
                        `${formatPhone(contact?.salesno?.text, true)}`
                    )
                )
            ),
            button(
                {
                    href: navModalPath,
                    class: "quote-button button primary",
                    "aria-label": contact?.cta?.text,
                },
                contact?.cta?.text || "Request a call back"
            )
        )
    );

    const searchModal = div(
        { class: "submenu search-modal", id: "search-modal" },
        div(
            { class: "modal-content" },

            form(
                {
                    class: "search-form",
                    action: `/${locale}/search`,
                    method: "get",
                    autocomplete: "off",
                },
                input({
                    type: "text",
                    placeholder: placeHolders.searchtext,
                    class: "search-input",
                    name: "searchQuery",
                }),
                button(
                    {
                        class: "close-button",
                        "arial-label": "Close search",
                        type: "button",
                    },
                    img({
                        class: "contact-icon",
                        src: "/icons/close.svg",
                    })
                )
            )
        )
    );

    const toolsCta = Object.keys(tools).map((tool) => {
        const { href, text } = tools[tool];
        const isLast = tool === Object.keys(tools).slice(-1)[0];

        return a(
            {
                href: isLast ? navModalPath : href,
                target: isLast ? "_self" : "_blank",
                class: `quote-button button ${
                    isLast ? "primary" : "secondary dark"
                }`,
                "aria-label": text,
            },
            text
        );
    });

    const ctasContainer = domEl(
        "div",
        { class: "ctas-container" },
        div({ class: "modal-actions" }, contactModalButton, searchModalButton),
        ...toolsCta,
        contactModal,
        searchModal
    );

    setupModal(contactModalButton, contactModal);
    setupModal(searchModalButton, searchModal);

    return ctasContainer;
}

/**
 * Reusable function to handle modal open/close logic.
 * @param {HTMLElement} triggerElement - The element that triggers the modal.
 * @param {HTMLElement} modalElement - The modal element to show/hide.
 */
function setupModal(triggerElement, modalElement) {
    const closeButton = modalElement.querySelector(".close-button");

    function openModal() {
        document.querySelectorAll(".submenu").forEach((submenu) => {
            if (submenu !== modalElement) {
                submenu.classList.remove("is-open");
                submenu.classList.remove("hover");
            }
        });

        modalElement.classList.add("is-open");

        trapFocus(modalElement);
    }

    function closeModal() {
        modalElement.classList.remove("is-open");
        triggerElement.focus();
    }

    modalElement.addEventListener("mouseenter", openModal);
    modalElement.addEventListener("mouseleave", closeModal);

    triggerElement.addEventListener("click", (e) => {
        e.stopPropagation();

        if (modalElement.classList.contains("is-open")) {
            closeModal();
            return;
        } else {
            openModal();
        }
    });

    if (closeButton) {
        closeButton.addEventListener("click", closeModal);
    }

    // close modal if clicked outside but not inside the modal or trigger
    document.addEventListener("click", (e) => {
        if (
            modalElement.classList.contains("is-open") &&
            !modalElement.contains(e.target) &&
            e.target !== triggerElement
        ) {
            closeModal();
        }
    });

    // close modal on escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modalElement.classList.contains("is-open")) {
            closeModal();
        }
    });

    /**
     * Function to trap focus inside a modal.
     * @param {HTMLElement} modal - The modal element.
     */
    function trapFocus(modal) {
        const focusableElements = modal.querySelectorAll(
            'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        // Move focus to the first focusable element
        firstFocusable?.focus();

        modal.addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
                if (e.shiftKey) {
                    // Shift + Tab: Move focus to the last element if on the first
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    // Tab: Move focus to the first element if on the last
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }

            // Escape key to close the modal
            if (e.key === "Escape") {
                closeModal();
            }
        });
    }
}
