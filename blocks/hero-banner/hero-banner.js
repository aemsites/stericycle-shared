export default function decorate(block) {
  const isImageVariant = block.classList?.contains('hero-banner-image');
  const isFullWidthVariant = block.classList?.contains('hero-banner-full');
  let wrapper = block.children[0];
  let heroText = wrapper.querySelector('div');
  let promoBadge;
  let eyebrow;

  const blockHasMultipleChildren = block.children.length > 1;
  const blockHasPromoBadgeAndContent = block.children.length === 2;
  const blockHasFullContent = block.children.length > 2;

  if (blockHasMultipleChildren) {
    if (blockHasPromoBadgeAndContent) {
      [promoBadge, wrapper] = block.children;

      heroText = wrapper.querySelector('div');
      heroText.prepend(promoBadge);
    }

    if (blockHasFullContent) {
      [promoBadge, eyebrow, wrapper] = block.children;

      heroText = wrapper.querySelector('div');
      heroText.prepend(eyebrow);
      heroText.prepend(promoBadge);
    }
  }

  // get first child of heroText except for promoBadge and eyebrow
  const validChildren = [...heroText.children].filter(
    (child) => child !== promoBadge && child !== eyebrow,
  );

  const heading = validChildren[0];

  if (heading) {
    heading.classList.add('hero-banner-heading');
  }

  wrapper?.classList?.add('hero-banner-content');

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
  eyebrow?.classList?.add('eyebrow-small');
  promoBadge?.classList?.add('hero-banner-promo-badge');

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
