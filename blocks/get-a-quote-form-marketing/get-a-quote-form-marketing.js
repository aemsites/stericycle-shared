import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const content = document.createElement('div');
  content.classList.add('content');
  const page = await loadFragment('/forms/legacy-sem-page');
  const form = page.querySelector('.form-container');
  const header = page.querySelector('.form-container > .default-content-wrapper');
  header.classList.add('header');
  content.append(form);
  block.append(content);
}
