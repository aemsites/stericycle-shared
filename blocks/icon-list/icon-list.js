/* eslint-disable no-unused-vars */
export default function decorate(block) {
  const iconList = block.querySelectorAll(
    '.icon-list.block.two-column-icons > div',
  );

  if (iconList && iconList.length % 2 !== 0) {
    const lastChild = iconList[iconList.length - 1];

    lastChild.classList.add('odd-last-child');
  }
}
