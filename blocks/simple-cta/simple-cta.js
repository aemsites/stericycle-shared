import { decorateButtons } from '../../scripts/aem.js';
import renderVideo from '../video/video.js';

async function findVideos(block) {
  const wistia = block.querySelectorAll('a');
  const promises = [];

  wistia.forEach((link) => {
    if (
      link.href.startsWith('https://fast.wistia')
      || link.href.includes('youtube')
      || link.href.includes('vimeo')
      || link.href.includes('.mp4')
    ) {
      const embedPosition = link.closest('div');
      promises.push(renderVideo(embedPosition));
    }
  });
  await Promise.all(promises);
}

export default async function decorate(block) {
  const wrapper = block.querySelector('div');

  wrapper?.classList?.add('simple-cta-content');

  const heroText = wrapper.querySelector('div');
  const heroImage = heroText?.nextElementSibling;
  const heroDesktopImage = wrapper?.nextElementSibling;

  heroDesktopImage?.classList?.add('simple-cta-asset-desktop');

  heroText?.classList?.add('simple-cta-content-text');
  heroImage?.classList?.add('simple-cta-asset');

  const buttons = heroText.querySelectorAll('.button-container');

  const parentDiv = document.createElement('div');

  parentDiv?.classList?.add('simple-cta-content-ctas');
  buttons?.forEach((button) => {
    parentDiv?.appendChild(button);
  });
  heroText.appendChild(parentDiv);

  const isImageVariant = block.classList?.contains('simple-cta-image');
  const isGraphicVariant = block.classList?.contains('simple-cta-graphic');
  const isVideoVariant = block.classList?.contains('simple-cta-video');
  const isFullWidthVariant = block.classList?.contains('simple-cta-full');
  const isSlimVariant = block.classList?.contains('slim');
  const isLeftAlignedVariant = block.classList?.contains(
    'simple-cta-asset-left',
  );

  if (isSlimVariant) {
    decorateButtons(block);
  }

  if (heroImage) {
    // Decorate variant hero image
    if (isImageVariant) {
      const img = heroImage.querySelector('img');
      const picture = heroImage.querySelector('picture');
      const imgWrapper = document.createElement('div');

      imgWrapper.classList?.add('masked-image-wrapper');

      imgWrapper.appendChild(img);

      picture.appendChild(imgWrapper);
    }

    // Decorate variant hero graphic
    if (isGraphicVariant) {
      const shapeContainer = document.createElement('div');

      shapeContainer.classList?.add('simple-cta-shape');

      if (isFullWidthVariant) {
        shapeContainer.classList?.add('simple-cta-shape-full');

        if (isLeftAlignedVariant) {
          shapeContainer.classList?.add('simple-cta-shape-full-left');
        }
      } else {
        shapeContainer.classList?.add('simple-cta-shape-contained');
      }

      heroImage.prepend(shapeContainer);
    }
  }

  if (isVideoVariant) {
    await findVideos(block);
  }
}
