import { isType } from "../utils/general.js";
import h from "../api/h.js";

export default function createModal({ title, content, position = "right", noDrop = false, destroy = false, onClose = () => { }, isPomodoro = false, portal = document.body } = {}) {
    let destroyed = false;
    let titleEl = null;
    let panel = null;
    let contentFrag = null;

    const toNode = (item) => {
        if (isType(item, "string")) {
            return [h("fragment", {}, item)];
        }
        return [item];
    };

    const createFragment = (input) =>
        h("fragment", {}, ...(isType(input, "array") ? input.flatMap(toNode) : toNode(input)));

    titleEl = h("h2", { class: "overlay-modal__title" }, title);

    const closeBtn = h("button", {
        class: "overlay-modal__close button button--icon button--transparent",
        type: "button",
        "aria-label": "Fermer le panneau",
        onClick: () => close()
    },
        h("i", { class: "button__icon icon icon--close", "aria-hidden": "true" })
    );

    const header = h("header", { class: "overlay-modal__header" }, titleEl, closeBtn);

    panel = h("aside", { class: "overlay-modal__panel" }, header, createFragment(content));

    const backdrop = h("section", {
        class: "overlay-modal__backdrop",
        tabIndex: -1,
        onClick: () => close()
    });

    const modal = h("section", {
        class: `overlay-modal visually-hidden ${position === "left" ? "overlay-modal__left" : ""} ${noDrop ? "overlay-modal__no_drop" : ""} ${isPomodoro ? "overlay-modal--pomodoro" : ""}`,
        role: "dialog",
        "aria-modal": "true",
        "aria-label": title
    }, backdrop, panel);
    portal?.appendChild(modal);

    function open() {
        if (destroyed) {
            portal?.appendChild(modal);
            destroyed = false;
        }
        modal.classList.remove('visually-hidden');
        modal.setAttribute('data-animate-modal', 'false');

        requestAnimationFrame(() => {
            setTimeout(() => {
                modal.setAttribute('data-animate-modal', 'true');
            }, 20);
        });
        document.body.style.overflow = "hidden";
    }

    function close() {
        modal.setAttribute('data-animate-modal', 'false');
        requestAnimationFrame(() => {
            setTimeout(() => {
                modal.classList.add('visually-hidden');
                if (destroy) {
                    modal.addEventListener('transitionend', () => {
                        destroyed = true;
                        modal.remove();
                    }, { once: true });
                }
            }, 220);
        });
        onClose?.();
        document.body.style.overflow = "";
    }

    function removeElement() {
        destroyed = true;
        modal.remove();
    }

    function update({ title, content }) {
        if (title && titleEl) titleEl.textContent = title;

        if (content && panel) {
            while (panel.children.length > 1) {
                panel.removeChild(panel.lastChild);
            }

            contentFrag = createFragment(content);
            panel.appendChild(contentFrag);
        }
    }

    return {
        open,
        close,
        destroy: removeElement,
        update,
        get el() {
            return modal;
        },
    };
}


