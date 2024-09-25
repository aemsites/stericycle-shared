import masking from '../../maskingUtil.js';

export default function decorate(field) {
  const input = field?.querySelector('input');
  input.dataset.type = input.type === 'tel' ? '' : 'postalCode';
  masking.init(input);
  input.addEventListener('input', (e) => masking.activateMasking(e));
  input.addEventListener('focus', () => { input.closest('.field-wrapper').classList.add('focus'); });
  input.addEventListener('blur', () => { input.closest('.field-wrapper').classList.remove('focus'); });
}
