import renderForm from './aemform.js';

export default async function decorate(block) {
  await renderForm(block);
}
