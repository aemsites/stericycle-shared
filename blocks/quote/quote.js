function hasWrapper(el) {
  return !!el.firstElementChild;
}

export default async function decorate(block) {
  // merge quote into surrounding default content
  const quoteWrapper = block.parentElement;
  if (quoteWrapper.previousElementSibling?.className === 'default-content-wrapper') {
    block.classList.remove('block');
    quoteWrapper.previousElementSibling.append(block);
    if (quoteWrapper.nextElementSibling?.className === 'default-content-wrapper') {
      quoteWrapper.nextElementSibling.childNodes.forEach(
        (child) => quoteWrapper.previousElementSibling.append(child),
      );
    }
    quoteWrapper.remove();
  } else if (quoteWrapper.nextElementSibling?.className === 'default-content-wrapper') {
    block.classList.remove('block');
    quoteWrapper.previousElementSibling.prepend(block);
    quoteWrapper.remove();
  }

  const [quotation, attribution] = [...block.children].map((c) => c.firstElementChild);
  const blockquote = document.createElement('blockquote');
  // decorate quotation
  quotation.className = 'quote-quotation';
  if (!hasWrapper(quotation)) {
    quotation.innerHTML = `<p>${quotation.innerHTML}</p>`;
  }
  blockquote.append(quotation);
  // decoration attribution
  if (attribution) {
    attribution.className = 'quote-attribution eyebrow-small';
    if (!hasWrapper(attribution)) {
      attribution.innerHTML = `<p>${attribution.innerHTML}</p>`;
    }
    blockquote.append(attribution);
    const ems = attribution.querySelectorAll('em');
    ems.forEach((em) => {
      const cite = document.createElement('cite');
      cite.innerHTML = em.innerHTML;
      em.replaceWith(cite);
    });
  }
  block.innerHTML = '';
  block.append(blockquote);
}
