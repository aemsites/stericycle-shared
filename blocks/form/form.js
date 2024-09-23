import { extractFormDefinition as extractSheetDefinition, renderForm as renderDocForm } from './lib/docform.js';
import { getSubmitBaseUrl } from './constant.js';

export default async function decorate(block) {
  let { container, formDef } = await extractSheetDefinition(block);
  if (formDef && formDef.properties?.source === 'sheet') {
    const form = await renderDocForm(formDef);
    container.replaceWith(form);
  } else {
    const aemModule = await import('./lib/aemform.js');
    const { extractFormDefinition: extractAEMDefinition, renderForm: renderAEMForm } = aemModule;
    if (!formDef) {
      const res = await extractAEMDefinition(block);
      formDef = res.formDef;
      container = res.container;
    }
    if (formDef) {
      formDef.action = getSubmitBaseUrl() + (formDef.action || '');
      const form = await renderAEMForm(formDef, block);
      container.replaceWith(form);
    }
  }
}
