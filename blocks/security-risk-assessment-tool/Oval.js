import React from 'https://cdn.jsdelivr.net/npm/react@18.3.1/+esm';
import htm from 'https://cdn.jsdelivr.net/npm/htm@3.1.1/+esm';
const html = htm.bind(React.createElement);

const CustomLoader = ({ color = "#006CB4", size = 150 }) => (
  html`
<svg
        xmlns="http://www.w3.org/2000/svg"
        width=${size}
        height=${size}
        viewBox="0 0 100 100"
        fill="none"
        stroke=${color}
        strokeWidth="3"
>
    <circle cx="50" cy="50" r="45" strokeOpacity="0.2" />
    <circle
            cx="50"
            cy="50"
            r="45"
            strokeDasharray="283"
            strokeDashoffset="75"
            strokeLinecap="round"
    >
        <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 50"
                to="360 50 50"
                dur="1.5s"
                repeatCount="indefinite"
        />
    </circle>
</svg>`
);

export default CustomLoader;
