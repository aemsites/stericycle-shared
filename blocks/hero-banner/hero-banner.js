export default function decorate(block) {
    const wrapper = block.querySelector("div");

    wrapper?.classList?.add("hero-banner__content");

    const heroText = wrapper.querySelector("div");
    const heroImage = heroText?.nextElementSibling;

    heroText?.classList?.add("hero-banner__content__text");
    heroImage?.classList?.add("hero-banner__image");

    const buttons = heroText.querySelectorAll(".button-container");

    const parentDiv = document.createElement("div");

    parentDiv.classList.add("hero-banner__content__ctas");
    buttons.forEach((button) => {
        parentDiv.appendChild(button);
    });
    heroText.appendChild(parentDiv);

    // Decorate content
    const promoBadge = heroText.querySelector("h4");
    const eyebrow = heroText.querySelector("p");

    eyebrow?.classList?.add("eyebrow-small");
    promoBadge?.classList?.add("hero-banner__promo-badge");

    const isImageVariant = block.classList.contains("hero-banner-image");

    // decorate hero image
    if (heroImage && isImageVariant) {
        const img = heroImage.querySelector("img");
        const imgWrapper = document.createElement("div");

        imgWrapper.classList.add("masked-image-wrapper");

        imgWrapper.appendChild(img);

        heroImage.appendChild(imgWrapper);
    }
}
