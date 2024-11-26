import { hr } from '../../scripts/dom-helpers.js';
import renderVideo from '../video/video.js';

export function applySplitPercentages(block) {
  const ratios = [];
  for (let i = 0; i < block.classList.length; i += 1) {
    const cls = block.classList[i];
    if (cls.startsWith('split-')) {
      const varName = `--${cls}`;
      const mainElement = document.querySelector('main');
      const numbers = getComputedStyle(mainElement).getPropertyValue(varName);
      numbers.split(':').forEach((n) => ratios.push(n));
      break;
    }
  }

  if (ratios.length === 0) {
    return;
  }

  let pctIdx = 0;

  for (let i = 0; i < block.children.length; i += 1) {
    if (block.children[i].localName === 'div') {
      for (let j = 0; j < block.children[i].children.length; j += 1) {
        if (block.children[i].children[j].localName === 'div') {
          block.children[i].children[j].style.flexBasis = ratios[pctIdx];
          pctIdx += 1;

          if (pctIdx >= ratios.length) {
            pctIdx = 0;
          }
        }
      }
    }
  }
}

async function findEmbeds(block) {
  const wistia = block.querySelectorAll('a');
  const promises = [];

  wistia.forEach((link) => {
    if (link.href.startsWith('https://fast.wistia')) {
      const embedPosition = link.closest('div');
      promises.push(renderVideo(embedPosition));
    }
  });
  await Promise.all(promises);
}

function applyHorizontalCellAlignment(block) {
  block.querySelectorAll(':scope div[data-align]').forEach((d) => {
    if (d.classList.contains('text-col')) {
      // This is a text column
      if (d.dataset.align) {
        d.style.textAlign = d.dataset.align;
      }
    } else {
      // This is an image column
      d.style.display = 'flex';
      d.style.flexDirection = 'column';
      d.style.alignItems = 'stretch';
      d.style.justifyContent = 'space-between';
    }
  });
}

// Vertical Cell Alignment is only applied to non-text columns
function applyVerticalCellAlignment(block) {
  block.querySelectorAll(':scope > div > div:not(.text-col-wrapper)').forEach((d) => {
    // this is an image column
    d.style.display = 'flex';
    d.style.flexDirection = 'column';
    if (!block.parentElement.parentElement.classList.contains('large-icon')) {
      d.style.alignItems = 'stretch';
    }
    if (d.querySelector('p > strong')) {
      d.querySelector('p').classList.add('button-container');
      if (d.querySelector('p > strong > a')) {
        d.querySelector('p > strong > a').classList.add('button', 'primary');
      }
    }
  });
}
export function applyCellAlignment(block) {
  applyHorizontalCellAlignment(block);
  applyVerticalCellAlignment(block);
}

export default async function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);
  let isImageLink = false;
  if (block.querySelector('img')) {
    block.classList.add('columns-has-image');
  }

  if (block.classList.contains('divider')) {
    block.insertBefore(hr(), block.firstChild);
  }

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      const link = col.querySelector('a');

      if (pic && link && link.href
        && new URL(link.href).pathname === new URL(link.innerText).pathname) {
        link.innerHTML = '';
        link.appendChild(pic);
        isImageLink = true;
      }

      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
      if (isImageLink) {
        block.classList.add('centered-text');
      }
    });
  });

  await findEmbeds(block);
  applySplitPercentages(block);
  applyCellAlignment(block);
}
