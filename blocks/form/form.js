import { extractFormDefinition as extractSheetDefinition, renderForm as renderDocForm } from './lib/docform.js';
import decorateUTM from './utm.js';
import { sendDigitalDataEvent } from '../../scripts/martech.js';
import { getFormName } from './utils.js';

function updateFormUrl(block) {
  const container = block.querySelector('a[href]');
  const href = container?.href;

  if (!document.location.host.match(/aem.(live|page)$/g) || !href) {
    return;
  }

  if (href.startsWith('/forms')) {
    container.href = `shredit--stericycle.aem${href}`;
  }
  if (href.startsWith('http')) {
    container.href = container.href.replace('shred-it', 'shredit');
  }
}

export default async function decorate(block) {
  updateFormUrl(block);
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
            input.placeholder = ' ';
          }
        }
      });
      const fieldsets = form.querySelectorAll('fieldset[class*="field-requesttype"], fieldset[class*="field-frequncy"]');
      fieldsets.forEach((fieldset) => {
        fieldset.classList.add('splitbuttons');
      });

      // Move radio-wrapper elements into a radio-wrapper-container div
      form.querySelectorAll('fieldset.splitbuttons').forEach((fieldset) => {
        const radioWrappers = fieldset.querySelectorAll('.radio-wrapper');
        const radioWrapperContainer = fieldset.querySelector('.radio-wrapper-container');
        if (radioWrappers.length > 0 && !radioWrapperContainer) {
          const wrapperDiv = document.createElement('div');
          wrapperDiv.classList.add('radio-wrapper-container');
          const legend = fieldset.querySelector('legend');
          radioWrappers.forEach((radioWrapper) => {
            wrapperDiv.appendChild(radioWrapper);
          });
          fieldset.innerHTML = '';
          fieldset.appendChild(legend);
          fieldset.appendChild(wrapperDiv);
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
