/* eslint-disable operator-linebreak */
/* eslint-disable no-case-declarations */
import { getMetadata, isLargeDesktop } from '../../scripts/aem.js';
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
  h2,
} from '../../scripts/dom-helpers.js';
import { formatPhone } from '../../scripts/scripts.js';

const FOCUSABLE_ELEMENTS =
  'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';

const MOBILE_MENU_OPEN_CLASSNAME = 'open';
const DESKTOP_MENU_OPEN_CLASSNAME = 'hover';

/**
 * Function to close a modal.
 * @param {HTMLElement} modalElement - The modal element to close.
 * @param {HTMLElement} triggerElement - The element that triggered the modal.
 */
function closeModal(modalElement, triggerElement) {
  modalElement?.classList?.remove(MOBILE_MENU_OPEN_CLASSNAME);
  triggerElement?.focus();
}

/**
 * Function to trap focus inside a container element.
 * @param {HTMLElement} element - The element container.
 * @param {Function} [closeFn] - Optional function to handle modal close.
 */
function trapFocus(element, closeFn) {
  const focusableElements = Array.from(
    element.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    ),
  );

  if (focusableElements.length === 0) return;

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  // Automatically focus the first element
  firstFocusable?.focus();

  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab: Move to the last element if on the first
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      }

      // Tab: Move to the first element if on the last
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }

    // Escape key to close the modal
    if (e.key === 'Escape' && typeof closeFn === 'function') {
      closeFn();
    }
  });
}

/**
 * Function to close the navigation menu.
 * @returns {void}
 */
function closeNavigationMenu() {
  const nav = document.querySelector('#nav');
  const hamburger = document.querySelector('.hamburger-menu');

  nav.classList.remove(MOBILE_MENU_OPEN_CLASSNAME);
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  hamburger.focus();

  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.remove(MOBILE_MENU_OPEN_CLASSNAME);
    item.classList.remove(DESKTOP_MENU_OPEN_CLASSNAME);

    const submenu = item.querySelector('.submenu');

    if (submenu) {
      submenu.classList.remove(MOBILE_MENU_OPEN_CLASSNAME);
      submenu.classList.remove(DESKTOP_MENU_OPEN_CLASSNAME);
    }
  });
}

/**
 * Reusable function to handle modal open/close logic.
 * @param {HTMLElement} triggerElement - The element that triggers the modal.
 * @param {HTMLElement} modalElement - The modal element to show/hide.
 */
function setupModal(triggerElement, modalElement) {
  const closeButton = modalElement.querySelector('.close-button');
  const closeModalFn = () => closeModal(modalElement, triggerElement);
  const nav = document.querySelector('#nav');

  function openModal() {
    document.querySelectorAll('.submenu').forEach((submenu) => {
      if (submenu !== modalElement) {
        submenu.classList.remove(MOBILE_MENU_OPEN_CLASSNAME);
        submenu.classList.remove(DESKTOP_MENU_OPEN_CLASSNAME);
      }

      // remove open class to hamburger menu
      const hamburger = document.querySelector('.hamburger-menu');
      if (hamburger) {
        hamburger.classList.remove('open');
      }
    });

    modalElement.classList.add(MOBILE_MENU_OPEN_CLASSNAME);
    nav.classList.remove(MOBILE_MENU_OPEN_CLASSNAME);

    trapFocus(modalElement, closeModalFn);
  }

  modalElement.addEventListener('mouseenter', openModal);
  modalElement.addEventListener('mouseleave', closeModalFn);

  triggerElement.addEventListener('click', (e) => {
    e.stopPropagation();

    if (modalElement.classList.contains(MOBILE_MENU_OPEN_CLASSNAME)) {
      closeModalFn();
    } else {
      openModal();
    }
  });

  if (closeButton) {
    closeButton.addEventListener('click', closeModalFn);
  }

  // close modal if clicked outside but not inside the modal or trigger
  document.addEventListener('click', (e) => {
    if (
      modalElement.classList.contains(MOBILE_MENU_OPEN_CLASSNAME) &&
      !modalElement.contains(e.target) &&
      e.target !== triggerElement
    ) {
      closeModalFn();
    }
  });

  // close modal on escape key
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'Escape' &&
      modalElement.classList.contains(MOBILE_MENU_OPEN_CLASSNAME)
    ) {
      closeModalFn();
    }
  });
}

