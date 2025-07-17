import DocBasedFormToAF from './transform.js';
import { createForm } from './forms-common.js';
import { submitForm } from '../submit.js';
import { getId } from './util.js';

async function fetchForm(path) {
  const resp = await fetch(path);
  if (resp?.headers?.get('Content-Type')?.includes('application/json')) {
    return resp.json();
  }
  return null;
}

export async function extractFormDefinition(block) {
  const container = block.querySelector('a[href]');
  if (container) {
    const path = container.href;
    if(path.startsWith('/forms') && document.location.host.match(/aem.(live|page)$/g)) {
      path.replace('shred-it--stericycle.aem', 'shredit--stericycle.aem')

    }
    
    if (path.endsWith('.json')) {
      const { pathname } = new URL(path);
      const definition = await fetchForm(path);
      if (definition && definition[':type'] === 'sheet') {
        const transformer = new DocBasedFormToAF();
        const formDef = transformer.transform(definition, pathname);
        formDef.properties = { ...formDef.properties, source: 'sheet' };
        return { container, formDef };
      }
    }
  }
  return {};
}

export async function renderForm(formDef) {
  if (formDef) {
    const form = await createForm(formDef, undefined, {
      submitHandler({ formEl, captcha }) {
        submitForm(formEl, captcha);
      },
    });
    try {
      const applyRuleEngine = (await import('./rules-doc/index.js')).default;
      applyRuleEngine(formDef, form);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('unable to apply rules ', e);
    }
    form.dataset.source = 'sheet';
    form.dataset.id = formDef.id || getId('form');
    return form;
  }
  return null;
}

export async function decorate(block, submitAction) {
  const container = block.querySelector('a[href]');
  const formDef = await extractFormDefinition(block);
  const form = renderForm(formDef, submitAction);
  if (form) {
    container.replaceWith(form);
  }
}
