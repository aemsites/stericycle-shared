export default function decorate(block) {
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
  const isFullWidthVariant = block.classList?.contains('simple-cta-full');
  const isLeftAlignedVariant = block.classList?.contains(
    'simple-cta-asset-left',
  );

  // Decorate variant hero image
  if (heroImage && isImageVariant) {
    const img = heroImage.querySelector('img');
    const picture = heroImage.querySelector('picture');
    const imgWrapper = document.createElement('div');

    imgWrapper.classList?.add('masked-image-wrapper');

    imgWrapper.appendChild(img);

    picture.appendChild(imgWrapper);
  }

  // Decorate variant hero graphic
  if (heroImage && isGraphicVariant) {
    const shapeContainer = document.createElement('div');

    shapeContainer.classList?.add('simple-cta-shape');

    if (isFullWidthVariant) {
      shapeContainer.classList?.add('simple-cta-shape-full');

      if (isLeftAlignedVariant) {
        shapeContainer.classList?.add('simple-cta-shape-full-left');
      }
    }

    if (!isFullWidthVariant) {
      shapeContainer.classList?.add('simple-cta-shape-contained');
    }

    heroImage.prepend(shapeContainer);
  }
}
