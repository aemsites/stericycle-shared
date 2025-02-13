export default function decorate(block) {
  const wrapper = block.querySelector('div');

  wrapper?.classList?.add('hero-banner-content');

  const heroText = wrapper.querySelector('div');
  const heroImage = heroText?.nextElementSibling;
  const heroDesktopImage = wrapper?.nextElementSibling;

  heroDesktopImage?.classList?.add('hero-banner-asset-desktop');

  heroText?.classList?.add('hero-banner-content-text');
  heroImage?.classList?.add('hero-banner-asset');

  const buttons = heroText.querySelectorAll('.button-container');

  const parentDiv = document.createElement('div');

  parentDiv?.classList?.add('hero-banner-content-ctas');
  buttons?.forEach((button) => {
    parentDiv?.appendChild(button);
  });
  heroText.appendChild(parentDiv);

  // Decorate content
  const promoBadge = heroText.querySelector('h4');
  const eyebrow = heroText.querySelector('p');

  eyebrow?.classList?.add('eyebrow-small');
  promoBadge?.classList?.add('hero-banner-promo-badge');

  const isImageVariant = block.classList?.contains('hero-banner-image');
  const isFullWidthVariant = block.classList?.contains('hero-banner-full');

  if (isFullWidthVariant && heroDesktopImage) {
    const mobileImg = heroImage.querySelector('img');
    const desktopImg = heroDesktopImage.querySelector('img');

    if (desktopImg) {
      const picture = heroImage.querySelector('picture');
      const newPicture = document.createElement('picture');
      const mobileSource = document.createElement('source');
      const desktopSource = document.createElement('source');

      mobileSource.media = '(max-width: 767px)';
      mobileSource.srcset = mobileImg.src;

      desktopSource.media = '(min-width: 768px)';
      desktopSource.srcset = desktopImg.src;

      newPicture.appendChild(mobileSource);
      newPicture.appendChild(desktopSource);

      // default image source
      const newImg = document.createElement('img');
      newImg.src = desktopImg.src;
      newImg.alt = desktopImg.alt;

      newPicture.appendChild(newImg);

      // add new picture to hero image
      heroImage.removeChild(picture);
      heroImage.appendChild(newPicture);
    }
  }

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
