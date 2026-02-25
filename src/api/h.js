import { isType } from "../utils/general.js";

const LONG_CLICK_DELAY = 500;
const LONG_CLICK_REPEAT = 100;

export default function h(tag, props = {}, ...children) {
    const el = tag === 'fragment'
        ? document.createDocumentFragment()
        : document.createElement(tag);

    let holdTimer = null;
    let repeatInterval = null;

    for (const [key, value] of Object.entries(props)) {
        if (key === 'class') {
            el.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataVal]) => {
                el.dataset[dataKey] = dataVal;
            });
        } else if (key === 'onLongClick' && isType(value, "function")) {
            el.addEventListener("pointerdown", (e) => {
                if (el.disabled) return;
                holdTimer = setTimeout(() => {
                    value(e);
                    repeatInterval = setInterval(() => {
                        if (!el.disabled) value(e);
                        else clearRepeat();
                    }, LONG_CLICK_REPEAT);
                }, LONG_CLICK_DELAY);
            });

            const clearRepeat = () => {
                if (holdTimer) {
                    clearTimeout(holdTimer);
                    holdTimer = null;
                }
                if (repeatInterval) {
                    clearInterval(repeatInterval);
                    repeatInterval = null;
                }
            };

            el.addEventListener("pointerup", clearRepeat);
            el.addEventListener("pointerleave", clearRepeat);
            el.addEventListener("pointercancel", clearRepeat);
        } else if (key.startsWith('on') && isType(value, "function")) {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key === 'style' && isType(value, "object")) {
            Object.assign(el.style, value);
        } else if (value !== false && value != null) {
            el.setAttribute(key, value);
        }
    }

    const appendChild = (child) => {
        if (isType(child, "array")) {
            child.forEach(appendChild);
        } else if (isType(child, "string", "number")) {
            el.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            el.appendChild(child);
        }
    };

    appendChild(children);

    return el;
}

