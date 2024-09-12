export default function decorate(block) {
  const header = document.createElement('div');
  header.classList.add('header');
  const title = document.createElement('span');
  title.textContent = 'Get A Quote (Placeholder)';
  header.append(title);
  block.append(header);

  const content = document.createElement('div');
  content.classList.add('content');
  content.textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ultricies condimentum lectus, vitae fermentum lectus aliquet eget. Curabitur vitae eros tempor, imperdiet leo pretium, pellentesque quam. Aenean eget elementum purus, nec convallis lorem. Donec vel ultricies erat. Nullam placerat viverra nibh, iaculis ornare arcu aliquet id. Aenean laoreet sodales neque ut hendrerit. Cras dolor eros, finibus ac posuere ut, volutpat nec tellus. Suspendisse tincidunt quam ac viverra venenatis. Nulla quis ultricies dui. Nulla et finibus lacus, ut accumsan quam. Nulla id neque volutpat, suscipit nunc non, dapibus nibh. Fusce sed tempor nisl. Suspendisse potenti. Nunc faucibus felis at arcu malesuada, in pharetra nulla sagittis. Nam quis eros dui. Donec eget tempus arcu, vitae pretium mi.';
  block.append(content);
}