/**
 * Converts a section with hierarchical structure into a navigation menu.
 * @param {HTMLElement} sectionElement - The section containing the hierarchical structure.
 * @param {Object} locationSearchInfo - The location search information.
 * @param {HTMLElement} instructions - The instructions to be added to the submenus.
 * @param {string} locale - The locale of the page.
 * @returns {HTMLElement} - The generated navigation menu element.
 */
export function generateMenuFromSection(
  sectionElement,
  locationSearchInfo,
  instructions,
  locale,
) {
  if (!sectionElement) {
    return null;
  }

  const nav = document.createElement('nav');
  const hasAlertBanner = document.querySelector('.cmp-notification-bar');

  nav.role = 'menu';
  nav.id = 'nav';

  // Helper function to process top-level list items
  const processTopLevelItems = (listItems) => {
    Array.from(listItems).forEach((li) => {
      const navItem = document.createElement('div');
      navItem.className = 'nav-item';
      navItem.setAttribute('aria-haspopup', 'true');
      navItem.setAttribute('aria-expanded', 'false');
      navItem.setAttribute('role', 'menuitem');

      // Handle links, text, or other content for the nav item
      const link = li.querySelector('a');
      let isLocationLink = false;

      if (link) {
        const anchor = document.createElement('a');
        anchor.href = link.href;
        anchor.textContent = link.textContent.trim();
        anchor.className = 'nav-link';

        if (li.textContent.includes('#location-search')) {
          isLocationLink = true;
          anchor.classList.add('location-link');
        }

        navItem.appendChild(anchor);
      } else {
        // If no <a>, use the text content or first child element
        const fallbackContent = li.cloneNode(true); // Clone the <li> for non-link content
        const nestedList = fallbackContent.querySelector('ul'); // Find the nested list
        const itemWrapper = document.createElement('a');
        if (nestedList) {
          fallbackContent.removeChild(nestedList); // Remove nested lists safely
        }
        fallbackContent.childNodes.forEach((child) => {
          if (
            child.nodeType === Node.ELEMENT_NODE ||
            child.nodeType === Node.TEXT_NODE
          ) {
            itemWrapper.appendChild(child.cloneNode(true));
            itemWrapper.href = '#';
            itemWrapper.className = 'nav-link';
            navItem.appendChild(itemWrapper);
          }
        });
      }

      const submenu = document.createElement('div');

      submenu.className = 'submenu';
      submenu.setAttribute(
        'aria-label',
        `Submenu for ${link ? link.textContent.trim() : 'non-link item'}`,
      );

      if (hasAlertBanner) {
        const alertCloseButton = hasAlertBanner.querySelector('.close-button');

        submenu.classList.add('submenu-alert');
        alertCloseButton.addEventListener('click', () => {
          submenu.classList.remove('submenu-alert');
        });
      }

      // Process nested lists only if they are direct children of the current `li`
      const nestedLists = li.querySelectorAll(':scope > ul');
      nestedLists.forEach((nestedList) => {
        const listWrapper = document.createElement('ul');
        listWrapper.className = 'list';

        Array.from(nestedList.children).forEach((nestedLi) => {
          const listItem = document.createElement('li');
          listItem.className = 'list-item';

          // Handle different types of children (e.g., links, paragraphs, images)
          Array.from(nestedLi.childNodes).forEach((child) => {
            if (child.nodeType === Node.ELEMENT_NODE) {
              listItem.appendChild(child.cloneNode(true));
            } else if (
              child.nodeType === Node.TEXT_NODE &&
              child.textContent.trim()
            ) {
              const textWrapper = document.createElement('span');

              // check if textContent includes custom selector #name and add class with that name
              if (child.textContent.includes('#')) {
                const className = child.textContent.match(/#(\w+)/)[1];

                listItem.classList.add(className);

                const textContent = child?.textContent.split('#')[0];

                child.textContent = textContent;
              }

              textWrapper.textContent = child.textContent.trim();
              textWrapper.classList.add('nav-item-heading');
              textWrapper.classList.add('eyebrow-small');

              listItem.appendChild(textWrapper);
            }
          });

          listWrapper.appendChild(listItem);
        });

        submenu.appendChild(listWrapper);
      });

      if (isLocationLink) {
        const navLocate = div(
          { class: 'form locate-form' },
          h2({ class: 'form-header' }, locationSearchInfo?.title?.text),
          p(
            { class: 'form-description' },
            locationSearchInfo?.description?.text,
          ),
          form(
            {
              action: `/${locale}/service-locations`,
              method: 'get',
              autocomplete: 'off',
            },

            div(
              { class: 'input-group' },
              input({
                ariaLabel: locationSearchInfo?.searchlabel?.text,
                id: 'searchLocationInput',
                type: 'text',
                name: 'searchQuery',
                placeholder: locationSearchInfo?.searchlabel?.text,
                required: true,
                pattern: '^.{4,}$',
              }),
              button({
                class: 'button location-search-button',
                type: 'submit',
                'aria-label': locationSearchInfo?.searchlabel?.text,
              }),
            ),
          ),
          a(
            {
              class: 'locate-link',
              href: `/${locale}/service-locations`,
              'aria-label': locationSearchInfo?.servicelabel?.text,
            },
            locationSearchInfo?.servicelabel?.text,
          ),
        );

        const locateForm = navLocate.querySelector('form');

        locateForm.addEventListener('submit', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const { value } = locateForm.querySelector('input[type="text"]');
          window.location.href = `${locateForm.action}#${value}`;
          if (
            window.location.pathname === new URL(locateForm.action).pathname
          ) {
            window.location.reload();
          }
          return false;
        });

        submenu.appendChild(navLocate);
        submenu.classList.add('location-search-menu');
      }

      if (submenu.childElementCount > 0) {
        navItem.appendChild(submenu);
      }
      nav.appendChild(navItem);
    });
  };

  // Find the top-level list in the section
  const topLevelList = sectionElement.querySelector('ul');
  if (topLevelList) {
    processTopLevelItems(topLevelList.children);
  }

  if (instructions) {
    instructions.classList.add('instructions');

    // add instruction to every sub menu
    const subMenus = nav.querySelectorAll('.submenu');

    subMenus.forEach((subMenu) => {
      const instruction = instructions.cloneNode(true);
      subMenu.append(instruction);
    });
  }

  nav.appendChild(instructions);

  return nav;
}

