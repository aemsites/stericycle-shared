import { readBlockConfig } from '../../scripts/aem.js';

const PRIVACY_BANNER_COOKIE = 'privacy-banner-dismissed';
const COOKIE_EXPIRY_DAYS = 365; // Cookie expires after 1 year

function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
}

function getCookie(name) {
  const cookieName = `${name}=`;
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i += 1) {
    const cookie = cookies[i].trim();
    if (cookie.indexOf(cookieName) === 0) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }
  return '';
}

export default async function decorate(block) {
  if (getCookie(PRIVACY_BANNER_COOKIE) === 'true') {
    block.remove();
    return;
  }

  block.classList.add('privacy-banner', 'fixed-to-bottom');

  // Use readBlockConfig to get config
  const config = readBlockConfig(block);

  // Build two-column layout
  block.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'privacy-banner-columns';

  // Left column: two rows (title and date)
  const leftCol = document.createElement('div');
  leftCol.className = 'privacy-banner-left';
  leftCol.style.display = 'flex';
  leftCol.style.flexDirection = 'column';

  const titleRow = document.createElement('div');
  titleRow.className = 'privacy-title';
  titleRow.textContent = 'US Privacy Policy Update';
  titleRow.style.fontWeight = 'bold';

  const dateRow = document.createElement('div');
  dateRow.className = 'privacy-date';
  dateRow.textContent = config.date || '';

  leftCol.append(titleRow, dateRow);

  // Right column (link as-is)
  const rightCol = document.createElement('div');
  rightCol.className = 'privacy-banner-right';
  if (config.link) {
    // If the link is a URL, create an anchor
    const a = document.createElement('a');
    a.href = config.link;
    a.textContent = 'Privacy Policy';
    a.className = 'privacy-link';
    a.target = '_blank';
    rightCol.appendChild(a);
  }

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-button';
  closeBtn.onclick = () => {
    setCookie(PRIVACY_BANNER_COOKIE, 'true', COOKIE_EXPIRY_DAYS);
    block.remove();
  };
  rightCol.appendChild(closeBtn);

  container.append(leftCol, rightCol);
  block.append(container);
}
