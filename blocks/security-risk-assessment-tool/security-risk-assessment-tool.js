import { initSecurityRiskAssessment } from './form.js';

export default async function decorate(block) {
  const parent = document.createElement('div');
  parent.classList.add('securityriskassessmenttool');
  const childDiv = document.createElement('div');
  childDiv.classList.add('cmp-securityriskassessmenttool');
  childDiv.id = 'securityRiskAssessmentTool';
  parent.appendChild(childDiv);
  block.appendChild(parent);
  await initSecurityRiskAssessment();
}
