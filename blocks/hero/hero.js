export default function decorate(block) {
  const wrapper = block.querySelector('div');
  const contentContainer = document.createElement('div');
  contentContainer.classList.add('hero-content-container');

  // Decorate content
  const content = wrapper.querySelector('div');
  content.classList.add('hero-content');
  contentContainer.append(content);
  const picture = content.querySelector('picture');
  picture.parentElement.remove();
  picture.classList.add('hero-background');

  // Add everything to the block
  wrapper.append(picture);
  wrapper.append(contentContainer);
  block.parentElement.parentElement.classList.add('blue-background');
}
