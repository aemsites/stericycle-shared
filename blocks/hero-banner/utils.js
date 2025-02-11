/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
import dat from 'https://esm.sh/dat.gui';

const gui = new dat.GUI();

const settings = {
  color1: '#153b5e',
  color2: '#1a405f',
  color3: '#204465',
  angle1: 120,
  angle2: 240,
  angle3: 360,
};

/**
 * Set a custom property on the document element
 * @param {string} key - The name of the custom property
 * @param {string|number} value - The value of the custom property
 */
export function setCustomProperty(element, key, value) {
  element.style.setProperty(key, String(value));
}

/**
 * Update the gradient based on the settings
 */
export function updateGradient(element) {
  setCustomProperty(element, '--color1', settings.color1);
  setCustomProperty(element, '--color2', settings.color2);
  setCustomProperty(element, '--color3', settings.color3);
  setCustomProperty(element, '--angle1', `${settings.angle1}deg`);
  setCustomProperty(element, '--angle2', `${settings.angle2}deg`);
  setCustomProperty(element, '--angle3', `${settings.angle3}deg`);
}

gui.addColor(settings, 'color1').onChange(updateGradient);
gui.addColor(settings, 'color2').onChange(updateGradient);
gui.addColor(settings, 'color3').onChange(updateGradient);
gui.add(settings, 'angle1', 0, 360, 1).onChange(updateGradient);
gui.add(settings, 'angle2', 0, 360, 1).onChange(updateGradient);
gui.add(settings, 'angle3', 0, 360, 1).onChange(updateGradient);
