import { extractFormDefinition as extractSheetDefinition, renderForm as renderDocForm } from './lib/docform.js';
import decorateUTM from './utm.js';
import { sendDigitalDataEvent } from '../../scripts/martech.js';
import { getFormName } from './utils.js';

export default async function decorate(block) {
  const { container, formDef } = await extractSheetDefinition(block);
  if (formDef && formDef.properties?.source === 'sheet') {
    const form = await renderDocForm(formDef);
    await decorateUTM(form);
    if (form) {
      form.setAttribute('tabindex', '-1');
      container.replaceWith(form);
      const inputs = form.querySelectorAll('.field-wrapper input');
      const excludeTypes = ['checkbox', 'radio'];
      inputs.forEach((input) => {
        if (!excludeTypes.includes(input.type)) {
          const wrapper = input.closest('.field-wrapper');
          wrapper.insertAdjacentElement('afterbegin', input);
          wrapper.classList.add('floating-field');
          if (!input.placeholder) {
            input.placeholder = '';
          }
        }
      });

      form.addEventListener('focusin', () => {
        sendDigitalDataEvent({
          event: 'formStart',
          formName: getFormName(form),
        });
      }, { once: true });
    }
  }
}