function itemFocusIn(item) {
  item.classList.add(DESKTOP_MENU_OPEN_CLASSNAME);
  item.setAttribute('aria-expanded', 'true');
}

function itemFocusOut(e, item) {
  if (!item.contains(e.relatedTarget)) {
    item.classList.remove(DESKTOP_MENU_OPEN_CLASSNAME);
    item.setAttribute('aria-expanded', 'false');
  }
}

function itemMouseEnter(item) {
  const itemLink = item.querySelector('.nav-link');

  if (document.activeElement !== itemLink) {
    document.activeElement.blur();
  }

  document.querySelectorAll('.submenu').forEach((sbmenu) => {
    if (sbmenu !== item.querySelector('.submenu')) {
      sbmenu.classList.remove(MOBILE_MENU_OPEN_CLASSNAME);
    }
  });

  item.classList.add(DESKTOP_MENU_OPEN_CLASSNAME);
  item.setAttribute('aria-expanded', 'true');
}

function itemMouseLeave(item) {
  item.classList.remove(DESKTOP_MENU_OPEN_CLASSNAME);
  item.setAttribute('aria-expanded', 'false');
}

function submenuMouseEnter(item) {
  item.setAttribute('aria-expanded', 'true');
  item.classList.add(DESKTOP_MENU_OPEN_CLASSNAME);
}

function submenuMouseLeave(item) {
  item.setAttribute('aria-expanded', 'false');
  item.classList.remove(DESKTOP_MENU_OPEN_CLASSNAME);
}

