export default function decorate(block) {
  const wrapper = block.querySelector('div');
  const contentContainer = document.createElement('div');
  contentContainer.classList.add('hero-content-container');

  // Decorate content
  const content = wrapper.querySelector('div');
  content.classList.add('hero-content');
  contentContainer.append(content);
  const pictures = content.querySelectorAll('picture');

  pictures.forEach((picture, index) => {
    picture.parentElement.remove();
    picture.classList.add('hero-background');

    if (pictures.length === 2) {
      if (index === 0) {
        picture.classList.add('mobile-only');
      } else {
        picture.classList.add('desktop-only');
      }
    }

    if (index === 0) {
      block.replaceChildren(picture);
    } else {
      block.append(picture);
    }
  });

  // Add everything to the block
  block.append(contentContainer);
  block.parentElement.parentElement.classList.add('blue-background');
}
