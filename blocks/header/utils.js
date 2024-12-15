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

    // Create the navigation container
    const nav = document.createElement("nav");

    nav.id = "nav";

    // Helper function to process top-level list items
    const processTopLevelItems = (listItems) => {
        Array.from(listItems).forEach((li) => {
            const navItem = document.createElement("div");
            navItem.className = "nav-item";
            navItem.setAttribute("aria-haspopup", "true");
            navItem.setAttribute("aria-expanded", "false");

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
                            listItem.appendChild(
                                document.createTextNode(
                                    child.textContent.trim()
                                )
                            );
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

export function addMenuFunctionality(block) {
    document.querySelectorAll(".nav-item").forEach((item) => {
        item.addEventListener("focusin", () => {
            item.setAttribute("aria-expanded", "true");
        });

        item.addEventListener("focusout", (e) => {
            if (!item.contains(e.relatedTarget)) {
                item.setAttribute("aria-expanded", "false");
            }
        });

        item.addEventListener("mouseenter", () => {
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
            const navItemFocusTarget =
                item.querySelector(
                    "a, button, [tabindex]:not([tabindex='-1'])"
                ) || item;

            switch (e.key) {
                case "Tab":
                    const shiftKey = e.shiftKey;
                    const nextNavItem = item.nextElementSibling;
                    const prevNavItem = item.previousElementSibling;

                    if (
                        !shiftKey &&
                        submenuLinks.length > 0 &&
                        document.activeElement === navItemFocusTarget
                    ) {
                        e.preventDefault();
                        submenuLinks[0]?.focus();
                    } else if (!shiftKey && nextNavItem) {
                        e.preventDefault();
                        (
                            nextNavItem.querySelector(
                                "a, button, [tabindex]:not([tabindex='-1'])"
                            ) || nextNavItem
                        )?.focus();
                    } else if (!shiftKey && !nextNavItem) {
                        e.preventDefault();
                        const allFocusable = Array.from(
                            document.querySelectorAll(
                                "a, button, input, [tabindex]:not([tabindex='-1'])"
                            )
                        ).filter((el) => el.offsetParent !== null);
                        const currentIndex = allFocusable.indexOf(
                            document.activeElement
                        );
                        allFocusable[currentIndex + 1]?.focus();
                    } else if (shiftKey && prevNavItem) {
                        e.preventDefault();
                        (
                            prevNavItem.querySelector(
                                "a, button, [tabindex]:not([tabindex='-1'])"
                            ) || prevNavItem
                        )?.focus();
                    } else if (shiftKey && !prevNavItem) {
                        e.preventDefault();
                        const allFocusable = Array.from(
                            document.querySelectorAll(
                                "a, button, input, [tabindex]:not([tabindex='-1'])"
                            )
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