function itemKeyDown(e, item) {
  const { shiftKey } = e;
  const submenuLinks = item.querySelectorAll(FOCUSABLE_ELEMENTS);
  const nextNavItem = item.nextElementSibling;
  const prevNavItem = item.previousElementSibling;
  const navbar = document.querySelector('#nav');
  const nextSibling = navbar.nextElementSibling;

  switch (e.key) {
    case 'Tab':
      if (!shiftKey && nextNavItem) {
        e.preventDefault();
        (nextNavItem.querySelector(FOCUSABLE_ELEMENTS) || nextNavItem)?.focus();
      } else if (!shiftKey && !nextNavItem) {
        e.preventDefault();

        let nextFocusableElement = null;

        if (nextSibling) {
          nextFocusableElement = nextSibling.querySelector(FOCUSABLE_ELEMENTS);
        } else {
          nextFocusableElement = document
            .querySelector('main')
            .querySelector(FOCUSABLE_ELEMENTS);
        }

        nextFocusableElement?.focus();
      } else if (shiftKey && prevNavItem) {
        e.preventDefault();
        (prevNavItem.querySelector(FOCUSABLE_ELEMENTS) || prevNavItem)?.focus();
      } else if (shiftKey && !prevNavItem) {
        e.preventDefault();
        const allFocusable = Array.from(
          document.querySelectorAll(FOCUSABLE_ELEMENTS),
        ).filter((el) => el.offsetParent !== null);
        const currentIndex = allFocusable.indexOf(document.activeElement);
        allFocusable[currentIndex - 1]?.focus();
      } else {
        item.setAttribute('aria-expanded', 'false');
      }
      break;

    case 'ArrowRight':
      e.preventDefault();
      const currentIndexRight = Array.from(submenuLinks).indexOf(
        document.activeElement,
      );
      const nextIndexRight = (currentIndexRight + 1) % submenuLinks.length;
      submenuLinks[nextIndexRight]?.focus();
      break;

    case 'ArrowLeft':
      e.preventDefault();
      const currentIndexLeft = Array.from(submenuLinks).indexOf(
        document.activeElement,
      );
      const prevIndexLeft =
        (currentIndexLeft - 1 + submenuLinks.length) % submenuLinks.length;
      submenuLinks[prevIndexLeft]?.focus();
      break;
    default:
      break;
  }
}

function hamburgerMenuClick(hamburger) {
  const isOpen = hamburger.classList.toggle('open');
  const nav = document.querySelector('#nav');

  hamburger.setAttribute('aria-expanded', isOpen);
  nav.classList.toggle('open');

  if (isOpen) {
    document.body.style.overflow = 'hidden';

    trapFocus(nav, closeNavigationMenu);
  } else {
    closeNavigationMenu();
  }
}

function mobileNavClick(e, submenu, item) {
  e.preventDefault();
  submenu.classList.add(MOBILE_MENU_OPEN_CLASSNAME);
  item.classList.add(DESKTOP_MENU_OPEN_CLASSNAME);

  trapFocus(submenu, closeNavigationMenu);
}

/**
 * Adds functionality to the navigation menu.
 * @param {HTMLElement} ctasMobile - The mobile call to action section.
 * @returns {void}
 */
