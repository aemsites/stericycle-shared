/*
 * Faq Block
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 */

function hasWrapper(el) {
  return !!el.firstElementChild && window.getComputedStyle(el.firstElementChild).display === 'block';
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    // decorate faq item label
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'faq-item-label';
    summary.append(...label.childNodes);
    if (!hasWrapper(summary)) {
      summary.innerHTML = `${summary.innerHTML}`;
      summary.innerHTML += '<span></span>';
    }
    // decorate faq item body
    const body = row.children[1];
    body.className = 'faq-item-body';
    if (!hasWrapper(body)) {
      body.innerHTML = `<p>${body.innerHTML}</p>`;
    }
    // decorate faq item
    const details = document.createElement('details');
    details.className = 'faq-item';
    details.append(summary, body);
    row.replaceWith(details);
  });
}
