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
  const isFullWidthVariant = block.classList?.contains('simple-cta-full');

  // Decorate variant hero image
  if (heroImage && isImageVariant) {
    const img = heroImage.querySelector('img');
    const picture = heroImage.querySelector('picture');
    const imgWrapper = document.createElement('div');

    imgWrapper.classList?.add('masked-image-wrapper');

    imgWrapper.appendChild(img);

    picture.appendChild(imgWrapper);
  }
}