export function addMenuFunctionality(ctasMobile) {
  let isDesktopLayout = isLargeDesktop();
  const eventListenersMap = new WeakMap();

  const applyMenuLogic = () => {
    const isDesktopDevice = isLargeDesktop();
    const isMobile = !isDesktopDevice;

    document.querySelectorAll('.nav-item').forEach((item) => {
      const submenu = item.querySelector('.submenu');
      const mobileCtasContainer = document.querySelector(
        '.ctas-container-mobile',
      );

      if (isDesktopDevice) {
        const listeners = {
          focusin: itemFocusIn.bind(null, item),
          focusout: (e) => itemFocusOut(e, item),
          mouseenter: itemMouseEnter.bind(null, item),
          mouseleave: itemMouseLeave.bind(null, item),
          keydown: (e) => itemKeyDown(e, item),
        };

        eventListenersMap.set(item, listeners);

        item.addEventListener('focusin', listeners.focusin);
        item.addEventListener('focusout', listeners.focusout);
        item.addEventListener('mouseenter', listeners.mouseenter);
        item.addEventListener('mouseleave', listeners.mouseleave);

        if (submenu) {
          const submenuListeners = {
            mouseenter: submenuMouseEnter.bind(null, item),
            mouseleave: submenuMouseLeave.bind(null, item),
          };

          eventListenersMap.set(submenu, submenuListeners);

          submenu.addEventListener('mouseenter', submenuListeners.mouseenter);
          submenu.addEventListener('mouseleave', submenuListeners.mouseleave);
          item.addEventListener('keydown', listeners.keydown);

          // Remove back button if it exists
          const backButton = submenu.querySelector('.back-button');
          if (backButton) {
            backButton.remove();
          }
        }

        if (mobileCtasContainer) {
          mobileCtasContainer.remove();
        }
      }

      if (submenu && isMobile) {
        const navLink = item.querySelector('.nav-link');

        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        backButton.className = 'button back-button';
        backButton.addEventListener('click', () => {
          submenu.classList.remove(MOBILE_MENU_OPEN_CLASSNAME);
          item.classList.remove(DESKTOP_MENU_OPEN_CLASSNAME);
        });
        submenu.prepend(backButton);

        navLink.addEventListener('click', (e) => {
          mobileNavClick(e, submenu, item);
        });
      }
    });

    const hamburger = document.querySelector('.hamburger-menu');
    const mobileCtasContainer = document.querySelector(
      '.ctas-container-mobile',
    );

    if (hamburger && isMobile) {
      const listener = hamburgerMenuClick.bind(null, hamburger);
      eventListenersMap.set(hamburger, { click: listener });
      hamburger.addEventListener('click', listener);
    }

    if (!mobileCtasContainer && isMobile) {
      const nav = document.querySelector('nav');

      nav.append(ctasMobile);
    }
  };

  const removeMenuLogic = () => {
    document.querySelectorAll('.nav-item').forEach((item) => {
      const submenu = item.querySelector('.submenu');
      const listeners = eventListenersMap.get(item);

      if (listeners) {
        item.removeEventListener('focusin', listeners.focusin);
        item.removeEventListener('focusout', listeners.focusout);
        item.removeEventListener('mouseenter', listeners.mouseenter);
        item.removeEventListener('mouseleave', listeners.mouseleave);
      }

      if (submenu) {
        const submenuListeners = eventListenersMap.get(submenu);
        if (submenuListeners) {
          submenu.removeEventListener(
            'mouseenter',
            submenuListeners.mouseenter,
          );
          submenu.removeEventListener(
            'mouseleave',
            submenuListeners.mouseleave,
          );
        }
      }
    });

    const hamburger = document.querySelector('.hamburger-menu');
    if (hamburger) {
      const listeners = eventListenersMap.get(hamburger);
      if (listeners) {
        hamburger.removeEventListener('click', listeners.click);
      }
    }
  };

  // Apply initial menu logic
  applyMenuLogic();

  // Add a resize event listener to update menu logic on resolution change
  window.addEventListener('resize', () => {
    const newIsDesktopLayout = isLargeDesktop();

    if (newIsDesktopLayout !== isDesktopLayout) {
      isDesktopLayout = newIsDesktopLayout;

      closeNavigationMenu();

      removeMenuLogic();

      applyMenuLogic();
    }
  });
}

/**
 * Function to build the company logo element.
 * @returns {HTMLElement} - The company logo element.
 */
