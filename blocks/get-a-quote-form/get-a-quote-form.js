import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const header = document.createElement('div');
  header.classList.add('header');
  const title = document.createElement('h4');
  title.textContent = 'Get A Quote';
  header.append(title);
  block.append(header);
  const content = document.createElement('div');
  content.classList.add('content');
  const page = await loadFragment('/forms/multistep-inline');
  const form = page.querySelector('.form-container');
  content.append(form);
  block.append(content);
}
