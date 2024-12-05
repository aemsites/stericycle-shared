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

  [...block.children].forEach((child) => {
    const [quotation, attribution] = [...child.children].map((c) => c);
    const blockquote = document.createElement('blockquote');

    if (quotation) {
      quotation.className = 'quote-quotation';

      blockquote.append(quotation);
    }

    if (attribution) {
      attribution.className = 'quote-attribution eyebrow-small';

      blockquote.append(attribution);

      const ems = attribution.querySelectorAll('em');
      ems.forEach((em) => {
        const cite = document.createElement('cite');
        cite.innerHTML = em.innerHTML;
        em.replaceWith(cite);
      });
    }

    child.innerHTML = '';
    child.append(blockquote);
  });
}