export function buildCompanyLogo() {
  const logo = document.createElement('div');
  const logoLink = document.createElement('a');
  const logoImg = document.createElement('img');
  logoImg.src = '/icons/shredit-logo.svg';
  logoImg.alt = 'Shredit Logo';

  logoLink.appendChild(logoImg);
  logo.appendChild(logoLink);

  logoLink.href = '/';
  logoLink.className = 'logo-link';
  logoLink['aria-label'] = 'Shredit Home';
  logo.className = 'logo';

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
  locale,
  placeHolders = {},
  tools = {},
  contact = {},
) {
  const navModalPath = getMetadata('nav-modal-path') || '/forms/modals/modal';
  const contactModalButtonTitle =
    placeHolders.contactustext || 'Open Contact Us Information';
  const searchModalButtonTitle = placeHolders.searchtext || 'Open Search box';

  const contactModalButton = button({
    class: 'icon-button button contact-button',
    'aria-label': contactModalButtonTitle,
    id: 'contact-btn',
  });

  const searchModalButton = button({
    class: 'icon-button button search-button',
    'aria-label': searchModalButtonTitle,
    id: 'search-btn',
  });

  const contactLinks = div(
    div(
      { class: 'contact' },
      img({
        class: 'contact-icon',
        src: '/icons/phone-ringing-black.svg',
      }),
      div(
        { class: 'contact-info' },
        p({ class: 'modal-title' }, contact?.customerservicelabel?.text),
        a(
          {
            href: `tel:+1${contact?.customerserviceno?.text.trim()}`,
            title: `${contact?.customerservicelabel?.text} number`,
            'aria-label': `${contact?.customerservicelabel?.text} number`,
          },
          `${formatPhone(contact?.customerserviceno?.text, true)}`,
        ),
      ),
    ),
    div(
      { class: 'contact' },
      img({
        class: 'contact-icon',
        src: '/icons/phone-ringing-black.svg',
      }),
      div(
        { class: 'contact-info' },
        p({ class: 'modal-title' }, contact?.saleslabel?.text),
        a(
          {
            href: `tel:+1${contact?.salesno?.text.trim()}`,
            title: `${contact?.saleslabel?.text} number`,
            'aria-label': `${contact?.saleslabel?.text} number`,
          },
          `${formatPhone(contact?.salesno?.text, true)}`,
        ),
      ),
    ),
  );
  const contactLinksMobile = contactLinks.cloneNode(true);

  const contactModal = div(
    { class: 'submenu modal contact-modal', id: 'contact-modal' },
    div(
      { class: 'modal-content' },
      h3({ class: 'modal-title eyebrow-small' }, contact?.title?.text),
      p({ class: 'modal-subtitle' }, contact?.description?.text),
      contactLinks,
      a(
        {
          href: contact?.requestacallback?.href,
          class: 'quote-button button primary',
          'aria-label': contact?.cta?.text,
        },
        contact?.cta?.text || 'Request a call back',
      ),
    ),
  );

  const searchModal = div(
    { class: 'submenu search-modal', id: 'search-modal' },
    div(
      { class: 'modal-content' },

      form(
        {
          class: 'form search-form',
          action: `/${locale}/search`,
          method: 'get',
          autocomplete: 'off',
        },
        input({
          ariaLabel: 'Search for content',
          type: 'text',
          placeholder: placeHolders.searchtext,
          class: 'search-input',
          name: 'searchQuery',
        }),
        button(
          {
            class: 'close-button',
            'arial-label': 'Close search',
            type: 'button',
          },
          img({
            class: 'contact-icon',
            src: '/icons/close.svg',
          }),
        ),
      ),
    ),
  );

  const toolsCta = Object.keys(tools).map((tool) => {
    const { href, text } = tools[tool];
    const isLast = tool === Object.keys(tools).slice(-1)[0];

    return a(
      {
        href: isLast ? navModalPath : href,
        target: isLast ? '_self' : '_blank',
        class: `quote-button button ${isLast ? 'primary' : 'secondary dark'}`,
        'aria-label': text,
      },
      text,
    );
  });

  const toolsCtaMobile = toolsCta.map((cta) => {
    const clonedCta = cta.cloneNode(true);
    clonedCta.classList.remove('dark');

    return clonedCta;
  });

  const ctasContainer = domEl(
    'div',
    { class: 'ctas-container' },
    div({ class: 'modal-actions' }, contactModalButton, searchModalButton),
    ...toolsCta,
    contactModal,
    searchModal,
  );

  setupModal(contactModalButton, contactModal);
  setupModal(searchModalButton, searchModal);

  const ctasMobile = div(
    { class: 'ctas-container-mobile' },
    div({ class: 'content' }, contactLinksMobile, ...toolsCtaMobile),
  );

  return { ctas: ctasContainer, ctasMobile };
}
