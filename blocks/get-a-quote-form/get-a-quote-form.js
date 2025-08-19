import { loadFragment } from '../fragment/fragment.js';
import { fetchPlaceholders } from '../../scripts/aem.js';
import { getLocale } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const ph = await fetchPlaceholders(`/${getLocale()}`);
  const header = document.createElement('div');
  header.classList.add('header');
  const title = document.createElement('h4');
  title.textContent = ph.getaquote || 'Get A Quote';
  header.append(title);
  block.append(header);
  const content = document.createElement('div');
  content.classList.add('content');
  const page = await loadFragment('/forms/location');
  const form = page.querySelector('.form-container');
  content.append(form);
  block.append(content);
}
