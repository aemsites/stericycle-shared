export const fileAttachmentText = 'Attach';
export const dragDropText = 'Drag and Drop To Upload';

export const DEFAULT_THANK_YOU_MESSAGE = 'Thank you for your submission.';

export const defaultErrorMessages = {
  accept: 'The specified file type not supported.',
  maxFileSize: 'File too large. Reduce size and try again.',
  maxItems: 'Specify a number of items equal to or less than $0.',
  minItems: 'Specify a number of items equal to or greater than $0.',
  pattern: 'Specify the value in allowed format : $0.',
  minLength: 'Please lengthen this text to $0 characters or more.',
  maxLength: 'Please shorten this text to $0 characters or less.',
  maximum: 'Value must be less than or equal to $0.',
  minimum: 'Value must be greater than or equal to $0.',
  required: 'Please fill in this field.',
};

// eslint-disable-next-line no-useless-escape
export const emailPattern = '([A-Za-z0-9][_.\\-]?)+[A-Za-z0-9]@[A-Za-z0-9\.]+(\.?[A-Za-z0-9]){2}\.([A-Za-z0-9]{2,4})?';
let submitBaseUrl = 'https://shredit.com/en-us';

const RECAPTCHA_KEYS = {
  'www.shredit.com': '6LfrVLIaAAAAAAXITOp0kZDmKaUjciDyodYVm3id',
  'stage-us.shredit.com': '6LeZawIgAAAAAHfOLwMhLJR2ymRvNKbMHqeVSEk2',
  'dev-us.shredit.com': '6LeZawIgAAAAAHfOLwMhLJR2ymRvNKbMHqeVSEk2',
  'stage-ca.shredit.com':'6LeZawIgAAAAAHfOLwMhLJR2ymRvNKbMHqeVSEk2',
  'dev-ca.shredit.com':'6LeZawIgAAAAAHfOLwMhLJR2ymRvNKbMHqeVSEk2'
  // Add more domains as needed
};

export function getGoogleReCaptchaKey() {
  const { hostname } = window.location;
  return RECAPTCHA_KEYS[hostname] || RECAPTCHA_KEYS['www.shredit.com']; // fallback to default key
}

// Replace the constant export with a getter
export const googleReCaptchaKey = getGoogleReCaptchaKey();

export function setSubmitBaseUrl(url) {
  submitBaseUrl = url;
}

export function getSubmitBaseUrl() {
  if (window.location.origin.includes('localhost') || window.location.origin.includes('aem.live') || window.location.origin.includes('aem.page')) { return submitBaseUrl; }
  return '';
}
